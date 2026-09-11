export const MASCOT_IDS = ["turtle", "hedgehog", "fish"] as const;
const MASCOT_PROGRESS_KEY = "poker-park.mascots.v1";

export type MascotId = (typeof MASCOT_IDS)[number];

export const MASCOT_NAMES: Record<MascotId, string> = {
  turtle: "Tuga",
  hedgehog: "Púa",
  fish: "Burbujas",
};

export interface MascotProgress {
  version: 1;
  greetings: Record<MascotId, number>;
  lastGreeted: MascotId | null;
}

export type MascotMedalTier = "bronze" | "silver" | "gold";

const EMPTY_PROGRESS: MascotProgress = {
  version: 1,
  greetings: { turtle: 0, hedgehog: 0, fish: 0 },
  lastGreeted: null,
};

export function loadMascotProgress(): MascotProgress {
  try {
    const parsed = JSON.parse(localStorage.getItem(MASCOT_PROGRESS_KEY) ?? "null") as Partial<MascotProgress> | null;
    const safeCount = (value: unknown) => typeof value === "number" && Number.isFinite(value)
      ? Math.max(0, Math.floor(value))
      : 0;
    return {
      version: 1,
      greetings: {
        turtle: safeCount(parsed?.greetings?.turtle),
        hedgehog: safeCount(parsed?.greetings?.hedgehog),
        fish: safeCount(parsed?.greetings?.fish),
      },
      lastGreeted: MASCOT_IDS.includes(parsed?.lastGreeted as MascotId)
        ? parsed!.lastGreeted as MascotId
        : null,
    };
  } catch {
    return {
      ...EMPTY_PROGRESS,
      greetings: { ...EMPTY_PROGRESS.greetings },
    };
  }
}

function saveMascotProgress(progress: MascotProgress) {
  try {
    localStorage.setItem(MASCOT_PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    /* Private browsing can keep the interaction without persistence. */
  }
}

export function recordMascotGreeting(id: MascotId): MascotProgress {
  const current = loadMascotProgress();
  const next = {
    ...current,
    greetings: { ...current.greetings, [id]: current.greetings[id] + 1 },
    lastGreeted: id,
  };
  saveMascotProgress(next);
  return next;
}

export function favoriteMascot(progress: MascotProgress): MascotId | null {
  const highest = Math.max(...Object.values(progress.greetings));
  if (highest === 0) return null;
  if (progress.lastGreeted && progress.greetings[progress.lastGreeted] === highest) return progress.lastGreeted;
  return MASCOT_IDS.find((id) => progress.greetings[id] === highest) ?? null;
}

export function mascotMedalTiers(greetings: number): MascotMedalTier[] {
  const tiers: MascotMedalTier[] = [];
  if (greetings > 25) tiers.push("bronze");
  if (greetings > 50) tiers.push("silver");
  if (greetings > 100) tiers.push("gold");
  return tiers;
}

export function totalMascotGreetings(progress: MascotProgress): number {
  return MASCOT_IDS.reduce((total, id) => total + progress.greetings[id], 0);
}

export function favoriteMascotNote(progress: MascotProgress): string {
  const favorite = favoriteMascot(progress);
  return favorite
    ? `Tu mascota favorita es ${MASCOT_NAMES[favorite]}.`
    : "Todavía no tienes una mascota favorita.";
}
