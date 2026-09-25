import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import {
  achievementStatsSnapshot,
  beginTrackedRun,
  loadPlayStats,
  pausePlayTimer,
  recordFinishedRun,
  resumePlayTimer,
} from "./play-stats.ts";
import type { Secrets } from "./persist.ts";

const values = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  },
});

const secrets: Secrets = {
  perfect: true,
  lifetime: false,
  nightPerfect: true,
  pentonuiSignal: false,
  festivalPerfect: true,
  mirrorPerfect: true,
  stormPerfect: false,
  impossiblePerfect: false,
  classicMedals: [],
};

describe("estadísticas locales de juego", () => {
  beforeEach(() => values.clear());

  it("suma exactamente diez segundos visibles", () => {
    beginTrackedRun(1_000);
    const paused = pausePlayTimer(11_000);
    assert.equal(paused.activePlaySeconds, 10);
    assert.equal(paused.activeStartedAt, null);
  });

  it("no suma tiempo mientras la partida está oculta", () => {
    beginTrackedRun(1_000);
    pausePlayTimer(6_000);
    pausePlayTimer(26_000);
    assert.equal(loadPlayStats().activePlaySeconds, 5);
    resumePlayTimer(30_000);
    pausePlayTimer(32_000);
    assert.equal(loadPlayStats().activePlaySeconds, 7);
  });

  it("consolida una jornada una sola vez por runId", () => {
    const started = beginTrackedRun(1_000);
    recordFinishedRun(started.activeRunId!, 7, true, 4_000);
    recordFinishedRun(started.activeRunId!, 7, true, 8_000);
    const stats = loadPlayStats();
    assert.equal(stats.finishedDays, 1);
    assert.equal(stats.perfectDays, 1);
    assert.equal(stats.completedAttractions, 7);
    assert.equal(stats.activePlaySeconds, 3);
  });

  it("recupera al recargar solo el intervalo visible pendiente", () => {
    values.set("poker-park.stats.v1", JSON.stringify({
      version: 1,
      activePlaySeconds: 3,
      finishedDays: 0,
      perfectDays: 0,
      completedAttractions: 0,
      activeRunId: "run-before-reload",
      activeStartedAt: 10_000,
      lastFinishedRunId: null,
    }));
    pausePlayTimer(15_000);
    assert.equal(loadPlayStats().activePlaySeconds, 8);
    assert.equal(loadPlayStats().activeStartedAt, null);
  });

  it("recupera almacenamiento malformado y acota contadores manipulados", () => {
    values.set("poker-park.stats.v1", "{");
    assert.deepEqual(loadPlayStats(), {
      version: 1,
      activePlaySeconds: 0,
      finishedDays: 0,
      perfectDays: 0,
      completedAttractions: 0,
      activeRunId: null,
      activeStartedAt: null,
      lastFinishedRunId: null,
    });

    values.set("poker-park.stats.v1", JSON.stringify({
      activePlaySeconds: -10,
      finishedDays: 1e99,
      perfectDays: 2.8,
      completedAttractions: "muchas",
      activeRunId: 42,
      activeStartedAt: -3,
      lastFinishedRunId: {},
    }));
    const safe = loadPlayStats();
    assert.equal(safe.activePlaySeconds, 0);
    assert.equal(safe.finishedDays, Number.MAX_SAFE_INTEGER);
    assert.equal(safe.perfectDays, 2);
    assert.equal(safe.completedAttractions, 0);
    assert.equal(safe.activeRunId, null);
    assert.equal(safe.activeStartedAt, null);
  });

  it("expone una instantánea sin identificadores internos", () => {
    const started = beginTrackedRun(1_000);
    recordFinishedRun(started.activeRunId!, 5, false, 6_000);
    assert.deepEqual(achievementStatsSnapshot(secrets), {
      activePlaySeconds: 5,
      finishedDays: 1,
      perfectDays: 0,
      completedAttractions: 5,
      completedChallenges: ["classic", "night", "festival", "mirror"],
    });
    assert.equal("activeRunId" in achievementStatsSnapshot(secrets), false);
  });
});
