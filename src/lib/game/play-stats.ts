import type { GameChallenge } from "./types.ts";
import type { Secrets } from "./persist.ts";

const PLAY_STATS_KEY = "poker-park.stats.v1";

export interface PlayStats {
  version: 1;
  activePlaySeconds: number;
  finishedDays: number;
  perfectDays: number;
  completedAttractions: number;
  activeRunId: string | null;
  activeStartedAt: number | null;
  lastFinishedRunId: string | null;
}

export interface AchievementStats {
  activePlaySeconds: number;
  finishedDays: number;
  perfectDays: number;
  completedAttractions: number;
  completedChallenges: GameChallenge[];
}

const EMPTY_STATS: PlayStats = {
  version: 1,
  activePlaySeconds: 0,
  finishedDays: 0,
  perfectDays: 0,
  completedAttractions: 0,
  activeRunId: null,
  activeStartedAt: null,
  lastFinishedRunId: null,
};

function safeInteger(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, Math.floor(value)));
}

function safeTimestamp(value: unknown): number | null {
  const timestamp = safeInteger(value);
  return timestamp > 0 ? timestamp : null;
}

function safeId(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 && value.length <= 128 ? value : null;
}

function savePlayStats(stats: PlayStats): PlayStats {
  try {
    localStorage.setItem(PLAY_STATS_KEY, JSON.stringify(stats));
  } catch {
    /* Private browsing can keep the current session without persistence. */
  }
  return stats;
}

function safeAdd(left: number, right: number): number {
  return Math.min(Number.MAX_SAFE_INTEGER, left + right);
}

export function loadPlayStats(): PlayStats {
  try {
    const parsed = JSON.parse(localStorage.getItem(PLAY_STATS_KEY) ?? "null") as Partial<PlayStats> | null;
    return {
      version: 1,
      activePlaySeconds: safeInteger(parsed?.activePlaySeconds),
      finishedDays: safeInteger(parsed?.finishedDays),
      perfectDays: safeInteger(parsed?.perfectDays),
      completedAttractions: safeInteger(parsed?.completedAttractions),
      activeRunId: safeId(parsed?.activeRunId),
      activeStartedAt: safeTimestamp(parsed?.activeStartedAt),
      lastFinishedRunId: safeId(parsed?.lastFinishedRunId),
    };
  } catch {
    return { ...EMPTY_STATS };
  }
}

export function pausePlayTimer(now = Date.now()): PlayStats {
  const current = loadPlayStats();
  if (current.activeStartedAt === null) return current;
  const elapsedSeconds = Math.floor(Math.max(0, now - current.activeStartedAt) / 1_000);
  return savePlayStats({
    ...current,
    activePlaySeconds: safeAdd(current.activePlaySeconds, elapsedSeconds),
    activeStartedAt: null,
  });
}

export function beginTrackedRun(now = Date.now()): PlayStats {
  const current = pausePlayTimer(now);
  return savePlayStats({
    ...current,
    activeRunId: globalThis.crypto.randomUUID(),
    activeStartedAt: safeTimestamp(now),
  });
}

export function resumePlayTimer(now = Date.now()): PlayStats {
  const current = loadPlayStats();
  if (!current.activeRunId || current.activeStartedAt !== null) return current;
  return savePlayStats({ ...current, activeStartedAt: safeTimestamp(now) });
}

export function recordFinishedRun(
  runId: string,
  completed: number,
  perfect: boolean,
  now = Date.now(),
): PlayStats {
  const paused = pausePlayTimer(now);
  if (!runId || paused.lastFinishedRunId === runId) return paused;
  return savePlayStats({
    ...paused,
    finishedDays: safeAdd(paused.finishedDays, 1),
    perfectDays: safeAdd(paused.perfectDays, perfect ? 1 : 0),
    completedAttractions: safeAdd(paused.completedAttractions, safeInteger(completed)),
    activeRunId: null,
    activeStartedAt: null,
    lastFinishedRunId: runId,
  });
}

export function achievementStatsSnapshot(secrets: Secrets): AchievementStats {
  const stats = loadPlayStats();
  const completedChallenges: GameChallenge[] = [];
  if (secrets.perfect) completedChallenges.push("classic");
  if (secrets.nightPerfect) completedChallenges.push("night");
  if (secrets.festivalPerfect) completedChallenges.push("festival");
  if (secrets.mirrorPerfect) completedChallenges.push("mirror");
  if (secrets.stormPerfect) completedChallenges.push("storm");
  if (secrets.impossiblePerfect) completedChallenges.push("impossible");
  return {
    activePlaySeconds: stats.activePlaySeconds,
    finishedDays: stats.finishedDays,
    perfectDays: stats.perfectDays,
    completedAttractions: stats.completedAttractions,
    completedChallenges,
  };
}
