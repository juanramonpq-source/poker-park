import type { GameState } from "./types";

const SAVE_KEY = "poker-park.save.v7";
const SETTINGS_KEY = "poker-park.settings.v1";
const SAVE_VERSION = 7;
const SECRETS_KEY = "poker-park.secrets.v1";

export interface Settings {
  version: 1;
  muted: boolean;
}

const defaultSettings: Settings = { version: 1, muted: false };

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
}

export function loadSecrets(): Secrets {
  try {
    const raw = localStorage.getItem(SECRETS_KEY);
    if (!raw) return { perfect: false, lifetime: false };
    const parsed = JSON.parse(raw) as Partial<Secrets>;
    return { perfect: Boolean(parsed.perfect), lifetime: Boolean(parsed.lifetime) };
  } catch {
    return { perfect: false, lifetime: false };
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
