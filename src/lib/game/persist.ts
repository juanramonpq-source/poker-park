import type { GameChallenge, GameState } from "./types";

const SAVE_KEY = "poker-park.save.v7";
const SETTINGS_KEY = "poker-park.settings.v1";
const SAVE_VERSION = 7;
const SECRETS_KEY = "poker-park.secrets.v1";

export interface Settings {
  version: 1;
  muted: boolean;
  nightTheme: boolean;
  showcaseTheme: GameChallenge;
  cardBack: "classic" | "mechanical" | "festival" | "storm" | "impossible";
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
}

const defaultSecrets: Secrets = {
  perfect: false,
  lifetime: false,
  nightPerfect: false,
  pentonuiSignal: false,
  festivalPerfect: false,
  mirrorPerfect: false,
  stormPerfect: false,
  impossiblePerfect: false,
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

export function unlockSecret(key: keyof Secrets) {
  const next = { ...loadSecrets(), [key]: true };
  saveSecrets(next);
  return next;
}

export function masterTrialsComplete(secrets: Secrets) {
  return secrets.festivalPerfect && secrets.mirrorPerfect && secrets.stormPerfect;
}

export function unlockAllSecrets() {
  const next: Secrets = Object.fromEntries(
    Object.keys(defaultSecrets).map((key) => [key, true]),
  ) as unknown as Secrets;
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
