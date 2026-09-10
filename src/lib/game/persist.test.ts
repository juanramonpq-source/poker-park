import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { loadGame, loadSettings, loadSecrets, saveGame, recordPerfectCompletion } from "./persist.ts";
import { createGame } from "./engine.ts";
import { isGameState } from "./state-validation.ts";

const values = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  },
});

describe("recuperación de datos", () => {
  beforeEach(() => values.clear());

  it("conserva las partidas válidas de todos los modos y retos", () => {
    for (const mode of ["solo", "hotseat", "ai", "online"] as const) {
      for (const challenge of ["classic", "night", "festival", "mirror", "storm", "impossible"] as const) {
        const game = createGame(mode, undefined, challenge);
        saveGame(game);
        assert.deepEqual(loadGame(), JSON.parse(JSON.stringify(game)));
      }
    }
  });

  it("rechaza partidas incompletas sin borrar la copia guardada", () => {
    for (const raw of ['{', 'null', '{"version":7}', JSON.stringify({ ...createGame("solo"), hands: [] })]) {
      values.set("poker-park.save.v7", raw);
      assert.equal(loadGame(), null);
      assert.equal(values.get("poker-park.save.v7"), raw);
    }
  });

  it("rechaza cartas y tableros malformados recibidos por red", () => {
    const game = createGame("online");
    game.deck[0]!.rank = 99 as never;
    assert.equal(isGameState(game), false);
    const other = createGame("online");
    other.attractions.coaster.slots.pop();
    assert.equal(isGameState(other), false);
  });

  it("recupera opciones seguras ante preferencias corruptas", () => {
    values.set("poker-park.settings.v1", JSON.stringify({ muted: "false", showcaseTheme: "unknown", cardBack: null, nightTheme: true }));
    assert.deepEqual(loadSettings(), { version: 1, muted: false, nightTheme: true, showcaseTheme: "classic", cardBack: "classic" });
  });

  it("mantiene la migración del antiguo llavero nocturno", () => {
    const game = createGame("solo", undefined, "night");
    const ace = { id: "legacy-ace", suit: "spades" as const, rank: 1 as const };
    game.night!.aceRack = [ace];
    saveGame(game);
    const loaded = loadGame()!;
    assert.equal(loaded.deck.filter((card) => card.id === ace.id).length, 1);
    assert.equal(loaded.night!.aceRack, undefined);
  });
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
