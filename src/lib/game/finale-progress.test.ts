import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import {
  loadFinaleProgress,
  markAchievementSubmitted,
  markFinaleSeen,
  nextPendingFinale,
} from "./finale-progress.ts";
import type { MascotProgress } from "./mascot-progress.ts";
import { allChallengesComplete, type Secrets } from "./persist.ts";

const values = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  },
});

const completedSecrets = (classicMedals: Secrets["classicMedals"] = []): Secrets => ({
  perfect: true,
  lifetime: false,
  nightPerfect: true,
  masterPassUnlocked: true,
  pentonuiSignal: true,
  festivalPerfect: true,
  mirrorPerfect: true,
  stormPerfect: true,
  impossiblePerfect: true,
  classicMedals,
});

const goldMascots = (): MascotProgress => ({
  version: 1,
  greetings: { turtle: 101, hedgehog: 101, fish: 101 },
  lastGreeted: "fish",
  pentonuiMedal: false,
});

describe("finales narrativos", () => {
  beforeEach(() => values.clear());

  it("completa Poker Park con los seis retos en cualquier dificultad", () => {
    assert.equal(allChallengesComplete(completedSecrets()), true);
    assert.equal(allChallengesComplete({ ...completedSecrets(), mirrorPerfect: false }), false);
  });

  it("no exige medallas clásicas para ningún final", () => {
    const secrets = completedSecrets([]);
    assert.equal(nextPendingFinale(secrets, { ...goldMascots(), greetings: { turtle: 0, hedgehog: 0, fish: 0 } }), "park");
    markFinaleSeen("park");
    assert.equal(nextPendingFinale(secrets, goldMascots()), "ultimate");
  });

  it("ordena park antes de ultimate", () => {
    const secrets = completedSecrets([]);
    const mascots = goldMascots();
    assert.equal(nextPendingFinale(secrets, mascots), "park");
    markFinaleSeen("park");
    assert.equal(nextPendingFinale(secrets, mascots), "ultimate");
    markFinaleSeen("ultimate");
    assert.equal(nextPendingFinale(secrets, mascots), null);
  });

  it("persiste cada final y el envío una sola vez", () => {
    assert.deepEqual(loadFinaleProgress(), {
      version: 1,
      parkEndingSeen: false,
      ultimateEndingSeen: false,
      achievementSubmittedAt: null,
    });
    markFinaleSeen("park");
    markFinaleSeen("park");
    markAchievementSubmitted("2026-09-25T20:00:00.000Z");
    markAchievementSubmitted("2026-09-25T21:00:00.000Z");
    assert.deepEqual(loadFinaleProgress(), {
      version: 1,
      parkEndingSeen: true,
      ultimateEndingSeen: false,
      achievementSubmittedAt: "2026-09-25T20:00:00.000Z",
    });

    values.set("poker-park.finales.v1", "{");
    assert.equal(loadFinaleProgress().parkEndingSeen, false);
  });
});
