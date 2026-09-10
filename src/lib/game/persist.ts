import { shuffle } from "./deck.ts";
import type { Card, GameChallenge, GameDifficulty, GameState } from "./types.ts";

const SAVE_KEY = "poker-park.save.v7";
const SETTINGS_KEY = "poker-park.settings.v1";
const SAVE_VERSION = 7;
const SECRETS_KEY = "poker-park.secrets.v1";

export interface Settings {
  version: 1;
  muted: boolean;
  nightTheme: boolean;
  showcaseTheme: GameChallenge;
  cardBack: "classic" | "mechanical" | "festival" | "storm" | "impossible" | "dual";
}

const defaultSettings: Settings = {
  version: 1,
  muted: false,
  nightTheme: false,
  showcaseTheme: "classic",
  cardBack: "classic",
};

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...defaultSettings };
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return { ...defaultSettings, ...parsed, version: 1 };
  } catch {
    return { ...defaultSettings };
  }
}

export function saveSettings(settings: Settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    /* private mode */
  }
}

export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GameState;
    if (parsed.version !== SAVE_VERSION) return null;
    if (parsed.ended) return null;
    if (parsed.challenge === "night" && parsed.night && Array.isArray(parsed.night.aceRack)) {
      const cardsInPlay: Card[] = [
        ...parsed.deck,
        ...parsed.hands[0],
        ...parsed.hands[1],
        ...parsed.entrance,
        ...Object.values(parsed.attractions).flatMap((attraction) => [
          ...attraction.slots.filter((card): card is Card => Boolean(card)),
          ...attraction.visitors,
        ]),
      ];
      const knownIds = new Set(cardsInPlay.map((card) => card.id));
      const unseenAces = parsed.night.aceRack.filter((card) => !knownIds.has(card.id));
      if (unseenAces.length > 0) parsed.deck = shuffle([...parsed.deck, ...unseenAces]);
      delete parsed.night.aceRack;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveGame(state: GameState | null) {
  try {
    if (!state || state.ended) {
      localStorage.removeItem(SAVE_KEY);
      return;
    }
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch {
    /* private mode */
  }
}

export function clearGame() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    /* ignore */
  }
}

export interface Secrets {
  perfect: boolean;
  lifetime: boolean;
  nightPerfect: boolean;
  pentonuiSignal: boolean;
  festivalPerfect: boolean;
  mirrorPerfect: boolean;
  stormPerfect: boolean;
  impossiblePerfect: boolean;
  classicMedals: GameChallenge[];
}

export type SecretFlag = Exclude<keyof Secrets, "classicMedals">;

const ALL_CHALLENGES: GameChallenge[] = ["classic", "night", "festival", "mirror", "storm", "impossible"];

const defaultSecrets: Secrets = {
  perfect: false,
  lifetime: false,
  nightPerfect: false,
  pentonuiSignal: false,
  festivalPerfect: false,
  mirrorPerfect: false,
  stormPerfect: false,
  impossiblePerfect: false,
  classicMedals: [],
};

export function loadSecrets(): Secrets {
  try {
    const raw = localStorage.getItem(SECRETS_KEY);
    if (!raw) return { ...defaultSecrets };
    const parsed = JSON.parse(raw) as Partial<Secrets>;
    return {
      perfect: Boolean(parsed.perfect),
      lifetime: Boolean(parsed.lifetime),
      nightPerfect: Boolean(parsed.nightPerfect),
      pentonuiSignal: Boolean(parsed.pentonuiSignal),
      festivalPerfect: Boolean(parsed.festivalPerfect),
      mirrorPerfect: Boolean(parsed.mirrorPerfect),
      stormPerfect: Boolean(parsed.stormPerfect),
      impossiblePerfect: Boolean(parsed.impossiblePerfect),
      classicMedals: Array.isArray(parsed.classicMedals)
        ? ALL_CHALLENGES.filter((challenge) => parsed.classicMedals?.includes(challenge))
        : [],
    };
  } catch {
    return { ...defaultSecrets };
  }
}

export function saveSecrets(secrets: Secrets) {
  try {
    localStorage.setItem(SECRETS_KEY, JSON.stringify(secrets));
  } catch {
    /* private mode */
  }
}

export function unlockSecret(key: SecretFlag) {
  const next = { ...loadSecrets(), [key]: true };
  saveSecrets(next);
  return next;
}

export function recordPerfectCompletion(challenge: GameChallenge, difficulty: GameDifficulty) {
  const key: SecretFlag = challenge === "night"
    ? "nightPerfect"
    : challenge === "festival"
      ? "festivalPerfect"
      : challenge === "mirror"
        ? "mirrorPerfect"
        : challenge === "storm"
          ? "stormPerfect"
          : challenge === "impossible"
            ? "impossiblePerfect"
            : "perfect";
  const current = loadSecrets();
  const classicMedals = difficulty === "standard" && !current.classicMedals.includes(challenge)
    ? [...current.classicMedals, challenge]
    : current.classicMedals;
  const next = { ...current, [key]: true, classicMedals };
  saveSecrets(next);
  return next;
}

export function masterTrialsComplete(secrets: Secrets) {
  return secrets.festivalPerfect && secrets.mirrorPerfect && secrets.stormPerfect;
}

export function unlockAllSecrets() {
  const next: Secrets = {
    perfect: true,
    lifetime: true,
    nightPerfect: true,
    pentonuiSignal: true,
    festivalPerfect: true,
    mirrorPerfect: true,
    stormPerfect: true,
    impossiblePerfect: true,
    classicMedals: [...ALL_CHALLENGES],
  };
  saveSecrets(next);
  return next;
}

export function resetPokerParkProgress() {
  try {
    localStorage.removeItem(SAVE_KEY);
    localStorage.removeItem(SECRETS_KEY);
    localStorage.removeItem(SETTINGS_KEY);
    localStorage.removeItem("poker-park-tutorial-seen");
  } catch {
    /* private mode */
  }
  return { ...defaultSecrets };
}
