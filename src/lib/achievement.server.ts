import { createHash } from "node:crypto";
import {
  normalizeAchievementSubmission,
  type AchievementSubmission,
} from "./achievement.ts";

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const MAX_BODY_BYTES = 16_384;
const DEFAULT_COOLDOWN_MS = 60_000;
const DEFAULT_MAX_LIMITER_ENTRIES = 1_000;

export interface AchievementLimiter {
  entries: Map<string, number>;
  cooldownMs: number;
  maxEntries: number;
}

export interface AchievementMailConfig {
  apiKey?: string;
  to?: string;
  from?: string;
  fetcher?: typeof fetch;
  now?: () => number;
  limiter?: AchievementLimiter;
}

class AchievementConfigurationError extends Error {}
class AchievementDeliveryError extends Error {}

export function createAchievementLimiter(options: {
  cooldownMs?: number;
  maxEntries?: number;
} = {}): AchievementLimiter {
  return {
    entries: new Map(),
    cooldownMs: options.cooldownMs ?? DEFAULT_COOLDOWN_MS,
    maxEntries: options.maxEntries ?? DEFAULT_MAX_LIMITER_ENTRIES,
  };
}

const productionLimiter = createAchievementLimiter();

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatPlayTime(seconds: number) {
  const hours = Math.floor(seconds / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);
  if (hours > 0) return `${hours} h ${minutes} min`;
  if (minutes > 0) return `${minutes} min`;
  return `${seconds} s`;
}

function emailContent(submission: AchievementSubmission) {
  const message = submission.message || "Sin mensaje adicional.";
  const challengeList = submission.completedChallenges.join(", ");
  const time = formatPlayTime(submission.stats.activePlaySeconds);
  const text = [
    "Nueva hazaña en Poker Park",
    "",
    `Nombre: ${submission.name}`,
    `Correo: ${submission.email}`,
    `Satisfacción: ${submission.rating}/5`,
    `Mensaje: ${message}`,
    "",
    `Tiempo activo: ${time}`,
    `Jornadas terminadas: ${submission.stats.finishedDays}`,
    `Parques perfectos: ${submission.stats.perfectDays}`,
    `Atracciones completadas: ${submission.stats.completedAttractions}`,
    `Retos superados: ${challengeList}`,
  ].join("\n");

  const row = (label: string, value: string | number) =>
    `<tr><th align="left" style="padding:6px 12px 6px 0">${escapeHtml(label)}</th><td style="padding:6px 0">${escapeHtml(String(value))}</td></tr>`;
  const html = [
    '<div style="font-family:system-ui,sans-serif;color:#34251c;line-height:1.5">',
    "<h1>Nueva hazaña en Poker Park</h1>",
    "<table>",
    row("Nombre", submission.name),
    row("Correo", submission.email),
    row("Satisfacción", `${submission.rating}/5`),
    row("Tiempo activo", time),
    row("Jornadas terminadas", submission.stats.finishedDays),
    row("Parques perfectos", submission.stats.perfectDays),
    row("Atracciones completadas", submission.stats.completedAttractions),
    row("Retos superados", challengeList),
    "</table>",
    "<h2>Mensaje</h2>",
    `<p style="white-space:pre-wrap">${escapeHtml(message)}</p>`,
    "</div>",
  ].join("");

  return { html, text };
}

function resolvedConfig(config: AchievementMailConfig) {
  return {
    apiKey: config.apiKey ?? process.env.RESEND_API_KEY,
    to: config.to ?? process.env.PENTONUI_ACHIEVEMENT_TO,
    from: config.from ?? process.env.PENTONUI_ACHIEVEMENT_FROM,
    fetcher: config.fetcher ?? fetch,
  };
}

export async function sendAchievementEmail(
  input: AchievementSubmission,
  config: AchievementMailConfig = {},
): Promise<{ id: string }> {
  const { apiKey, to, from, fetcher } = resolvedConfig(config);
  if (!apiKey?.trim() || !to?.trim() || !from?.trim()) {
    throw new AchievementConfigurationError("Achievement mail is not configured");
  }

  const { html, text } = emailContent(input);
  let response: Response;
  try {
    response = await fetcher(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        reply_to: input.email,
        subject: `Hazaña de Poker Park · ${input.name}`,
        html,
        text,
      }),
    });
  } catch {
    throw new AchievementDeliveryError("Achievement provider could not be reached");
  }

  if (!response.ok) {
    throw new AchievementDeliveryError("Achievement provider rejected the message");
  }

  try {
    const result = await response.json() as { id?: unknown };
    if (typeof result.id !== "string" || !result.id) throw new Error("missing id");
    return { id: result.id };
  } catch {
    throw new AchievementDeliveryError("Achievement provider returned an invalid receipt");
  }
}

function json(status: number, body: { ok: boolean; code?: string }, headers?: HeadersInit) {
  return Response.json(body, { status, headers });
}

function originKey(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",", 1)[0]?.trim();
  const proxyAddress = forwarded || request.headers.get("x-real-ip")?.trim() || "unknown";
  return createHash("sha256").update(proxyAddress).digest("hex");
}

function isCoolingDown(limiter: AchievementLimiter, key: string, now: number) {
  const lastAccepted = limiter.entries.get(key);
  return lastAccepted !== undefined && now - lastAccepted < limiter.cooldownMs;
}

function rememberAccepted(limiter: AchievementLimiter, key: string, now: number) {
  limiter.entries.delete(key);
  while (limiter.entries.size >= Math.max(1, limiter.maxEntries)) {
    const oldestKey = limiter.entries.keys().next().value as string | undefined;
    if (oldestKey === undefined) break;
    limiter.entries.delete(oldestKey);
  }
  limiter.entries.set(key, now);
}

export async function handleAchievement(
  request: Request,
  config: AchievementMailConfig = {},
): Promise<Response> {
  if (request.method !== "POST") {
    return json(405, { ok: false, code: "method_not_allowed" }, { allow: "POST" });
  }

  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.startsWith("application/json")) {
    return json(415, { ok: false, code: "content_type" });
  }

  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return json(413, { ok: false, code: "payload_too_large" });
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return json(400, { ok: false, code: "invalid_payload" });
  }
  if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
    return json(413, { ok: false, code: "payload_too_large" });
  }

  const now = config.now?.() ?? Date.now();
  let submission: AchievementSubmission;
  try {
    submission = normalizeAchievementSubmission(JSON.parse(rawBody), now);
  } catch {
    return json(400, { ok: false, code: "invalid_payload" });
  }

  const limiter = config.limiter ?? productionLimiter;
  const key = originKey(request);
  if (isCoolingDown(limiter, key, now)) {
    return json(429, { ok: false, code: "rate_limited" }, { "retry-after": String(Math.ceil(limiter.cooldownMs / 1_000)) });
  }

  try {
    await sendAchievementEmail(submission, config);
    rememberAccepted(limiter, key, now);
    return json(200, { ok: true });
  } catch (error) {
    if (error instanceof AchievementConfigurationError) {
      return json(503, { ok: false, code: "unavailable" });
    }
    return json(502, { ok: false, code: "delivery_failed" });
  }
}
