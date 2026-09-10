import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createGame, exchangeCard, exchangeLimit, hasRequiredAction, legalExchanges, legalPlacements, placeCard, remainingCards } from "./engine.ts";
import { makeDeck } from "./deck.ts";
import { hasMirrorRules } from "./challenges.ts";
import { hasJackBox, jokerAvailable, jokerOptions, storeNightJacks } from "./night-tools.ts";
import { placementWarning } from "./placement-warning.ts";
import { isGameState } from "./state-validation.ts";
import { hasMasterPass, loadGame, loadSecrets, recordNightProgress, recordPerfectCompletion, saveGame } from "./persist.ts";
import { ATTRACTION_IDS, type GameState } from "./types.ts";

const deck = makeDeck();
const card = (id: string) => structuredClone(deck.find(c => c.id === id)!);
function hand(state: GameState, ids: string[]) {
  state.hands = [ids.map(card), []];
  const placed = Object.values(state.attractions).flatMap(a => a.slots).filter(Boolean).map(c => c!.id);
  const used = [...ids, ...placed, ...state.entrance.map(c => c.id), ...(state.night?.jackBox ?? []).map(c => c.id)];
  state.deck = deck.filter(c => !used.includes(c.id));
}

describe("caseta y comodín nocturnos", () => {
  it("reemplaza las Jotas del reparto sin perder ni duplicar cartas", () => {
    for (let i = 0; i < 100; i++) {
      const g = createGame("solo", undefined, "night", "easy");
      assert.equal(g.hands[0].length, 6);
      assert.ok(g.hands[0].every(c => c.rank !== 11));
      const cards = [...remainingCards(g), ...g.entrance];
      assert.equal(cards.length, 52);
      assert.equal(new Set(cards.map(c => c.id)).size, 52);
    }
  });
  it("reemplaza cadenas de Jotas y termina correctamente sin mazo", () => {
    const g = createGame("solo", undefined, "night");
    g.night!.jackBox = []; g.hands[0] = [card("clubs-11")];
    g.deck = [card("hearts-11"), card("spades-11")];
    storeNightJacks(g);
    assert.equal(g.night!.jackBox!.length, 3);
    assert.equal(g.hands[0].length, 0);
    assert.equal(g.deck.length, 0);
  });
  it("permite jugar una Jota de la caseta cuando la torre está preparada", () => {
    const g = createGame("solo", undefined, "night");
    g.night!.jackBox = [card("clubs-11")];
    g.night!.unlocked = [...ATTRACTION_IDS];
    assert.deepEqual(legalPlacements(g, "clubs-11"), []);
    [2, 3, 4].forEach((r, i) => { g.attractions.chairs.slots[4 + i] = card(`spades-${r}`); });
    assert.equal(legalPlacements(g, "clubs-11").length, 4);
    const next = placeCard(g, "clubs-11", "chairs", 0);
    assert.equal(next.night!.jackBox!.some(c => c.id === "clubs-11"), false);
    assert.equal(next.attractions.chairs.slots[0]!.id, "clubs-11");
    assert.equal(next.currentPlayer, 0);
  });
  it("reemplaza también una Jota recibida en un intercambio", () => {
    const g = createGame("solo", undefined, "night");
    g.night!.jackBox = []; g.hands[0] = [card("hearts-12")];
    g.entrance[0] = card("clubs-11"); g.deck = [card("clubs-2")];
    const next = exchangeCard(g, "hearts-12", { kind: "entrance", index: 0 });
    assert.equal(next.swappedCardId, "clubs-2");
    assert.equal(next.night!.jackBox![0].id, "clubs-11");
    assert.equal(next.exchangesUsed, 1);
  });
  it("cambia una Jota de la caseta por la Entrada sin robar ni perder cartas", () => {
    for (const difficulty of ["easy", "standard"] as const) {
      const g = createGame("solo", undefined, "night", difficulty);
      g.night!.jackBox = [card("clubs-11")];
      g.entrance = [card("clubs-2"), card("hearts-3")];
      hand(g, ["hearts-12"]);
      const before = structuredClone(g);
      assert.deepEqual(legalExchanges(g, "clubs-11"), [{ kind: "entrance", index: 0 }, { kind: "entrance", index: 1 }]);
      const next = exchangeCard(g, "clubs-11", { kind: "entrance", index: 0 });
      assert.deepEqual(g, before);
      assert.equal(next.entrance[0].id, "clubs-11");
      assert.equal(next.night!.jackBox!.length, 0);
      assert.deepEqual(next.hands[0].map(c => c.id), ["hearts-12", "clubs-2"]);
      assert.equal(next.swappedCardId, "clubs-2");
      assert.equal(next.exchangesUsed, 1);
      assert.equal(next.currentPlayer, g.currentPlayer);
      assert.equal(next.drawnThisTurn, g.drawnThisTurn);
      assert.deepEqual(next.deck, g.deck);
      assert.ok(isGameState(next));
      const cards = [...remainingCards(next), ...next.entrance];
      assert.equal(cards.length, 52);
      assert.equal(new Set(cards.map(c => c.id)).size, 52);
      assert.doesNotThrow(() => placeCard(next, "clubs-2", "restaurant", 0));
    }
  });
  it("respeta entradas cerradas, aforo y carta pendiente al cambiar desde la caseta", () => {
    const g = createGame("solo", undefined, "night");
    g.night!.jackBox = [card("clubs-11")];
    g.exchangesUsed = exchangeLimit(g) - 1;
    g.entranceFaceDown = [true, false];
    assert.deepEqual(legalExchanges(g, "clubs-11"), [{ kind: "entrance", index: 1 }]);
    assert.throws(() => exchangeCard(g, "clubs-11", { kind: "entrance", index: 0 }));
    const next = exchangeCard(g, "clubs-11", { kind: "entrance", index: 1 });
    assert.deepEqual(next.entranceFaceDown, [true, true]);
    g.swappedCardId = "hearts-2";
    assert.deepEqual(legalExchanges(g, "clubs-11"), []);
    g.swappedCardId = null; g.exchangesUsed = exchangeLimit(g);
    assert.deepEqual(legalExchanges(g, "clubs-11"), []);
    assert.throws(() => exchangeCard(g, "clubs-11", { kind: "entrance", index: 1 }));
  });
  it("reemplaza otra Jota recibida y reconoce la caseta como salida al bloqueo", () => {
    const g = createGame("solo", undefined, "night");
    g.night!.jackBox = [card("clubs-11")];
    g.night!.route = []; g.night!.unlocked = [...ATTRACTION_IDS];
    g.hands = [[], []]; g.deck = [];
    g.entrance = [card("hearts-11"), card("clubs-2")];
    assert.equal(hasRequiredAction(g), true);
    g.entranceFaceDown = [true, true];
    assert.equal(hasRequiredAction(g), false);
    g.entranceFaceDown = [false, false];
    g.deck = [card("clubs-3")];
    const next = exchangeCard(g, "clubs-11", { kind: "entrance", index: 0 });
    assert.equal(next.entrance[0].id, "clubs-11");
    assert.deepEqual(next.night!.jackBox!.map(c => c.id), ["hearts-11"]);
    assert.equal(next.swappedCardId, "clubs-3");
    assert.deepEqual(next.hands[0].map(c => c.id), ["clubs-3"]);
    assert.equal(next.deck.length, 0);
  });
  it("no permite intercambiar un comodín sin colocar ni casetas de otros modos", () => {
    const g = createGame("solo", undefined, "night", "easy");
    assert.deepEqual(legalExchanges(g, "night-joker:clubs:11"), []);
    g.night!.jackBox = [card("clubs-11")];
    g.hands = [[], []];
    for (const mode of ["online", "ai", "hotseat"] as const) {
      g.mode = mode;
      assert.deepEqual(legalExchanges(g, "clubs-11"), []);
    }
  });
  it("limita caseta y comodín a sus modos y dificultades", () => {
    for (const mode of ["solo", "hotseat", "ai", "online"] as const) {
      for (const challenge of ["classic", "night", "festival", "mirror", "storm", "impossible"] as const) {
        const g = createGame(mode, undefined, challenge, "easy");
        assert.equal(hasJackBox(g), mode === "solo" && challenge === "night");
        assert.equal(jokerAvailable(g), mode === "solo" && challenge === "night");
      }
    }
    assert.equal(jokerAvailable(createGame("solo", undefined, "night")), false);
  });
  it("el comodín respeta secuencias, suministro y dependencias y se consume una vez", () => {
    const g = createGame("solo", undefined, "night", "easy");
    assert.equal(jokerOptions(g).length, 52);
    assert.deepEqual(legalPlacements(g, "night-joker:spades:1"), []);
    g.night!.unlocked = [...ATTRACTION_IDS];
    assert.ok(!legalPlacements(g, "night-joker:hearts:4").some(p => p.attractionId === "coaster"));
    assert.ok(!legalPlacements(g, "night-joker:hearts:11").some(p => p.attractionId === "chairs"));
    const next = placeCard(g, "night-joker:clubs:1", "restaurant", 1);
    assert.equal(next.attractions.restaurant.slots[1]!.rank, 1);
    assert.equal(next.attractions.restaurant.slots[1]!.suit, "clubs");
    assert.equal(next.exchangesUsed, 0);
    assert.equal(next.night!.jokerUsed, true);
    assert.equal(jokerAvailable(g), true);
    assert.deepEqual(legalPlacements(next, "night-joker:hearts:1"), []);
    assert.ok(isGameState(next));
  });
  it("no declara bloqueo si puede usarse el comodín", () => {
    const g = createGame("solo", undefined, "night", "easy");
    g.night!.unlocked = [...ATTRACTION_IDS]; g.night!.route = [];
    g.night!.jackBox = []; g.hands = [[], []]; g.deck = []; g.exchangesUsed = 6;
    assert.equal(hasRequiredAction(g), true);
    g.night!.jokerUsed = true;
    assert.equal(hasRequiredAction(g), false);
  });
});

describe("advertencias de Fácil", () => {
  it("detecta picas compartidas en todos los retos y modalidades sin prohibir la jugada", () => {
    for (const mode of ["solo", "hotseat", "ai", "online"] as const) {
      for (const challenge of ["classic", "night", "festival", "mirror", "storm", "impossible"] as const) {
        const g = createGame(mode, undefined, challenge, "easy");
        if (g.night) { g.night.unlocked = [...ATTRACTION_IDS]; g.night.jokerUsed = true; }
        if (g.storm) g.storm.forecast = ["love", ...ATTRACTION_IDS.filter(id => id !== "love")];
        g.attractions.restaurant.slots = [card("spades-2"), card("clubs-1"), card("spades-3"), null, null, null];
        hand(g, ["spades-4"]);
        const before = structuredClone(g);
        const warning = placementWarning(g, "spades-4", "restaurant", 3);
        assert.ok(warning?.groups.some(group => group.attractions.includes("haunted") && group.attractions.includes("chairs")), `${mode}/${challenge}`);
        assert.deepEqual(g, before);
        assert.doesNotThrow(() => placeCard(g, "spades-4", "restaurant", 3));
      }
    }
  });
  it("detecta corazones gastados en la Montaña, también en espejo", () => {
    for (const challenge of ["classic", "mirror"] as const) {
      const g = createGame("solo", undefined, challenge, "easy");
      const reversed = hasMirrorRules(g);
      [2, 3, 4].forEach((r, i) => { g.attractions.coaster.slots[reversed ? 7 - i : i] = card(`hearts-${r}`); });
      hand(g, ["hearts-5"]);
      assert.ok(placementWarning(g, "hearts-5", "coaster", reversed ? 4 : 3)?.groups.some(group => group.attractions.includes("love")));
    }
  });
  it("detecta diamantes insuficientes para el Bosque y valores agotados de la Montaña", () => {
    const g = createGame("solo", undefined, "classic", "easy");
    g.attractions.restaurant.slots = [card("diamonds-2"), card("clubs-1"), card("diamonds-3"), card("diamonds-4"), card("diamonds-5"), null];
    g.attractions.coaster.slots = [card("clubs-3"), card("clubs-4"), card("clubs-5"), card("diamonds-6"), card("diamonds-7"), card("diamonds-8"), null, null];
    hand(g, ["diamonds-9"]);
    assert.ok(placementWarning(g, "diamonds-9", "restaurant", 5)?.groups.some(group => group.attractions.includes("forest")));
    const h = createGame("solo", undefined, "classic", "easy");
    h.attractions.coaster.slots[0] = card("clubs-2");
    h.attractions.restaurant.slots[0] = card("hearts-3");
    h.attractions.forest.slots[0] = card("clubs-3"); h.attractions.forest.slots[1] = card("diamonds-3");
    hand(h, ["spades-3"]);
    assert.ok(placementWarning(h, "spades-3", "haunted", 0)?.groups.some(group => group.attractions.includes("coaster")));
  });
  it("no confunde jugadas seguras, orden pendiente o clima con escasez", () => {
    for (const challenge of ["classic", "night", "festival", "mirror", "storm", "impossible"] as const) {
      const g = createGame("solo", undefined, challenge, "easy"); hand(g, ["clubs-1"]);
      assert.equal(placementWarning(g, "clubs-1", "restaurant", 1), null);
    }
  });
  it("cuenta el comodín, no repite carencias previas y no avisa en Clásico", () => {
    const g = createGame("solo", undefined, "night", "easy");
    g.attractions.restaurant.slots = [card("spades-2"), card("clubs-1"), card("spades-3"), null, null, null];
    hand(g, ["spades-4"]);
    assert.equal(placementWarning(g, "spades-4", "restaurant", 3), null);
    g.night!.jokerUsed = true;
    assert.ok(placementWarning(g, "spades-4", "restaurant", 3));
    g.attractions.restaurant.slots[3] = card("spades-4"); hand(g, ["clubs-4"]);
    assert.equal(placementWarning(g, "clubs-4", "restaurant", 4), null);
    g.difficulty = "standard";
    assert.equal(placementWarning(g, "clubs-4", "restaurant", 4), null);
  });
  it("no consulta manos ocultas ni el orden del mazo", () => {
    const g = createGame("online", undefined, "classic", "easy");
    g.attractions.restaurant.slots = [card("spades-2"), null, card("spades-3"), null, null, null];
    hand(g, ["spades-4"]);
    const warning = placementWarning(g, "spades-4", "restaurant", 3);
    g.hands[1] = g.deck.splice(0, 5); g.deck.reverse();
    assert.deepEqual(placementWarning(g, "spades-4", "restaurant", 3), warning);
  });
  it("identifica la propia Montaña si elegir su inicio obliga a usar un valor agotado", () => {
    const g = createGame("solo", undefined, "classic", "easy");
    g.attractions.restaurant.slots[0] = card("hearts-10");
    g.attractions.forest.slots[0] = card("diamonds-10");
    g.attractions.forest.slots[1] = card("clubs-10");
    g.attractions.haunted.slots[0] = card("spades-10");
    hand(g, ["clubs-3"]);
    const warning = placementWarning(g, "clubs-3", "coaster", 0);
    assert.ok(warning?.groups.some(group => group.attractions.length === 1 && group.attractions[0] === "coaster"));
  });
  it("un intercambio legal puede reparar una colocación aceptada pese al aviso", () => {
    const g = createGame("solo", undefined, "classic", "easy");
    g.attractions.restaurant.slots = [card("spades-2"), card("clubs-1"), card("spades-3"), null, null, null];
    hand(g, ["spades-4", "clubs-4"]);
    assert.ok(placementWarning(g, "spades-4", "restaurant", 3));
    const placed = placeCard(g, "spades-4", "restaurant", 3);
    const swapped = exchangeCard(placed, "clubs-4", { kind: "slot", attractionId: "restaurant", index: 3 });
    assert.equal(swapped.swappedCardId, "spades-4");
    assert.equal(swapped.exchangesUsed, 1);
    assert.equal(placementWarning(swapped, "spades-4", "haunted", 0), null);
    assert.doesNotThrow(() => placeCard(swapped, "spades-4", "haunted", 0));
  });
});

describe("guardado y progreso", () => {
  it("migra guardados, conserva el comodín gastado y separa acceso de acreditación", () => {
    const values = new Map<string, string>();
    Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    } });
    const g = createGame("solo", undefined, "night", "easy");
    delete g.night!.jackBox; g.hands[0] = [card("clubs-11")]; g.deck = [card("hearts-2")];
    saveGame(g);
    const loaded = loadGame()!;
    assert.equal(loaded.hands[0][0].id, "hearts-2");
    assert.equal(loaded.night!.jackBox![0].id, "clubs-11");
    loaded.night!.jokerUsed = true; saveGame(loaded);
    assert.equal(jokerAvailable(loadGame()!), false);
    assert.equal(hasMasterPass(recordNightProgress(g, 5)), false);
    assert.equal(hasMasterPass(recordNightProgress({ ...g, difficulty: "standard" }, 6)), false);
    const progress = recordNightProgress(g, 6);
    assert.equal(hasMasterPass(progress), true); assert.equal(progress.nightPerfect, false);
    assert.deepEqual(progress.classicMedals, []);
    recordPerfectCompletion("night", "easy");
    assert.equal(loadSecrets().nightPerfect, true);
    assert.equal(hasMasterPass({ ...loadSecrets(), masterPassUnlocked: undefined }), true);
  });
});
