/** Recorded music shares the existing mixer; gameplay and SFX stay independent. */
export type SoundtrackMode = "title" | "park" | "night" | "festival" | "mirror" | "storm" | "impossible";

export const SOUNDTRACK_FILES: Record<SoundtrackMode, string> = {
  title: "/audio/title-suno-v1.mp3",
  park: "/audio/park-suno-v1.mp3",
  night: "/audio/night-suno-v1.mp3",
  festival: "/audio/festival-suno-v1.mp3",
  mirror: "/audio/mirror-suno-v1.mp3",
  storm: "/audio/storm-suno-v1.mp3",
  impossible: "/audio/impossible-suno-v1.mp3",
};

/** Blend the tail into the beginning in place, avoiding a second large PCM allocation. */
export function prepareMusicLoop(buffer: AudioBuffer): number {
  const overlap = Math.min(Math.floor(buffer.sampleRate * 1.5), Math.floor(buffer.length / 8));
  if (overlap < 2) return buffer.duration;
  const end = buffer.length - overlap;
  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    const samples = buffer.getChannelData(channel);
    for (let i = 0; i < overlap; i++) {
      const mix = i / (overlap - 1);
      samples[i] = samples[end + i]! * (1 - mix) + samples[i]! * mix;
    }
  }
  return end / buffer.sampleRate;
}

type Voice = { source: AudioBufferSourceNode; gain: GainNode };

export class SoundtrackPlayer {
  private generation = 0;
  private request: AbortController | null = null;
  private voice: Voice | null = null;
  // Only the latest decoded song is retained: seven stereo tracks would be too large on mobile.
  private cached: { mode: SoundtrackMode; buffer: AudioBuffer; loopEnd: number } | null = null;

  private context: AudioContext;
  private destination: AudioNode;

  constructor(context: AudioContext, destination: AudioNode) {
    this.context = context;
    this.destination = destination;
  }

  stop(fade = 0.65) {
    this.generation++;
    this.request?.abort();
    this.request = null;
    if (!this.voice) return;
    const { source, gain } = this.voice;
    this.voice = null;
    const time = this.context.currentTime;
    gain.gain.cancelScheduledValues(time);
    gain.gain.setValueAtTime(gain.gain.value, time);
    gain.gain.linearRampToValueAtTime(0, time + fade);
    try { source.stop(time + fade + 0.02); } catch { /* already stopped */ }
  }

  async play(mode: SoundtrackMode, onFailure: () => void): Promise<void> {
    this.stop();
    const generation = this.generation;
    const controller = new AbortController();
    this.request = controller;
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      let music = this.cached?.mode === mode ? this.cached : null;
      if (!music) {
        this.cached = null;
        const response = await fetch(SOUNDTRACK_FILES[mode], { signal: controller.signal });
        if (!response.ok) throw new Error(`Music unavailable: ${response.status}`);
        const data = await response.arrayBuffer();
        if (generation !== this.generation) return;
        if (controller.signal.aborted) throw new Error("Music loading timed out");
        const buffer = await this.context.decodeAudioData(data);
        if (generation !== this.generation || controller.signal.aborted) {
          if (generation === this.generation) onFailure();
          return;
        }
        if (!Number.isFinite(buffer.duration) || buffer.duration < 5 || buffer.duration > 600) {
          throw new Error("Invalid soundtrack duration");
        }
        music = { mode, buffer, loopEnd: prepareMusicLoop(buffer) };
        this.cached = music;
      }
      if (generation !== this.generation) return;
      const source = this.context.createBufferSource();
      const gain = this.context.createGain();
      source.buffer = music.buffer;
      source.loop = true;
      source.loopEnd = music.loopEnd;
      source.connect(gain);
      gain.connect(this.destination);
      gain.gain.setValueAtTime(0, this.context.currentTime);
      gain.gain.linearRampToValueAtTime(0.65, this.context.currentTime + 1.2);
      source.onended = () => { source.disconnect(); gain.disconnect(); };
      this.voice = { source, gain };
      source.start();
    } catch {
      if (generation === this.generation) onFailure();
    } finally {
      clearTimeout(timeout);
      if (this.request === controller) this.request = null;
    }
  }
}
