import { qualifiesForPentonuiMedal, type MascotProgress } from "./mascot-progress.ts";
import { allChallengesComplete, type Secrets } from "./persist.ts";

const FINALE_PROGRESS_KEY = "poker-park.finales.v1";

export type FinaleKind = "park" | "ultimate";

export interface FinaleProgress {
  version: 1;
  parkEndingSeen: boolean;
  ultimateEndingSeen: boolean;
  achievementSubmittedAt: string | null;
}

const EMPTY_FINALE_PROGRESS: FinaleProgress = {
  version: 1,
  parkEndingSeen: false,
  ultimateEndingSeen: false,
  achievementSubmittedAt: null,
};

function saveFinaleProgress(progress: FinaleProgress): FinaleProgress {
  try {
    localStorage.setItem(FINALE_PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    /* Private browsing can keep the interaction without persistence. */
  }
  return progress;
}

export function loadFinaleProgress(): FinaleProgress {
  try {
    const parsed = JSON.parse(localStorage.getItem(FINALE_PROGRESS_KEY) ?? "null") as Partial<FinaleProgress> | null;
    return {
      version: 1,
      parkEndingSeen: parsed?.parkEndingSeen === true,
      ultimateEndingSeen: parsed?.ultimateEndingSeen === true,
      achievementSubmittedAt: typeof parsed?.achievementSubmittedAt === "string"
        ? parsed.achievementSubmittedAt
        : null,
    };
  } catch {
    return { ...EMPTY_FINALE_PROGRESS };
  }
}

export function nextPendingFinale(
  secrets: Secrets,
  mascots: MascotProgress,
): FinaleKind | null {
  const progress = loadFinaleProgress();
  if (allChallengesComplete(secrets) && !progress.parkEndingSeen) return "park";
  if (qualifiesForPentonuiMedal(mascots, secrets) && !progress.ultimateEndingSeen) return "ultimate";
  return null;
}

export function markFinaleSeen(kind: FinaleKind): FinaleProgress {
  const current = loadFinaleProgress();
  return saveFinaleProgress({
    ...current,
    parkEndingSeen: current.parkEndingSeen || kind === "park",
    ultimateEndingSeen: current.ultimateEndingSeen || kind === "ultimate",
  });
}

export function markAchievementSubmitted(isoDate: string): FinaleProgress {
  const current = loadFinaleProgress();
  if (current.achievementSubmittedAt) return current;
  return saveFinaleProgress({ ...current, achievementSubmittedAt: isoDate });
}

export function resetFinaleProgress(): FinaleProgress {
  try {
    localStorage.removeItem(FINALE_PROGRESS_KEY);
  } catch {
    /* private mode */
  }
  return { ...EMPTY_FINALE_PROGRESS };
}
