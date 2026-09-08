import type { GameChallenge } from "./types";

type MusicMode = "off" | "title" | "park" | "night" | "festival" | "mirror" | "storm" | "impossible";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let musicBus: GainNode | null = null;
let sfxBus: GainNode | null = null;
let noiseBuf: AudioBuffer | null = null;
let rainBuf: AudioBuffer | null = null;
let muted = false;
let musicMode: MusicMode = "off";
let musicTimer = 0;
let nextNote = 0;
let noteIndex = 0;
let visBound = false;
let padNodes: { osc: OscillatorNode; gain: GainNode }[] = [];
let crowd: { src: AudioBufferSourceNode; gain: GainNode; filter: BiquadFilterNode } | null = null;
let weatherNodes: { src: AudioBufferSourceNode; gain: GainNode; filters: BiquadFilterNode[] }[] = [];

const C3 = 130.81,
  D3 = 146.83,
  E3 = 164.81,
  F3 = 174.61,
  G3 = 196.0,
  A3 = 220.0,
  BB3 = 233.08,
  B3 = 246.94,
  C4 = 261.63,
  CS4 = 277.18,
  D4 = 293.66,
  DS4 = 311.13,
  E4 = 329.63,
  F4 = 349.23,
  FS4 = 369.99,
  G4 = 392.0,
  GS4 = 415.3,
  A4 = 440.0,
  B4 = 493.88,
  C5 = 523.25,
  CS5 = 554.37,
  D5 = 587.33,
  DS5 = 622.25,
  E5 = 659.25,
  F5 = 698.46,
  FS5 = 739.99,
  G5 = 783.99,
  GS5 = 830.61,
  A5 = 880.0,
  B5 = 987.77,
  C6 = 1046.5,
  D6 = 1174.66,
  E6 = 1318.51,
  F6 = 1396.91;

type Step = {
  m: number;
  beats: number;
  bass?: number;
  chord?: [number, number, number];
};

const CH_C: [number, number, number] = [C3, E3, G3];
const CH_G: [number, number, number] = [G3, B3, D4];
const CH_F: [number, number, number] = [F3, A3, C4];
const CH_AM: [number, number, number] = [A3, C4, E4];
const CH_EM: [number, number, number] = [E3, G3, B3];
const CH_DM: [number, number, number] = [D3, F3, A3];
const CH_BB: [number, number, number] = [BB3, D4, F4];
const CH_GM: [number, number, number] = [G3, BB3, D4];
const CH_STORM: [number, number, number] = [D3, F3, GS4 / 2];
const CH_VOID: [number, number, number] = [D3, GS4 / 2, CS4];
const CH_C_TITLE: [number, number, number] = [C4, E4, G4];
const CH_G_TITLE: [number, number, number] = [G3, B3, D4];
const CH_F_TITLE: [number, number, number] = [F3, A3, C4];
const CH_AM_TITLE: [number, number, number] = [A3, C4, E4];

function s(m: number, beats: number, bass?: number, chord?: [number, number, number]): Step {
  return { m, beats, bass, chord };
}

const PARK_SCORE: Step[] = [
  s(C5, 2, C3, CH_C), s(E5, 1),
  s(G5, 2, G3), s(E5, 1),
  s(A5, 2, A3, CH_AM), s(G5, 1),
  s(E5, 3, C3, CH_C),
  s(D5, 2, G3, CH_G), s(E5, 1),
  s(F5, 2, F3, CH_F), s(D5, 1),
  s(E5, 1, C3, CH_C), s(D5, 1), s(C5, 1),
  s(G4, 3, G3, CH_G),

  s(C5, 2, C3, CH_C), s(E5, 1),
  s(G5, 2, E3), s(A5, 1),
  s(C6, 2, F3, CH_F), s(B5, 1),
  s(A5, 3, A3, CH_AM),
  s(G5, 2, C3, CH_C), s(E5, 1),
  s(F5, 2, D3, CH_DM), s(A5, 1),
  s(G5, 2, G3, CH_G), s(B4, 1),
  s(C5, 3, C3, CH_C),

  s(0, 1, C3, CH_C), s(E5, 1), s(G5, 1),
  s(C6, 2, C3), s(G5, 1),
  s(A5, 1, F3, CH_F), s(G5, 1), s(F5, 1),
  s(E5, 3, C3, CH_C),
  s(D5, 1, G3, CH_G), s(0, 1), s(B4, 1),
  s(C5, 2, A3, CH_AM), s(E5, 1),
  s(D5, 2, G3, CH_G), s(F5, 1),
  s(E5, 3, C3, CH_C),

  s(E5, 2, E3, CH_EM), s(G5, 1),
  s(A5, 2, A3, CH_AM), s(G5, 1),
  s(B5, 1, G3, CH_G), s(A5, 1), s(G5, 1),
  s(E5, 3, E3, CH_EM),
  s(F5, 2, F3, CH_F), s(A5, 1),
  s(G5, 2, C3, CH_C), s(E5, 1),
  s(D5, 2, G3, CH_G), s(B4, 1),
  s(C5, 3, C3, CH_C),

  s(C5, 1, C3, CH_C), s(0, 1), s(E5, 1),
  s(G5, 2, G3), s(0, 1),
  s(A4, 1, F3, CH_F), s(C5, 1), s(E5, 1),
  s(G5, 3, C3, CH_C),
  s(F5, 1, D3, CH_DM), s(0, 1), s(D5, 1),
  s(E5, 2, A3, CH_AM), s(C5, 1),
  s(D5, 1, G3, CH_G), s(0, 1), s(B4, 1),
  s(C5, 3, C3, CH_C),

  s(G4, 2, G3, CH_G), s(C5, 1),
  s(E5, 2, C3, CH_C), s(G5, 1),
  s(A5, 1, F3, CH_F), s(G5, 1), s(F5, 1),
  s(E5, 3, C3, CH_C),
  s(D5, 2, G3, CH_G), s(G5, 1),
  s(F5, 1, F3, CH_F), s(E5, 1), s(D5, 1),
  s(C5, 2, C3, CH_C), s(E5, 1),
  s(C5, 3, C3, CH_C),

  s(E5, 1, C3, CH_C), s(G5, 1), s(C6, 1),
  s(B5, 2, G3, CH_G), s(G5, 1),
  s(A5, 2, A3, CH_AM), s(E5, 1),
  s(G5, 3, C3, CH_C),
  s(F5, 2, F3, CH_F), s(A5, 1),
  s(G5, 1, G3, CH_G), s(F5, 1), s(E5, 1),
  s(D5, 2, G3, CH_G), s(G4, 1),
  s(C5, 3, C3, CH_C),
];

const TITLE_SCORE: Step[] = [
  s(E5, 4, C3, CH_C_TITLE), s(0, 2),
  s(G5, 3, G3, CH_G_TITLE), s(E5, 3),
  s(A5, 4, A3, CH_AM_TITLE), s(0, 2),
  s(G5, 3, F3, CH_F_TITLE), s(E5, 3),

  s(C5, 4, C3, CH_C_TITLE), s(0, 2),
  s(D5, 3, G3, CH_G_TITLE), s(G4, 3),
  s(A4, 4, A3, CH_AM_TITLE), s(C5, 2),
  s(E5, 4, F3, CH_F_TITLE), s(0, 2),
];

// "Ronda de las 00:07": tres pasajes largos para que la guardia respire y no
// se perciba como un bucle corto. Los silencios forman parte de la melodía.
const NIGHT_SCORE: Step[] = [
  // A · Las luces se apagan
  s(D5, 3, D3, CH_DM), s(0, 1), s(F5, 2), s(A5, 2),
  s(G5, 3, BB3, CH_BB), s(F5, 1), s(D5, 2), s(0, 2),
  s(C5, 2, F3, CH_F), s(D5, 2), s(F5, 3), s(E5, 1),
  s(D5, 4, C3, CH_C), s(0, 2),

  s(A4, 2, D3, CH_DM), s(D5, 2), s(F5, 3), s(A5, 1),
  s(G5, 2, G3, CH_GM), s(D5, 2), s(BB3 * 2, 3), s(0, 1),
  s(C5, 2, C3, CH_C), s(E5, 2), s(G5, 2), s(E5, 2),
  s(D5, 5, D3, CH_DM), s(0, 3),

  // B · Ronda entre atracciones
  s(F5, 2, BB3, CH_BB), s(A5, 2), s(C6, 3), s(A5, 1),
  s(G5, 3, F3, CH_F), s(E5, 1), s(F5, 2), s(0, 2),
  s(E5, 2, C3, CH_C), s(G5, 2), s(B5, 3), s(G5, 1),
  s(A5, 4, A3, CH_AM), s(0, 2), s(E5, 2),

  s(D5, 2, G3, CH_GM), s(F5, 2), s(G5, 3), s(BB3 * 2, 1),
  s(A4, 2, D3, CH_DM), s(D5, 2), s(A5, 2), s(F5, 2),
  s(E5, 3, C3, CH_C), s(D5, 1), s(C5, 2), s(G4, 2),
  s(A4, 5, A3, CH_AM), s(0, 3),

  // C · Primera luz del amanecer
  s(D5, 2, D3, CH_DM), s(F5, 2), s(A5, 2), s(C6, 2),
  s(B5, 3, G3, CH_GM), s(A5, 1), s(G5, 2), s(D5, 2),
  s(F5, 3, BB3, CH_BB), s(A5, 1), s(C6, 2), s(A5, 2),
  s(G5, 4, C3, CH_C), s(0, 2), s(E5, 2),

  s(F5, 2, F3, CH_F), s(E5, 2), s(D5, 3), s(A4, 1),
  s(C5, 2, C3, CH_C), s(E5, 2), s(G5, 3), s(E5, 1),
  s(D5, 3, D3, CH_DM), s(A4, 1), s(C5, 2), s(F5, 2),
  s(D5, 6, D3, CH_DM), s(0, 4),
];

// Cada reto tiene un motivo propio. Son composiciones procedurales originales:
// no descargan audio ni dependen de licencias externas.
const FESTIVAL_SCORE: Step[] = [
  s(C5, 1, C3, CH_C), s(E5, 1), s(G5, 1), s(C6, 1),
  s(A5, 1, F3, CH_F), s(G5, 1), s(E5, 1), s(C5, 1),
  s(D5, 1, G3, CH_G), s(G5, 1), s(B5, 1), s(D6, 1),
  s(C6, 2, C3, CH_C), s(G5, 1), s(E5, 1),
  s(A5, 1, A3, CH_AM), s(C6, 1), s(E6, 1), s(C6, 1),
  s(F5, 1, F3, CH_F), s(A5, 1), s(C6, 1), s(A5, 1),
  s(G5, 1, G3, CH_G), s(B5, 1), s(D6, 1), s(B5, 1),
  s(C6, 3, C3, CH_C), s(0, 1),
];

const MIRROR_SCORE: Step[] = [
  s(A5, 2, A3, CH_AM), s(E5, 1), s(C5, 1),
  s(B4, 2, E3, CH_EM), s(E5, 1), s(G5, 1),
  s(F5, 2, F3, CH_F), s(C5, 1), s(A4, 1),
  s(D5, 3, D3, CH_DM), s(0, 1),
  s(D5, 2, D3, CH_DM), s(A4, 1), s(F5, 1),
  s(G5, 2, E3, CH_EM), s(E5, 1), s(B4, 1),
  s(C5, 2, A3, CH_AM), s(E5, 1), s(A5, 1),
  s(A4, 3, A3, CH_AM), s(0, 1),
];

const STORM_SCORE: Step[] = [
  // Motor de emergencia: ostinato corto, ascensos y cortes que no dejan reposar.
  s(D5, 0.5, D3, CH_STORM), s(A4, 0.5), s(D5, 0.5), s(F5, 0.5),
  s(E5, 1, C3), s(CS5, 0.5), s(D5, 0.5),
  s(F5, 0.5, BB3, CH_BB), s(A5, 0.5), s(G5, 0.5), s(FS5, 0.5),
  s(E5, 1, A3), s(0, 0.5), s(A4, 0.5),

  s(D5, 0.5, D3, CH_DM), s(F5, 0.5), s(A5, 1),
  s(C6, 0.5, C3, CH_STORM), s(A5, 0.5), s(G5, 0.5), s(E5, 0.5),
  s(F5, 1, BB3, CH_BB), s(E5, 0.5), s(CS5, 0.5),
  s(D5, 1.5, D3, CH_STORM), s(0, 0.5),

  s(A4, 0.5, D3), s(D5, 0.5), s(F5, 0.5), s(A5, 0.5),
  s(GS4, 0.5, E3, CH_STORM), s(B4, 0.5), s(E5, 1),
  s(F5, 0.5, F3), s(G5, 0.5), s(A5, 0.5), s(C6, 0.5),
  s(CS5, 1, A3, CH_STORM), s(0, 0.5), s(A4, 0.5),
];

const IMPOSSIBLE_SCORE: Step[] = [
  // 00:13: intervalos que no resuelven y compases deliberadamente irregulares.
  s(D5, 0.5, D3, CH_VOID), s(GS4, 1.5), s(DS5, 0.5), s(A4, 1),
  s(CS5, 0.5, C3), s(FS5, 0.75), s(C5, 0.5), s(0, 0.25),
  s(D5, 1.25, BB3, CH_STORM), s(GS5, 0.5), s(DS5, 0.75),
  s(A4, 0.5, D3), s(CS5, 1), s(G4, 0.5), s(0, 0.5),

  s(FS4, 0.5, E3, CH_VOID), s(C5, 0.75), s(DS5, 0.5), s(A5, 1.25),
  s(GS4, 0.5, C3), s(D5, 0.5), s(CS5, 1),
  s(F5, 0.75, D3, CH_STORM), s(B4, 0.5), s(DS5, 0.75),
  s(G4, 0.5, BB3), s(CS5, 1.5), s(0, 0.25),

  s(D5, 0.5, D3, CH_VOID), s(DS5, 0.5), s(A4, 1.5),
  s(CS5, 0.75, C3), s(GS4, 0.5), s(FS5, 0.75),
  s(F4, 0.5, D3, CH_STORM), s(B4, 1), s(DS4, 0.5),
  s(CS5, 2.25, D3, CH_VOID), s(0, 0.75),
];

function now() {
  return ctx?.currentTime ?? 0;
}

function makeNoise() {
  if (!ctx || (noiseBuf && rainBuf)) return;
  const len = ctx.sampleRate * 2;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const rain = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  const rainData = rain.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    const white = Math.random() * 2 - 1;
    last = (last + 0.027 * white) / 1.027;
    data[i] = last * 3.4;
    rainData[i] = white * 0.72 + (Math.random() > 0.997 ? white * 0.28 : 0);
  }
  noiseBuf = buf;
  rainBuf = rain;
}

function tone(
  freq: number,
  duration: number,
  type: OscillatorType,
  peak: number,
  dest: GainNode,
  attack = 0.012,
  detune = 0,
  when = 0,
) {
  if (!ctx || freq <= 0) return;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  osc.detune.value = detune;
  const t = when || now();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(g);
  g.connect(dest);
  osc.start(t);
  osc.stop(t + duration + 0.04);
  osc.onended = () => {
    osc.disconnect();
    g.disconnect();
  };
}

function burst(
  duration: number,
  peak: number,
  dest: GainNode,
  freq: number,
  q = 1.2,
  when = 0,
) {
  if (!ctx || !noiseBuf) return;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = freq;
  filter.Q.value = q;
  const g = ctx.createGain();
  const t = when || now();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(peak, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  src.connect(filter);
  filter.connect(g);
  g.connect(dest);
  src.start(t);
  src.stop(t + duration + 0.03);
  src.onended = () => {
    src.disconnect();
    filter.disconnect();
    g.disconnect();
  };
}

function sweepWhoosh(when = 0) {
  if (!ctx || !musicBus) return;
  const t = when || now();
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(440, t);
  osc.frequency.exponentialRampToValueAtTime(1320, t + 0.28);
  osc.frequency.exponentialRampToValueAtTime(660, t + 0.5);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.05, t + 0.04);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.52);
  osc.connect(g);
  g.connect(musicBus);
  osc.start(t);
  osc.stop(t + 0.55);
  osc.onended = () => {
    osc.disconnect();
    g.disconnect();
  };
}

function duck(amount = 0.45, hold = 0.25) {
  if (!musicBus || !ctx) return;
  const t = now();
  const current = musicBus.gain.value;
  musicBus.gain.cancelScheduledValues(t);
  musicBus.gain.setValueAtTime(current, t);
  musicBus.gain.linearRampToValueAtTime(Math.max(0.02, current * amount), t + 0.04);
  musicBus.gain.setValueAtTime(Math.max(0.02, current * amount), t + hold);
  musicBus.gain.linearRampToValueAtTime(current, t + hold + 0.55);
}

function stopPads() {
  if (!ctx) {
    padNodes = [];
    return;
  }
  const t = now();
  for (const node of padNodes) {
    node.gain.gain.cancelScheduledValues(t);
    node.gain.gain.setValueAtTime(node.gain.gain.value, t);
    node.gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    try {
      node.osc.stop(t + 0.4);
    } catch {
      /* already stopped */
    }
  }
  padNodes = [];
}

function startPads(mode: MusicMode) {
  if (!ctx || !musicBus) return;
  stopPads();
  const specs =
    mode === "title"
      ? [
          { freq: C4, type: "sine" as const, peak: 0.032 },
          { freq: E4, type: "sine" as const, peak: 0.016 },
          { freq: G4, type: "triangle" as const, peak: 0.008 },
        ]
      : mode === "night" || mode === "storm"
        ? [
            { freq: D3, type: "sine" as const, peak: 0.026 },
            { freq: A3, type: "sine" as const, peak: 0.014 },
            { freq: F3, type: "triangle" as const, peak: 0.008 },
          ]
      : mode === "impossible"
        ? [
            { freq: D3, type: "sine" as const, peak: 0.024 },
            { freq: GS4 / 2, type: "sawtooth" as const, peak: 0.007 },
            { freq: CS4, type: "triangle" as const, peak: 0.009 },
          ]
      : mode === "mirror"
        ? [
            { freq: A3, type: "sine" as const, peak: 0.024 },
            { freq: E4, type: "sine" as const, peak: 0.012 },
            { freq: C4, type: "triangle" as const, peak: 0.007 },
          ]
      : [
          { freq: C3, type: "sine" as const, peak: 0.03 },
          { freq: E3, type: "sine" as const, peak: 0.02 },
          { freq: G3, type: "triangle" as const, peak: 0.014 },
        ];
  const t = now();
  for (const spec of specs) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = spec.type;
    osc.frequency.value = spec.freq;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(spec.peak, t + 1.4);
    osc.connect(g);
    g.connect(musicBus);
    osc.start(t);
    padNodes.push({ osc, gain: g });
  }
}

function glidePads(time: number, chord: [number, number, number]) {
  padNodes.forEach((node, i) => {
    const freq = chord[i];
    if (!freq) return;
    try {
      node.osc.frequency.cancelScheduledValues(time);
      node.osc.frequency.setValueAtTime(node.osc.frequency.value, time);
      node.osc.frequency.linearRampToValueAtTime(freq, time + 0.35);
    } catch {
      /* ignore */
    }
  });
}

function stopCrowd() {
  if (!ctx || !crowd) return;
  const t = now();
  crowd.gain.gain.cancelScheduledValues(t);
  crowd.gain.gain.setValueAtTime(crowd.gain.gain.value, t);
  crowd.gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
  try {
    crowd.src.stop(t + 0.45);
  } catch {
    /* ignore */
  }
  crowd = null;
}

function startCrowd() {
  if (!ctx || !musicBus || !noiseBuf) return;
  stopCrowd();
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  src.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 2200;
  filter.Q.value = 0.4;
  const g = ctx.createGain();
  const t = now();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.028, t + 1.2);
  src.connect(filter);
  filter.connect(g);
  g.connect(musicBus);
  src.start(t);
  crowd = { src, gain: g, filter };
}

function stopWeather() {
  if (!ctx) {
    weatherNodes = [];
    return;
  }
  const t = now();
  for (const layer of weatherNodes) {
    layer.gain.gain.cancelScheduledValues(t);
    layer.gain.gain.setValueAtTime(Math.max(0.0001, layer.gain.gain.value), t);
    layer.gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
    try {
      layer.src.stop(t + 0.5);
    } catch {
      /* already stopped */
    }
  }
  weatherNodes = [];
}

function addWeatherLayer(
  filterSpecs: { type: BiquadFilterType; frequency: number; q: number }[],
  peak: number,
  fade = 1.6,
  texture: "air" | "rain" = "air",
) {
  if (!ctx || !musicBus || !noiseBuf) return;
  const src = ctx.createBufferSource();
  src.buffer = texture === "rain" ? rainBuf ?? noiseBuf : noiseBuf;
  src.loop = true;
  const filters = filterSpecs.map((spec) => {
    const filter = ctx!.createBiquadFilter();
    filter.type = spec.type;
    filter.frequency.value = spec.frequency;
    filter.Q.value = spec.q;
    return filter;
  });
  const g = ctx.createGain();
  const t = now();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + fade);
  let source: AudioNode = src;
  for (const filter of filters) {
    source.connect(filter);
    source = filter;
  }
  source.connect(g);
  g.connect(musicBus);
  src.start(t, Math.random() * 1.5);
  weatherNodes.push({ src, gain: g, filters });
}

function startWeather(mode: MusicMode) {
  stopWeather();
  if (mode === "storm") {
    // Dos capas de lluvia: agua fina en primer plano y masa grave a lo lejos.
    addWeatherLayer([
      { type: "highpass", frequency: 1250, q: 0.35 },
      { type: "lowpass", frequency: 6800, q: 0.25 },
    ], 0.052, 1.6, "rain");
    addWeatherLayer([{ type: "lowpass", frequency: 240, q: 0.45 }], 0.018, 2.4);
  } else if (mode === "impossible") {
    // El final no hereda la lluvia: queda un aire mecánico, estrecho e incómodo.
    addWeatherLayer([
      { type: "highpass", frequency: 210, q: 0.7 },
      { type: "lowpass", frequency: 760, q: 1.1 },
    ], 0.018, 2.8);
  }
}

function scheduleThunder(time: number, intensity = 1) {
  if (!musicBus) return;
  // El chasquido precede al cuerpo grave para que el rayo se reconozca incluso
  // con altavoces pequeños, sin convertirlo en un pico molesto de volumen.
  burst(0.09, 0.026 * intensity, musicBus, 2600, 0.4, time);
  burst(2.4, 0.052 * intensity, musicBus, 92, 0.3, time + 0.08);
  burst(1.7, 0.024 * intensity, musicBus, 180, 0.42, time + 0.18);
  tone(42, 2.5, "sine", 0.045 * intensity, musicBus, 0.08, -7, time + 0.08);
  tone(57, 1.9, "triangle", 0.018 * intensity, musicBus, 0.12, 9, time + 0.16);
}

export function unlockAudio() {
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC({ latencyHint: "interactive" });
    master = ctx.createGain();
    musicBus = ctx.createGain();
    sfxBus = ctx.createGain();
    musicBus.gain.value = 0.32;
    sfxBus.gain.value = 0.78;
    master.gain.value = muted ? 0 : 0.85;
    musicBus.connect(master);
    sfxBus.connect(master);
    master.connect(ctx.destination);
    makeNoise();
  }
  if (ctx.state === "suspended") {
    void ctx.resume();
  }
  if (!visBound) {
    visBound = true;
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible" && ctx?.state === "suspended") {
        void ctx.resume();
      }
    });
  }
}

export function setMuted(next: boolean) {
  muted = next;
  if (master && ctx) {
    master.gain.setTargetAtTime(next ? 0 : 0.85, ctx.currentTime, 0.04);
  }
  if (!next && musicMode !== "off" && ctx) {
    window.clearTimeout(musicTimer);
    nextNote = ctx.currentTime + 0.04;
    musicTick();
  }
}

export function isMuted() {
  return muted;
}

export function playSelect() {
  if (!sfxBus) return;
  const t = now();
  const j = 0.98 + Math.random() * 0.04;
  tone(1046.5 * j, 0.12, "sine", 0.11, sfxBus, 0.004, 0, t);
  tone(1318.5 * j, 0.16, "triangle", 0.08, sfxBus, 0.01, 0, t + 0.04);
  tone(1568 * j, 0.22, "sine", 0.06, sfxBus, 0.02, 0, t + 0.08);
  burst(0.09, 0.08, sfxBus, 3200 * j, 1.4, t);
}

export function playUi() {
  if (!sfxBus) return;
  tone(680, 0.07, "sine", 0.07, sfxBus, 0.003);
  burst(0.05, 0.05, sfxBus, 2400, 0.8);
}

export function playMascot(kind: "turtle" | "hedgehog" | "fish") {
  unlockAudio();
  if (!sfxBus) return;
  const t = now();
  if (kind === "turtle") {
    tone(392, 0.18, "triangle", 0.075, sfxBus, 0.008, -4, t);
    tone(523.25, 0.2, "sine", 0.065, sfxBus, 0.012, 2, t + 0.1);
    tone(659.25, 0.3, "triangle", 0.045, sfxBus, 0.018, 0, t + 0.2);
  } else if (kind === "hedgehog") {
    burst(0.055, 0.055, sfxBus, 2600, 1.3, t);
    tone(880, 0.09, "square", 0.035, sfxBus, 0.003, -7, t);
    tone(1174.66, 0.12, "triangle", 0.055, sfxBus, 0.004, 5, t + 0.075);
    tone(987.77, 0.18, "sine", 0.045, sfxBus, 0.006, 0, t + 0.16);
  } else {
    burst(0.08, 0.045, sfxBus, 760, 2.2, t);
    tone(329.63, 0.13, "sine", 0.06, sfxBus, 0.004, 0, t);
    tone(493.88, 0.16, "sine", 0.055, sfxBus, 0.006, 3, t + 0.08);
    tone(783.99, 0.22, "sine", 0.038, sfxBus, 0.008, -2, t + 0.17);
  }
  try {
    navigator.vibrate?.(kind === "hedgehog" ? [7, 18, 7] : 8);
  } catch {
    /* ignore */
  }
}

export function playDeal() {
  if (!sfxBus) return;
  const j = 0.88 + Math.random() * 0.24;
  burst(0.1, 0.22, sfxBus, 1700 * j, 0.7);
  tone(190 * j, 0.12, "sine", 0.14, sfxBus, 0.004);
  tone(540 * j, 0.06, "triangle", 0.05, sfxBus, 0.002);
}

export function playPlace() {
  if (!sfxBus) return;
  const j = 0.9 + Math.random() * 0.18;
  burst(0.09, 0.28, sfxBus, 820 * j, 0.95);
  tone(148 * j, 0.16, "sine", 0.22, sfxBus, 0.004);
  tone(392 * j, 0.1, "triangle", 0.08, sfxBus, 0.004);
}

export function playExchange() {
  if (!sfxBus) return;
  burst(0.2, 0.18, sfxBus, 640, 0.55);
  tone(262, 0.18, "sine", 0.1, sfxBus, 0.01);
  tone(523, 0.22, "triangle", 0.08, sfxBus, 0.02, 10);
}

export function playAforo() {
  if (!sfxBus) return;
  burst(0.07, 0.22, sfxBus, 3000, 1.3);
  tone(130, 0.14, "square", 0.04, sfxBus, 0.002);
}

export function playComplete(id?: string | null) {
  if (!sfxBus) return;
  const dest = sfxBus;
  duck(0.32, 0.4);
  const t = now();
  [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
    tone(freq, 0.5, "sine", 0.11, dest, 0.02, 0, t + i * 0.09);
    tone(freq * 2, 0.32, "triangle", 0.035, dest, 0.03, 0, t + i * 0.09);
  });
  burst(0.22, 0.12, dest, 1800, 0.6, t);
  if (id === "coaster") {
    sweepWhoosh(t + 0.12);
    sweepWhoosh(t + 0.4);
  } else if (id === "haunted") {
    tone(196, 0.35, "triangle", 0.06, dest, 0.02, 0, t + 0.1);
    tone(247, 0.4, "sine", 0.05, dest, 0.04, 0, t + 0.22);
  } else if (id === "love") {
    tone(659.25, 0.5, "sine", 0.08, dest, 0.05, 0, t + 0.16);
    tone(783.99, 0.55, "sine", 0.07, dest, 0.05, 0, t + 0.16);
  } else if (id === "forest") {
    tone(880, 0.18, "sine", 0.05, dest, 0.01, 0, t + 0.2);
    tone(1174, 0.2, "sine", 0.04, dest, 0.01, 0, t + 0.32);
  } else if (id === "chairs") {
    [392, 523, 659, 784, 1046].forEach((freq, i) => {
      tone(freq, 0.22, "triangle", 0.05, dest, 0.01, 0, t + 0.12 + i * 0.07);
    });
  } else if (id === "restaurant") {
    tone(1568, 0.12, "sine", 0.07, dest, 0.002, 0, t + 0.2);
    burst(0.1, 0.08, dest, 2400, 1.2, t + 0.2);
  } else if (id === "restrooms") {
    burst(0.14, 0.06, dest, 900, 0.4, t + 0.18);
    burst(0.16, 0.05, dest, 1400, 0.5, t + 0.3);
  }
}

export function playStart() {
  if (!sfxBus) return;
  const t = now();
  tone(262, 0.22, "sine", 0.1, sfxBus, 0.01, 0, t);
  tone(392, 0.28, "sine", 0.09, sfxBus, 0.02, 0, t + 0.08);
  tone(523, 0.4, "triangle", 0.07, sfxBus, 0.03, 0, t + 0.16);
  burst(0.16, 0.1, sfxBus, 1400, 0.7, t);
}

export function playEnd() {
  if (!sfxBus) return;
  const dest = sfxBus;
  duck(0.22, 0.9);
  const t = now();
  [261.6, 329.6, 392, 523.25].forEach((freq, i) => {
    tone(freq, 0.85, "sine", 0.1, dest, 0.05, 0, t + i * 0.18);
  });
}

export function playRollTick(step: number) {
  if (!sfxBus) return;
  const dest = sfxBus;
  const t = now();
  burst(0.07, 0.14 + step * 0.012, dest, 1700 + step * 80, 0.75, t);
  burst(0.05, 0.08, dest, 380, 1.6, t);
  tone(82 + step * 14, 0.16, "sine", 0.07, dest, 0.002, 0, t);
}

export function playRollFill(seconds = 0.7) {
  if (!sfxBus || !ctx) return;
  const dest = sfxBus;
  const t = now();
  const hits = 16;
  for (let i = 0; i < hits; i++) {
    const at = t + ((i + 1) / hits) ** 1.55 * seconds;
    burst(0.045, 0.08 + i * 0.006, dest, 1500 + i * 50, 0.65, at);
  }
}

export function playRollCrash(count: number) {
  if (!sfxBus) return;
  const dest = sfxBus;
  duck(0.35, 0.5);
  const t = now();
  burst(0.45, 0.22, dest, 800, 0.35, t);
  burst(0.55, 0.16, dest, 2400, 0.55, t);
  tone(98, 0.5, "sine", 0.09, dest, 0.002, 0, t);
  const chord = [261.63, 329.63, 392.0, 523.25].slice(0, Math.max(1, Math.min(4, count)));
  chord.forEach((freq, i) => {
    tone(freq, 0.7, "sine", 0.08, dest, 0.02, 0, t + 0.04 + i * 0.05);
  });
}

export function playParty() {
  if (!sfxBus) return;
  const dest = sfxBus;
  duck(0.5, 1.2);
  const t = now();
  [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((freq, i) => {
    tone(freq, 0.7, "sine", 0.12, dest, 0.02, 0, t + i * 0.1);
    tone(freq * 2, 0.4, "triangle", 0.04, dest, 0.03, 0, t + i * 0.1);
  });
  burst(0.28, 0.14, dest, 1600, 0.5, t);
  burst(0.22, 0.12, dest, 2200, 0.7, t + 0.35);
  burst(0.2, 0.1, dest, 2800, 0.9, t + 0.7);
}

export function playLifetimeUnlock() {
  if (!sfxBus) return;
  const dest = sfxBus;
  duck(0.18, 1.55);
  const t = now();
  const fanfare = [D5, F5, A5, C6, D6, A5, D6];
  fanfare.forEach((freq, i) => {
    const at = t + i * 0.12;
    tone(freq, i === fanfare.length - 1 ? 1.15 : 0.42, "sine", 0.12, dest, 0.018, 0, at);
    tone(freq * 2, 0.3, "triangle", 0.035, dest, 0.025, i % 2 === 0 ? -4 : 4, at + 0.025);
  });
  tone(D3, 1.45, "sine", 0.12, dest, 0.04, 0, t);
  burst(0.24, 0.11, dest, 2100, 0.55, t + 0.34);
  burst(0.42, 0.08, dest, 3400, 0.7, t + 0.72);
  try {
    navigator.vibrate?.([18, 45, 18, 45, 42]);
  } catch {
    /* ignore */
  }
}

export function playPass() {
  if (!sfxBus) return;
  tone(330, 0.2, "sine", 0.07, sfxBus, 0.02);
  tone(247, 0.24, "triangle", 0.04, sfxBus, 0.03);
}

function scheduleStep(time: number, step: Step, beat: number, index: number, mode: MusicMode) {
  if (!musicBus || !ctx) return;
  const dur = Math.max(0.18, step.beats * beat * 0.92);
  if (step.chord) glidePads(time, step.chord);
  if (step.bass) {
    const calmMode = mode === "night" || mode === "mirror";
    const bassPeak = mode === "title" ? 0.014 : calmMode ? 0.022 : mode === "impossible" ? 0.036 : mode === "storm" ? 0.034 : 0.038;
    tone(step.bass, beat * (calmMode ? 2.2 : mode === "impossible" ? 1.8 : 1.35), "sine", bassPeak, musicBus, 0.08, 0, time);
    tone(step.bass * 2, beat * 0.9, mode === "impossible" ? "sawtooth" : "triangle", calmMode ? 0.006 : mode === "impossible" ? 0.007 : 0.012, musicBus, 0.1, mode === "impossible" ? -13 : 0, time);
  }
  if (step.m) {
    const calmMode = mode === "night" || mode === "mirror";
    const peak = mode === "title" ? 0.022 : calmMode ? 0.032 : mode === "impossible" ? 0.038 : mode === "storm" ? 0.044 : 0.048;
    tone(step.m, dur, mode === "impossible" ? "triangle" : "sine", peak, musicBus, calmMode ? 0.14 : mode === "impossible" ? 0.018 : 0.045, mode === "impossible" ? -11 : 0, time);
    tone(step.m * 2, dur * 0.7, mode === "storm" ? "sawtooth" : "triangle", peak * (calmMode ? 0.18 : mode === "impossible" ? 0.2 : 0.28), musicBus, 0.08, mode === "impossible" ? 17 : 4, time);
    if (mode === "impossible") {
      tone(step.m * 1.006, dur * 1.15, "sine", peak * 0.34, musicBus, 0.12, 23, time + beat * 0.08);
    }
    if (step.beats >= 2) {
      tone(step.m * 1.5, dur * 0.45, "sine", peak * (mode === "night" ? 0.09 : 0.16), musicBus, 0.12, 0, time);
    }
    // Brillo de feria: un contrapunto ligero y original, distinto en cada escena.
    const shimmer = mode === "title" ? 0.01 : calmMode ? 0.008 : mode === "impossible" ? 0.005 : 0.016;
    const shimmerOctave = mode === "night" ? (Math.floor(index / NIGHT_SCORE.length) % 2 === 0 ? 2 : 3) : mode === "title" ? 2 : 3;
    tone(step.m * shimmerOctave, Math.min(dur * 0.42, 0.32), "triangle", shimmer, musicBus, 0.02, 0, time + beat * 0.32);
  }
  if (mode === "park" && index % 2 === 0) {
    burst(0.035, 0.018, musicBus, index % 4 === 0 ? 220 : 620, 0.85, time);
  }
  if (mode === "park" && index % 48 === 24) {
    sweepWhoosh(time);
  }
  if (mode === "night" && index % 12 === 6) {
    const chime = index % 24 === 6 ? D6 : A5;
    tone(chime, beat * 2.4, "sine", 0.009, musicBus, 0.18, index % 3 === 0 ? -5 : 5, time + beat * 0.45);
  }
  if (mode === "night" && index % 32 === 16) {
    burst(0.18, 0.006, musicBus, 2800, 0.4, time);
  }
  if (mode === "festival" && index % 4 === 0) {
    burst(0.04, 0.022, musicBus, 2300, 0.9, time);
    tone(index % 8 === 0 ? C6 : G5, 0.18, "triangle", 0.012, musicBus, 0.01, 0, time + beat * 0.5);
  }
  if (mode === "storm") {
    if (index % 2 === 0) burst(0.045, 0.022, musicBus, index % 4 === 0 ? 165 : 1150, 0.55, time);
    if (index % 32 === 6) scheduleThunder(time + beat * 0.28, 0.82);
    if (index % 64 === 39) scheduleThunder(time + beat * 0.12, 1.08);
  }
  if (mode === "impossible") {
    if (index % 3 !== 1) burst(0.035, 0.014, musicBus, index % 6 === 0 ? 105 : 1860, 0.8, time);
    if (index % 11 === 7) {
      tone(73.42, beat * 2.8, "sawtooth", 0.012, musicBus, 0.04, index % 22 === 7 ? -31 : 29, time);
      burst(0.75, 0.012, musicBus, 310, 2.4, time + beat * 0.2);
    }
  }
  if (mode === "mirror" && index % 8 === 4 && step.m) {
    tone(step.m / 2, dur * 0.8, "sine", 0.01, musicBus, 0.16, -7, time + beat * 0.35);
  }
}

function musicTick() {
  if (!ctx || muted || musicMode === "off") return;
  const score = musicMode === "title"
    ? TITLE_SCORE
    : musicMode === "night"
      ? NIGHT_SCORE
      : musicMode === "festival"
        ? FESTIVAL_SCORE
        : musicMode === "mirror"
          ? MIRROR_SCORE
          : musicMode === "storm"
            ? STORM_SCORE
            : musicMode === "impossible"
              ? IMPOSSIBLE_SCORE
              : PARK_SCORE;
  const beat = musicMode === "title"
    ? 0.86
    : musicMode === "night"
      ? 0.74
      : musicMode === "festival"
        ? 0.42
        : musicMode === "mirror"
          ? 0.68
          : musicMode === "storm"
            ? 0.4
            : musicMode === "impossible"
              ? 0.46
              : 0.56;
  const horizon = ctx.currentTime + 2.4;
  while (nextNote < horizon) {
    const step = score[noteIndex % score.length]!;
    scheduleStep(nextNote, step, beat, noteIndex, musicMode);
    nextNote += step.beats * beat;
    noteIndex += 1;
  }
  musicTimer = window.setTimeout(musicTick, 180);
}

function startMode(mode: MusicMode) {
  if (!ctx || !musicBus) return;
  window.clearTimeout(musicTimer);
  musicMode = mode;
  noteIndex = 0;
  nextNote = ctx.currentTime + 0.12;
  const target = mode === "title" ? 0.2 : mode === "night" || mode === "mirror" || mode === "storm" ? 0.25 : mode === "impossible" ? 0.3 : 0.34;
  musicBus.gain.setTargetAtTime(target, ctx.currentTime, 0.08);
  startPads(mode);
  startWeather(mode);
  if (mode === "park") startCrowd();
  else stopCrowd();
  musicTick();
}

export function startTitleBed() {
  unlockAudio();
  if (musicMode === "title") return;
  startMode("title");
}

export function startParkBed() {
  unlockAudio();
  startMode("park");
}

export function startNightBed() {
  unlockAudio();
  if (musicMode === "night") return;
  startMode("night");
}

export function startChallengeBed(challenge: GameChallenge = "classic") {
  unlockAudio();
  const mode: MusicMode = challenge === "classic" ? "park" : challenge;
  if (musicMode === mode) return;
  startMode(mode);
}

export function stopParkBed() {
  window.clearTimeout(musicTimer);
  musicMode = "off";
  stopPads();
  stopCrowd();
  stopWeather();
  if (musicBus && ctx) {
    musicBus.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.12);
  }
}

export function tapHaptic(kind: "place" | "complete" | "exchange" | "select") {
  if (typeof navigator === "undefined" || !navigator.vibrate) return;
  try {
    if (kind === "complete") navigator.vibrate([14, 40, 22]);
    else if (kind === "exchange") navigator.vibrate(12);
    else if (kind === "place") navigator.vibrate(10);
    else navigator.vibrate(6);
  } catch {
    /* ignore */
  }
}
