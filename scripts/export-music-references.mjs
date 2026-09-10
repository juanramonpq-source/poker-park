// Offline production references. Does not change the game's audio or saved data.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { chromium } from "playwright";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = resolve(root, "artifacts/music-references");
await mkdir(output, { recursive: true });
const source = await readFile(resolve(root, "src/lib/game/audio.ts"), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
}).outputText.replace(/^export /gm, "").replace(/^import .*;\s*$/gm, "");
const render = `${compiled}
return async function renderReference(mode, melodyOnly) {
  const scores = { title: TITLE_SCORE, park: PARK_SCORE, night: NIGHT_SCORE, festival: FESTIVAL_SCORE, mirror: MIRROR_SCORE, storm: STORM_SCORE, impossible: IMPOSSIBLE_SCORE };
  const beats = { title: .86, park: .56, night: .74, festival: .42, mirror: .68, storm: .4, impossible: .46 };
  const score = scores[mode], beat = beats[mode];
  const phraseSeconds = score.reduce((sum, step) => sum + step.beats * beat, 0);
  const sampleRate = 44100, duration = phraseSeconds + 2;
  ctx = new OfflineAudioContext(1, Math.ceil(duration * sampleRate), sampleRate);
  musicBus = ctx.createGain(); musicBus.gain.value = 1; musicBus.connect(ctx.destination);
  proceduralBus = musicBus;
  makeNoise();
  if (!melodyOnly) startPads(mode);
  let at = .1;
  score.forEach((step, index) => {
    if (melodyOnly) {
      if (step.m) tone(step.m, Math.max(.18, step.beats * beat * .92), 'sine', .12, musicBus, .02, 0, at);
    } else scheduleStep(at, step, beat, index, mode);
    at += step.beats * beat;
  });
  for (const node of padNodes) {
    node.gain.gain.setValueAtTime(node.gain.gain.value, at);
    node.gain.gain.linearRampToValueAtTime(0, at + .8);
    node.osc.stop(at + 1);
  }
  const rendered = await ctx.startRendering();
  const data = rendered.getChannelData(0);
  let peak = 0;
  for (const sample of data) peak = Math.max(peak, Math.abs(sample));
  if (!(peak > 0) || !Number.isFinite(peak)) throw new Error('Invalid render: ' + mode);
  const bytes = new Uint8Array(44 + data.length * 2), view = new DataView(bytes.buffer);
  const ascii = (offset, text) => { for (let i = 0; i < text.length; i++) bytes[offset + i] = text.charCodeAt(i); };
  ascii(0, 'RIFF'); view.setUint32(4, bytes.length - 8, true); ascii(8, 'WAVE'); ascii(12, 'fmt ');
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true); view.setUint16(34, 16, true); ascii(36, 'data'); view.setUint32(40, data.length * 2, true);
  const gain = .75 / peak;
  for (let i = 0; i < data.length; i++) view.setInt16(44 + i * 2, Math.round(Math.max(-1, Math.min(1, data[i] * gain)) * 32767), true);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 16384) binary += String.fromCharCode(...bytes.subarray(i, i + 16384));
  return { base64: btoa(binary), phraseSeconds, duration, bpm: 60 / beat, notes: score, sourcePeak: peak };
};`;

const browser = await chromium.launch({ executablePath: process.env.POKER_PARK_CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
const manifest = { sourceSha256: createHash("sha256").update(source).digest("hex"), tracks: [] };
try {
  const page = await browser.newPage();
  for (const mode of ["title", "park", "night", "festival", "mirror", "storm", "impossible"]) {
    for (const melodyOnly of [false, true]) {
      const result = await page.evaluate(async ({ render, mode, melodyOnly }) => new Function(render)()(mode, melodyOnly), { render, mode, melodyOnly });
      const name = `${mode}-${melodyOnly ? "melody" : "reference"}.wav`;
      const audio = Buffer.from(result.base64, "base64");
      if (audio.toString("ascii", 0, 4) !== "RIFF" || audio.length < 44100) throw new Error(`Invalid WAV: ${name}`);
      await writeFile(resolve(output, name), audio);
      const { base64, ...metadata } = result;
      manifest.tracks.push({ file: name, bytes: audio.length, sha256: createHash("sha256").update(audio).digest("hex"), ...metadata });
      console.log(`${name}: ${result.phraseSeconds.toFixed(2)}s, ${result.bpm.toFixed(2)} BPM`);
    }
  }
  await writeFile(resolve(output, "manifest.json"), JSON.stringify(manifest, null, 2));
} finally { await browser.close(); }
console.log(`References saved: ${output}`);
