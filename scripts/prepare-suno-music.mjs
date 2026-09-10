// Process only songs downloaded through Suno's official, licensed download UI.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from "node:fs";
import { resolve } from "node:path";
import { homedir } from "node:os";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";

const titles = {
  title: "Poker Park - Bienvenidos al parque",
  park: "Poker Park - Un dia en el parque",
  night: "Poker Park - Guardianes del alba",
  festival: "Poker Park - Festival de las luces",
  mirror: "Poker Park - Al otro lado del espejo",
  storm: "Poker Park - Bailando bajo la tormenta",
  impossible: "Poker Park - El parque de las 00 13",
};
const output = resolve("public/audio");
const originals = resolve("artifacts/suno-originals");
mkdirSync(output, { recursive: true }); mkdirSync(originals, { recursive: true });
const sha256 = path => createHash("sha256").update(readFileSync(path)).digest("hex");
const probe = path => JSON.parse(execFileSync("ffprobe", ["-v", "error", "-show_format", "-show_streams", "-of", "json", path], { encoding: "utf8" }));
const tracks = [];
for (const [mode, title] of Object.entries(titles)) {
  const input = resolve(homedir(), "Downloads", `${title}.mp3`);
  const meta = probe(input);
  const comment = meta.format.tags?.comment ?? "";
  const id = comment.match(/id=([0-9a-f-]{36})/)?.[1];
  if (!id || !comment.includes("made with suno") || meta.format.tags?.title !== title) {
    throw new Error(`Missing official Suno provenance for ${mode}`);
  }
  copyFileSync(input, resolve(originals, `${mode}-${id}.mp3`));
  const target = resolve(output, `${mode}-suno-v1.mp3`);
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", input, "-map_metadata", "0", "-vn", "-af", "loudnorm=I=-18:TP=-2:LRA=9", "-ar", "44100", "-c:a", "libmp3lame", "-b:a", "128k", "-id3v2_version", "3", target]);
  const checked = probe(target);
  if (checked.format.tags?.comment !== comment) throw new Error(`Lost provenance metadata: ${mode}`);
  const duration = Number(checked.format.duration);
  if (duration < 20 || Math.abs(duration - Number(meta.format.duration)) > 0.2) throw new Error(`Invalid duration: ${mode}`);
  const track = { mode, title, sunoSongId: id, sourceUrl: `https://suno.com/song/${id}`, officialDownloadMetadata: comment,
    planAtDownload: "Pro", sourceSha256: sha256(input), file: `/audio/${mode}-suno-v1.mp3`, sha256: sha256(target),
    durationSeconds: duration, bytes: Number(checked.format.size), codec: checked.streams[0].codec_name };
  tracks.push(track); console.log(`${mode}: ${duration.toFixed(1)} s, ${(track.bytes / 1048576).toFixed(2)} MB, ${id}`);
}
writeFileSync("docs/suno-music-manifest.json", JSON.stringify({
  preparedAt: new Date().toISOString(), process: "Official Suno downloads; original metadata retained; 128 kbps MP3, 44.1 kHz, loudnorm -18 LUFS / -2 dBTP / 9 LRA; runtime 1.5 s tail/head crossfade",
  tracks,
}, null, 2) + "\n");
