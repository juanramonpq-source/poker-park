import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
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

describe("progreso secreto de las mascotas", () => {
  beforeEach(() => values.clear());

  it("empieza con cero saludos sin inventar una mascota favorita", async () => {
    const modulePath = "./mascot-progress.ts";
    const progressModule = await import(modulePath).catch(() => null);

    assert.ok(progressModule, "falta el registro local de saludos");
    assert.deepEqual(progressModule.loadMascotProgress(), {
      version: 1,
      greetings: { turtle: 0, hedgehog: 0, fish: 0 },
      lastGreeted: null,
      pentonuiMedal: false,
    });
    assert.equal(progressModule.favoriteMascot(progressModule.loadMascotProgress()), null);
  });

  it("guarda cada saludo por mascota y usa el ultimo saludo para desempatar la favorita", async () => {
    const progressModule = await import("./mascot-progress.ts");
    assert.equal(typeof progressModule.recordMascotGreeting, "function");

    progressModule.recordMascotGreeting("turtle");
    progressModule.recordMascotGreeting("hedgehog");
    const progress = progressModule.loadMascotProgress();

    assert.deepEqual(progress.greetings, { turtle: 1, hedgehog: 1, fish: 0 });
    assert.equal(progress.lastGreeted, "hedgehog");
    assert.equal(progressModule.favoriteMascot(progress), "hedgehog");
  });

  it("concede bronce, plata y oro solo al superar 25, 50 y 100 saludos", async () => {
    const progressModule = await import("./mascot-progress.ts");
    assert.equal(typeof progressModule.mascotMedalTiers, "function");

    assert.deepEqual(progressModule.mascotMedalTiers(25), []);
    assert.deepEqual(progressModule.mascotMedalTiers(26), ["bronze"]);
    assert.deepEqual(progressModule.mascotMedalTiers(50), ["bronze"]);
    assert.deepEqual(progressModule.mascotMedalTiers(51), ["bronze", "silver"]);
    assert.deepEqual(progressModule.mascotMedalTiers(100), ["bronze", "silver"]);
    assert.deepEqual(progressModule.mascotMedalTiers(101), ["bronze", "silver", "gold"]);
  });

  it("recupera valores seguros si el progreso guardado esta incompleto o manipulado", async () => {
    const progressModule = await import("./mascot-progress.ts");
    values.set("poker-park.mascots.v1", JSON.stringify({
      greetings: { turtle: 12.9, hedgehog: -4, fish: "muchos" },
      lastGreeted: "dragon",
    }));

    assert.deepEqual(progressModule.loadMascotProgress(), {
      version: 1,
      greetings: { turtle: 12, hedgehog: 0, fish: 0 },
      lastGreeted: null,
      pentonuiMedal: false,
    });
  });

  it("redacta la nota del recuento con el nombre de la mascota favorita", async () => {
    const progressModule = await import("./mascot-progress.ts");
    assert.equal(typeof progressModule.favoriteMascotNote, "function");

    assert.equal(progressModule.favoriteMascotNote({
      version: 1,
      greetings: { turtle: 4, hedgehog: 9, fish: 2 },
      lastGreeted: "turtle",
      pentonuiMedal: false,
    }), "Mascota favorita de este dispositivo: Púa.");
  });

  it("concede Pentonúi con seis retos y tres oros", async () => {
    const progressModule = await import("./mascot-progress.ts");
    assert.equal(typeof progressModule.qualifiesForPentonuiMedal, "function");
    const completedSecrets: Secrets = {
      perfect: true,
      lifetime: false,
      nightPerfect: true,
      pentonuiSignal: true,
      festivalPerfect: true,
      mirrorPerfect: true,
      stormPerfect: true,
      impossiblePerfect: true,
      classicMedals: [],
    };
    const almost = {
      version: 1,
      greetings: { turtle: 101, hedgehog: 101, fish: 100 },
      lastGreeted: "fish",
      pentonuiMedal: false,
    } as const;

    assert.equal(progressModule.qualifiesForPentonuiMedal({
      ...almost,
      greetings: { ...almost.greetings, fish: 101 },
    }, completedSecrets), true);
  });

  it("no concede Pentonúi con un reto u oro pendiente", async () => {
    const progressModule = await import("./mascot-progress.ts");
    const completedSecrets: Secrets = {
      perfect: true,
      lifetime: false,
      nightPerfect: true,
      pentonuiSignal: true,
      festivalPerfect: true,
      mirrorPerfect: true,
      stormPerfect: true,
      impossiblePerfect: true,
      classicMedals: [],
    };
    const gold = {
      version: 1,
      greetings: { turtle: 101, hedgehog: 101, fish: 101 },
      lastGreeted: "fish",
      pentonuiMedal: false,
    } as const;

    assert.equal(progressModule.qualifiesForPentonuiMedal({
      ...gold,
      greetings: { ...gold.greetings, fish: 100 },
    }, completedSecrets), false);
    assert.equal(progressModule.qualifiesForPentonuiMedal(gold, {
      ...completedSecrets,
      stormPerfect: false,
    }), false);
  });

  it("concede y guarda la medalla Pentonui una sola vez", async () => {
    const progressModule = await import("./mascot-progress.ts");
    assert.equal(typeof progressModule.claimPentonuiMedal, "function");
    values.set("poker-park.mascots.v1", JSON.stringify({
      version: 1,
      greetings: { turtle: 101, hedgehog: 101, fish: 101 },
      lastGreeted: "fish",
      pentonuiMedal: false,
    }));
    const completedSecrets: Secrets = {
      perfect: true,
      lifetime: false,
      nightPerfect: true,
      pentonuiSignal: true,
      festivalPerfect: true,
      mirrorPerfect: true,
      stormPerfect: true,
      impossiblePerfect: true,
      classicMedals: [],
    };

    const first = progressModule.claimPentonuiMedal(completedSecrets);
    assert.equal(first.newlyAwarded, true);
    assert.equal(first.progress.pentonuiMedal, true);
    const second = progressModule.claimPentonuiMedal(completedSecrets);
    assert.equal(second.newlyAwarded, false);
    assert.equal(second.progress.pentonuiMedal, true);
  });
});
