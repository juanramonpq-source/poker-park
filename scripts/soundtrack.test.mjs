import test from "node:test";
import assert from "node:assert/strict";
import { SoundtrackPlayer, prepareMusicLoop, SOUNDTRACK_FILES } from "../src/lib/game/soundtrack.ts";

function buffer() {
  const samples = Float32Array.from({ length: 8000 }, (_, i) => Math.sin(i / 80) * 0.2);
  return { sampleRate: 1000, length: 8000, duration: 8, numberOfChannels: 1, getChannelData: () => samples };
}
function context() {
  const sources = [];
  const gains = [];
  return {
    currentTime: 2, sources, gains,
    decodeAudioData: async () => buffer(),
    createBufferSource() {
      const source = { connect() {}, disconnect() {}, start() { this.started = true; }, stop() { this.stopped = true; this.onended?.(); } };
      sources.push(source); return source;
    },
    createGain() {
      const node = { connect() {}, disconnect() {}, gain: { value: 0, cancelScheduledValues() {}, setValueAtTime(v) { this.value = v; }, linearRampToValueAtTime(v) { this.value = v; } } };
      gains.push(node); return node;
    },
  };
}

test("all seven modes have distinct, same-origin music files", () => {
  assert.equal(Object.keys(SOUNDTRACK_FILES).length, 7);
  assert.equal(new Set(Object.values(SOUNDTRACK_FILES)).size, 7);
  assert.ok(Object.values(SOUNDTRACK_FILES).every(p => /^\/audio\/.+\.mp3$/.test(p)));
});

test("loop blends tail into head without allocating another whole track", () => {
  const audio = buffer();
  const original = audio.getChannelData(0).slice();
  const end = prepareMusicLoop(audio);
  assert.equal(end, 7);
  assert.equal(audio.getChannelData(0)[0], original[7000]);
  assert.equal(audio.getChannelData(0)[999], original[999]);
  assert.equal(audio.getChannelData(0)[3000], original[3000]);
});

test("plays a loop, reuses one cached track, and stops its old voice", async t => {
  let requests = 0;
  t.mock.method(globalThis, "fetch", async () => { requests++; return { ok: true, arrayBuffer: async () => new ArrayBuffer(4) }; });
  const ctx = context();
  const player = new SoundtrackPlayer(ctx, {});
  const fail = () => assert.fail("unexpected fallback");
  await player.play("title", fail);
  assert.equal(ctx.sources[0].started, true);
  assert.equal(ctx.sources[0].loop, true);
  assert.equal(ctx.sources[0].loopEnd, 7);
  await player.play("title", fail);
  assert.equal(requests, 1);
  assert.equal(ctx.sources[0].stopped, true);
  player.stop();
  assert.equal(ctx.sources[1].stopped, true);
});

test("stale downloads cannot start a previous mode or activate its fallback", async t => {
  let resolveOld;
  t.mock.method(globalThis, "fetch", url => url.includes("title")
    ? new Promise(resolve => { resolveOld = resolve; })
    : Promise.resolve({ ok: true, arrayBuffer: async () => new ArrayBuffer(4) }));
  const ctx = context(); const player = new SoundtrackPlayer(ctx, {});
  const pending = player.play("title", () => assert.fail("stale fallback"));
  await player.play("park", () => assert.fail("unexpected fallback"));
  resolveOld({ ok: true, arrayBuffer: async () => new ArrayBuffer(4) });
  await pending;
  assert.equal(ctx.sources.length, 1);
  player.stop();
});

test("HTTP and decode errors recover through the procedural fallback", async t => {
  t.mock.method(globalThis, "fetch", async () => ({ ok: false, status: 404 }));
  const ctx = context(); const player = new SoundtrackPlayer(ctx, {});
  let failures = 0;
  await player.play("night", () => failures++);
  assert.equal(failures, 1);
  assert.equal(ctx.sources.length, 0);
  globalThis.fetch = async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(4) });
  ctx.decodeAudioData = async () => { throw new Error("bad audio"); };
  await player.play("night", () => failures++);
  assert.equal(failures, 2);
});

test("stop while decoding prevents late playback", async t => {
  t.mock.method(globalThis, "fetch", async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(4) }));
  const ctx = context(); let finishDecode;
  ctx.decodeAudioData = () => new Promise(resolve => { finishDecode = resolve; });
  const player = new SoundtrackPlayer(ctx, {});
  const pending = player.play("storm", () => assert.fail("cancel is not a failure"));
  await new Promise(resolve => setImmediate(resolve));
  player.stop(); finishDecode(buffer()); await pending;
  assert.equal(ctx.sources.length, 0);
});
