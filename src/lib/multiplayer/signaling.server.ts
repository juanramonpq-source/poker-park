import { z } from "zod";
import { dbSource, getSql, type Sql } from "@/lib/db";
import type { PeerRow, RtcPollResponse, SignalRow } from "./p2p";

const ID = z.string().regex(/^[a-zA-Z0-9_-]{1,64}$/);
const signalSchema = z.object({
  op: z.literal("signal"),
  room: ID,
  from: ID,
  to: ID,
  kind: z.enum(["offer", "answer", "ice"]),
  payload: z
    .unknown()
    .refine((value) => value !== undefined && JSON.stringify(value).length <= 32_768),
});
const leaveSchema = z.object({ op: z.literal("leave"), room: ID, peer: ID });
const postSchema = z.discriminatedUnion("op", [signalSchema, leaveSchema]);
const PEER_TTL_SECONDS = 30;
const SIGNAL_TTL_SECONDS = 60;

type MemoryPeer = { name: string; lastSeen: number };
type MemorySignal = SignalRow & { room: string; to: string; createdAt: number };
const globalRef = globalThis as typeof globalThis & {
  __rtcSchemaPromise__?: Promise<void>;
  __rtcMemoryPeers__?: Map<string, Map<string, MemoryPeer>>;
  __rtcMemorySignals__?: MemorySignal[];
  __rtcMemorySignalId__?: number;
};
globalRef.__rtcMemoryPeers__ ??= new Map();
globalRef.__rtcMemorySignals__ ??= [];
globalRef.__rtcMemorySignalId__ ??= 0;

function memoryPoll(room: string, peer: string, name: string, since: number): RtcPollResponse {
  const now = Date.now();
  const peerTtl = PEER_TTL_SECONDS * 1000;
  const signalTtl = SIGNAL_TTL_SECONDS * 1000;
  for (const [roomId, peers] of globalRef.__rtcMemoryPeers__!) {
    for (const [peerId, value] of peers) if (now - value.lastSeen > peerTtl) peers.delete(peerId);
    if (peers.size === 0) globalRef.__rtcMemoryPeers__!.delete(roomId);
  }
  globalRef.__rtcMemorySignals__ = globalRef.__rtcMemorySignals__!.filter(
    (signal) => now - signal.createdAt <= signalTtl,
  );
  const peers = globalRef.__rtcMemoryPeers__!.get(room) ?? new Map<string, MemoryPeer>();
  peers.set(peer, { name, lastSeen: now });
  globalRef.__rtcMemoryPeers__!.set(room, peers);
  return {
    peers: [...peers]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(0, 32)
      .map(([id, value]) => ({ id, name: value.name })),
    signals: globalRef
      .__rtcMemorySignals__!.filter(
        (signal) => signal.room === room && signal.to === peer && signal.id > since,
      )
      .slice(0, 200)
      .map(({ id, from, kind, payload }) => ({ id, from, kind, payload })),
  };
}

function memoryPost(message: z.infer<typeof postSchema>) {
  if (message.op === "leave") {
    globalRef.__rtcMemoryPeers__!.get(message.room)?.delete(message.peer);
    return;
  }
  globalRef.__rtcMemorySignalId__! += 1;
  globalRef.__rtcMemorySignals__!.push({
    id: globalRef.__rtcMemorySignalId__!,
    room: message.room,
    to: message.to,
    from: message.from,
    kind: message.kind,
    payload: message.payload,
    createdAt: Date.now(),
  });
}

function ensureSchema(sql: Sql): Promise<void> {
  globalRef.__rtcSchemaPromise__ ??= (async () => {
    await sql.query(`CREATE TABLE IF NOT EXISTS webrtc_peers (
      room TEXT NOT NULL, peer_id TEXT NOT NULL, name TEXT NOT NULL DEFAULT '',
      last_seen TIMESTAMPTZ NOT NULL DEFAULT now(), PRIMARY KEY (room, peer_id))`);
    await sql.query(`CREATE TABLE IF NOT EXISTS webrtc_signals (
      id BIGSERIAL PRIMARY KEY, room TEXT NOT NULL, to_peer TEXT NOT NULL,
      from_peer TEXT NOT NULL, kind TEXT NOT NULL, payload JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now())`);
    await sql.query(`CREATE INDEX IF NOT EXISTS webrtc_signals_inbox
      ON webrtc_signals (room, to_peer, id)`);
  })().catch((error) => {
    globalRef.__rtcSchemaPromise__ = undefined;
    throw error;
  });
  return globalRef.__rtcSchemaPromise__;
}

async function roster(sql: Sql, room: string): Promise<PeerRow[]> {
  const rows = await sql.query<{ peer_id: string; name: string }>(
    `SELECT peer_id, name FROM webrtc_peers
     WHERE room = $1 AND last_seen > now() - make_interval(secs => $2)
     ORDER BY peer_id LIMIT 32`,
    [room, PEER_TTL_SECONDS],
  );
  return rows.map((row) => ({ id: row.peer_id, name: row.name }));
}

async function touchPeer(sql: Sql, room: string, peer: string, name: string) {
  await sql.query(
    `INSERT INTO webrtc_peers (room, peer_id, name, last_seen)
    VALUES ($1, $2, $3, now()) ON CONFLICT (room, peer_id)
    DO UPDATE SET last_seen = now(), name = EXCLUDED.name`,
    [room, peer, name],
  );
}

async function prune(sql: Sql) {
  await Promise.all([
    sql.query(`DELETE FROM webrtc_signals WHERE created_at < now() - make_interval(secs => $1)`, [
      SIGNAL_TTL_SECONDS,
    ]),
    sql.query(`DELETE FROM webrtc_peers WHERE last_seen < now() - make_interval(secs => $1)`, [
      PEER_TTL_SECONDS,
    ]),
  ]);
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

async function handleGet(url: URL): Promise<Response> {
  const parsed = z
    .object({
      room: ID,
      peer: ID,
      name: z.string().max(64).default(""),
      since: z.coerce.number().int().min(0).default(0),
    })
    .safeParse({
      room: url.searchParams.get("room"),
      peer: url.searchParams.get("peer"),
      name: url.searchParams.get("name") ?? "",
      since: url.searchParams.get("since") ?? 0,
    });
  if (!parsed.success) return json({ error: "invalid query" }, 400);
  const { room, peer, name, since } = parsed.data;
  if (dbSource === "pglite") return json(memoryPoll(room, peer, name, since));
  const sql = await getSql();
  await ensureSchema(sql);
  if (since === 0 || Math.random() < 0.02) await prune(sql);
  await touchPeer(sql, room, peer, name);
  const rows = await sql.query<{
    id: number;
    from_peer: string;
    kind: SignalRow["kind"];
    payload: unknown;
  }>(
    `SELECT id, from_peer, kind, payload FROM webrtc_signals
     WHERE room = $1 AND to_peer = $2 AND id > $3 ORDER BY id LIMIT 200`,
    [room, peer, since],
  );
  const body: RtcPollResponse = {
    peers: await roster(sql, room),
    signals: rows.map((row) => ({
      id: row.id,
      from: row.from_peer,
      kind: row.kind,
      payload: row.payload,
    })),
  };
  return json(body);
}

async function handlePost(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid JSON" }, 400);
  }
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) return json({ error: "invalid request" }, 400);
  const message = parsed.data;
  if (dbSource === "pglite") {
    memoryPost(message);
    return json({ ok: true });
  }
  const sql = await getSql();
  await ensureSchema(sql);
  if (message.op === "signal") {
    await sql.query(
      `INSERT INTO webrtc_signals (room, to_peer, from_peer, kind, payload)
      VALUES ($1, $2, $3, $4, $5)`,
      [message.room, message.to, message.from, message.kind, JSON.stringify(message.payload)],
    );
  } else {
    await sql.query(`DELETE FROM webrtc_peers WHERE room = $1 AND peer_id = $2`, [
      message.room,
      message.peer,
    ]);
  }
  return json({ ok: true });
}

export async function handleSignaling(request: Request): Promise<Response> {
  try {
    if (request.method === "GET") return await handleGet(new URL(request.url));
    if (request.method === "POST") return await handlePost(request);
    return json({ error: "method not allowed" }, 405);
  } catch (error) {
    console.error("[rtc] signaling error:", error);
    return json({ error: "signaling failed" }, 500);
  }
}
