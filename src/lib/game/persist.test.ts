import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { loadSecrets, recordPerfectCompletion } from "./persist.ts";

const values = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  },
});

describe("progreso por dificultad", () => {
  beforeEach(() => values.clear());

  it("Fácil concede todos los desbloqueos perfectos sin medallas clásicas", () => {
    for (const challenge of ["classic", "night", "festival", "mirror", "storm", "impossible"] as const) {
      recordPerfectCompletion(challenge, "easy");
    }
    const secrets = loadSecrets();
    assert.equal(secrets.perfect, true);
    assert.equal(secrets.nightPerfect, true);
    assert.equal(secrets.festivalPerfect, true);
    assert.equal(secrets.mirrorPerfect, true);
    assert.equal(secrets.stormPerfect, true);
    assert.equal(secrets.impossiblePerfect, true);
    assert.deepEqual(secrets.classicMedals, []);
  });

  it("Clásico concede la medalla diferenciada del reto y no la duplica", () => {
    recordPerfectCompletion("night", "standard");
    const secrets = recordPerfectCompletion("night", "standard");
    assert.equal(secrets.nightPerfect, true);
    assert.deepEqual(secrets.classicMedals, ["night"]);
    assert.deepEqual(loadSecrets().classicMedals, ["night"]);
  });
});
