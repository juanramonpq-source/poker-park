import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  advanceTurn,
  createGame,
  exchangeCard,
  exchangeLimit,
  legalExchanges,
  nightAceCandidates,
  nightEmergencyAvailable,
  passTurn,
  hasRequiredAction,
  visitorPhase,
  parkSolved,
  closePark,
  placeVisitor,
  placeCard,
  legalVisits,
} from "./engine.ts";
import { completedPark } from "../../../scripts/fixtures/completed-park.ts";
import { chooseAiMove } from "./ai.ts";
import { loadGame } from "./persist.ts";
import type { Card, GameChallenge, Rank, Suit } from "./types.ts";

function card(suit: Suit, rank: Rank): Card {
  return { id: `${suit}-${rank}`, suit, rank };
}

describe("cierre de jornada con cambios ahorrados", () => {
  for (const challenge of ["classic", "night", "festival", "mirror", "storm", "impossible"] as const) {
    for (const mode of ["solo", "hotseat", "ai", "online"] as const) {
      for (const difficulty of ["standard", "easy"] as const) {
        it(`${challenge} / ${mode} / ${difficulty}: cerrar o dejar visitante sin gastar cambios`, () => {
          const game = completedPark(mode, challenge, difficulty);
          assert.equal(parkSolved(game), true);
          assert.ok(legalExchanges(game, "clubs-12").length > 0);
          assert.equal(hasRequiredAction(game), false);
          const closed = closePark(game);
          assert.equal(closed.endReason, "closed");
          assert.equal(closed.exchangesUsed, 0);
          const target = legalVisits(game, "clubs-12")[0]!;
          assert.ok(target);
          const visited = placeVisitor(game, "clubs-12", target);
          assert.equal(visited.attractions[target].visitors.length, 1);
          assert.equal(visited.exchangesUsed, 0);
          assert.equal(hasRequiredAction(visited), false);
          assert.equal(chooseAiMove(game).type, "pass");
          const beforeLast = structuredClone(game);
          const lastCard = beforeLast.attractions.restrooms.slots[1]!;
          beforeLast.attractions.restrooms.slots[1] = null;
          beforeLast.hands[0].push(lastCard);
          if (beforeLast.storm) beforeLast.storm = { forecast: ["coaster", "forest"], index: 0 };
          const lastPlaced = placeCard(beforeLast, lastCard.id, "restrooms", 1);
          assert.equal(lastPlaced.pendingAdvance, true, "se conserva la celebración de la última atracción");
          assert.equal(hasRequiredAction(advanceTurn(lastPlaced)), false);
          const partial = structuredClone(game);
          partial.attractions.haunted.slots[challenge === "mirror" || challenge === "impossible" ? 0 : 4] = null;
          assert.equal(visitorPhase(partial), true, "también cierra con menos de siete si no se puede ampliar");
          assert.equal(hasRequiredAction(partial), false);
        });
      }
    }
  }

  it("ofrece cierre sin visitante disponible cuando ya no queda nada que ampliar", () => {
    const game = completedPark();
    game.attractions.haunted.slots[4] = null;
    game.hands = [[card("clubs", 2)], []];
    game.deck = [];
    assert.equal(parkSolved(game), false);
    assert.equal(visitorPhase(game), true);
    assert.equal(hasRequiredAction(game), false);
    assert.deepEqual(legalVisits(game, "clubs-2"), []);
  });

  it("conserva una colocación futura en la Entrada, el mazo o la otra mano", () => {
    for (const source of ["entrance", "deck", "other-hand"] as const) {
      const game = completedPark("hotseat");
      game.attractions.haunted.slots[4] = null;
      if (source === "entrance") game.entrance[0] = card("spades", 1);
      if (source === "deck") game.deck = [card("spades", 1)];
      if (source === "other-hand") game.hands[1] = [card("spades", 1)];
      assert.equal(visitorPhase(game), false, source);
    }
  });

  it("no confunde una tormenta temporal con el final", () => {
    const game = completedPark("solo", "storm");
    game.attractions.haunted.slots[4] = null;
    game.hands[0] = [card("spades", 1)];
    game.storm = { forecast: ["haunted", "forest"], index: 0 };
    assert.equal(visitorPhase(game), false);
  });

  it("conserva el suministro pendiente y el comodín nocturno", () => {
    const game = completedPark("solo", "night", "easy");
    game.attractions.haunted.slots[4] = null;
    game.night!.route = ["haunted"];
    assert.equal(visitorPhase(game), false);
    game.night!.route = [];
    game.night!.jokerUsed = false;
    assert.equal(visitorPhase(game), false);
  });

  it("conserva un intercambio estructural que recupera una carta útil", () => {
    const game = completedPark();
    game.deck = [];
    game.hands = [[card("clubs", 9)], []];
    game.attractions.coaster.slots[6] = null;
    game.attractions.coaster.slots[7] = null;
    game.attractions.restaurant.slots[0] = card("clubs", 8);
    game.attractions.restaurant.slots[1] = null;
    // The 9 cannot fill the missing ace or the next coaster slot (8).
    // Swapping it for the restaurant's 8 makes the coaster playable.
    assert.equal(visitorPhase(game), false);
    const next = exchangeCard(game, "clubs-9", { kind: "slot", attractionId: "restaurant", index: 0 });
    assert.equal(hasRequiredAction(next), true);
  });
});

describe("equilibrio de intercambios", () => {
  it("asigna un margen explícito a cada modo", () => {
    const expected: Array<[GameChallenge, number]> = [
      ["classic", 3],
      ["night", 5],
      ["festival", 4],
      ["mirror", 5],
      ["storm", 5],
      ["impossible", 6],
    ];
    for (const [challenge, limit] of expected) {
      assert.equal(exchangeLimit({ challenge, difficulty: "standard" }), limit);
    }
    for (const [challenge, limit] of expected) {
      assert.equal(exchangeLimit({ challenge, difficulty: "easy" }), limit + 1);
    }
  });

  it("cierra las entradas en relación con el límite real del modo", () => {
    let game = createGame("hotseat", undefined, "storm");
    const limit = exchangeLimit(game);
    game.exchangesUsed = limit - 2;
    const firstCard = game.hands[game.currentPlayer][0]!;
    game = exchangeCard(game, firstCard.id, { kind: "entrance", index: 0 });
    assert.deepEqual(game.entranceFaceDown, [true, false]);
    game.swappedCardId = null;
    const secondCard = game.hands[game.currentPlayer][0]!;
    game = exchangeCard(game, secondCard.id, { kind: "entrance", index: 1 });
    assert.deepEqual(game.entranceFaceDown, [true, true]);
    assert.equal(game.exchangesUsed, limit);
  });
});

describe("Llavero de Ases", () => {
  it("mantiene los cuatro ases dentro del reparto nocturno normal", () => {
    const game = createGame("hotseat", undefined, "night");
    const dealt = [...game.deck, ...game.hands[0], ...game.hands[1], ...game.entrance];
    assert.equal(dealt.length, 52);
    assert.equal(new Set(dealt.map((item) => item.id)).size, 52);
    assert.equal(dealt.filter((item) => item.rank === 1).length, 4);
    assert.equal(game.night?.aceRack, undefined);
  });

  it("rescata del mazo un as que pueda colocarse inmediatamente", () => {
    let game = createGame("hotseat", undefined, "night");
    game.hands[0] = [card("hearts", 11)];
    game.deck = [card("clubs", 1)];
    const target = legalExchanges(game, "hearts-11").find(
      (item) => item.kind === "ace-rack" && item.cardId === "clubs-1",
    );
    assert.deepEqual(target, { kind: "ace-rack", cardId: "clubs-1" });
    game = exchangeCard(game, "hearts-11", target!);
    assert.equal(game.hands[0][0]?.id, "clubs-1");
    assert.equal(game.swappedCardId, "clubs-1");
    assert.ok(game.deck.some((item) => item.id === "hearts-11"));
    assert.ok(!game.deck.some((item) => item.id === "clubs-1"));
  });

  it("mantiene el as de picas oculto hasta que la casa está preparada", () => {
    const game = createGame("hotseat", undefined, "night");
    game.night!.unlocked.push("haunted");
    game.hands[0] = [card("hearts", 12)];
    game.deck = [card("spades", 1)];
    const early = legalExchanges(game, "hearts-12");
    assert.ok(!early.some((item) => item.kind === "ace-rack" && item.cardId === "spades-1"));
    game.attractions.haunted.slots = [
      card("spades", 2),
      card("spades", 4),
      card("spades", 6),
      card("spades", 8),
      null,
    ];
    const ready = legalExchanges(game, "hearts-12");
    assert.ok(ready.some((item) => item.kind === "ace-rack" && item.cardId === "spades-1"));
  });

  it("no ofrece mediante el llavero un as que ya ha salido del mazo", () => {
    const game = createGame("hotseat", undefined, "night");
    game.hands[0] = [card("hearts", 11)];
    game.hands[1] = [card("clubs", 1)];
    game.deck = game.deck.filter((item) => item.id !== "clubs-1");
    assert.ok(!nightAceCandidates(game).some((item) => item.id === "clubs-1"));
    assert.ok(!legalExchanges(game, "hearts-11").some(
      (item) => item.kind === "ace-rack" && item.cardId === "clubs-1",
    ));
  });

  it("devuelve al mazo los ases de una partida nocturna guardada con el sistema anterior", () => {
    const legacy = createGame("hotseat", undefined, "night");
    const legacyAces = (["hearts", "spades", "diamonds", "clubs"] as Suit[])
      .map((suit) => card(suit, 1));
    legacy.deck = legacy.deck.filter((item) => item.rank !== 1);
    legacy.hands = [
      legacy.hands[0].filter((item) => item.rank !== 1),
      legacy.hands[1].filter((item) => item.rank !== 1),
    ];
    legacy.entrance = legacy.entrance.map((item) =>
      item.rank === 1 ? legacy.deck.pop()! : item,
    ) as [Card, Card];
    legacy.night!.aceRack = legacyAces;

    const originalStorage = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: {
        getItem: (key: string) => key === "poker-park.save.v7" ? JSON.stringify(legacy) : null,
      },
    });
    try {
      const loaded = loadGame();
      assert.ok(loaded);
      assert.equal(loaded.night?.aceRack, undefined);
      assert.deepEqual(
        loaded.deck.filter((item) => item.rank === 1).map((item) => item.id).sort(),
        legacyAces.map((item) => item.id).sort(),
      );
    } finally {
      if (originalStorage) Object.defineProperty(globalThis, "localStorage", originalStorage);
      else delete (globalThis as { localStorage?: unknown }).localStorage;
    }
  });

  it("permite recurrir al generador aunque todavía queden cambios", () => {
    const game = createGame("hotseat", undefined, "night");
    game.hands[0] = [card("hearts", 11)];
    assert.ok(legalExchanges(game, "hearts-11").length > 0);
    assert.equal(nightEmergencyAvailable(game), true);
  });
});

describe("bloqueo con mal tiempo", () => {
  it("espera dos rondas completas en tormenta y 00:13", () => {
    let game = createGame("hotseat", undefined, "storm");
    for (let pass = 1; pass <= 3; pass += 1) {
      game = passTurn(game, true);
      assert.equal(game.ended, false, `la partida terminó en el pase ${pass}`);
    }
    game = passTurn(game, true);
    assert.equal(game.ended, true);
    assert.equal(game.endReason, "block");
  });

  it("mantiene el bloqueo clásico tras una ronda completa", () => {
    let game = createGame("hotseat");
    game = passTurn(game, true);
    assert.equal(game.ended, false);
    game = passTurn(game, true);
    assert.equal(game.ended, true);
  });
});

describe("modo solitario", () => {
  it("reparte cinco cartas y roba la sexta al abrir la jornada", () => {
    const game = createGame("solo");
    assert.equal(game.currentPlayer, 0);
    assert.equal(game.hands[0].length, 6);
    assert.equal(game.hands[1].length, 0);
    assert.equal(game.deck.length, 44);
    assert.equal(game.names[0], "Tú");
  });

  it("mantiene el turno en la única mano y roba tras avanzar", () => {
    const game = createGame("solo");
    const handSize = game.hands[0].length;
    const deckSize = game.deck.length;
    const next = advanceTurn(game);
    assert.equal(next.currentPlayer, 0);
    assert.equal(next.hands[0].length, handSize + 1);
    assert.equal(next.deck.length, deckSize - 1);
    assert.equal(next.hands[1].length, 0);
  });

  it("termina el bloqueo tras una sola confirmación", () => {
    const game = passTurn(createGame("solo"), true);
    assert.equal(game.ended, true);
    assert.equal(game.endReason, "block");
  });

  it("mantiene una única mano ampliada en todos los modos", () => {
    const challenges: GameChallenge[] = ["classic", "night", "festival", "mirror", "storm", "impossible"];
    for (const challenge of challenges) {
      const game = createGame("solo", undefined, challenge);
      assert.equal(game.mode, "solo", challenge);
      assert.equal(game.challenge, challenge);
      assert.equal(game.currentPlayer, 0, challenge);
      assert.equal(game.hands[0].length, 6, challenge);
      assert.equal(game.hands[1].length, 0, challenge);
      if (challenge === "night") {
        const dealt = [...game.deck, ...game.hands[0], ...game.entrance];
        assert.equal(dealt.filter((item) => item.rank === 1).length, 4);
      }
    }
  });

  it("espera dos frentes en Tormenta y 00:13", () => {
    for (const challenge of ["storm", "impossible"] as const) {
      let game = passTurn(createGame("solo", undefined, challenge), true);
      assert.equal(game.ended, false, `${challenge} terminó con el primer frente`);
      assert.equal(game.currentPlayer, 0, challenge);
      game = passTurn(game, true);
      assert.equal(game.ended, true, challenge);
      assert.equal(game.endReason, "block", challenge);
    }
  });
});


describe("Festival: repetir cierra el reto", () => {
  for (const challenge of ["festival", "impossible"] as const) {
    for (const mode of ["solo", "hotseat", "ai", "online"] as const) {
      it(`${challenge} ${mode}: una segunda colocación consecutiva cierra sin fiesta`, () => {
        const g = createGame(mode, undefined, challenge);
        g.storm = undefined;
        g.festival!.lastAttractionId = "restrooms";
        g.attractions.restrooms.slots[challenge === "impossible" ? 1 : 0] = card("hearts", challenge === "impossible" ? 12 : 13);
        const c = card("spades", challenge === "impossible" ? 13 : 12);
        g.hands[g.currentPlayer] = [c];
        const n = placeCard(g, c.id, "restrooms", challenge === "impossible" ? 0 : 1);
        assert.equal(n.ended, true);
        assert.equal(n.endReason, "repeat");
        assert.equal(n.pendingAdvance, false);
        assert.equal(n.lastCompleted, null);
        assert.equal(g.ended, false);
      });
    }
  }
  it("permite volver al destino tras colocar en otro", () => {
    let g = createGame("solo", undefined, "festival");
    g.hands[0] = [card("hearts", 2), card("clubs", 3), card("hearts", 4)];
    g = placeCard(g, "hearts-2", "love", 0);
    g = placeCard(g, "clubs-3", "forest", 0);
    g = placeCard(g, "hearts-4", "love", 1);
    assert.equal(g.ended, false);
    assert.equal(g.festival!.combo, 3);
  });
});

it("el compañero evita una repetición aunque complete una atracción", () => {
  const g = createGame("ai", undefined, "festival");
  g.festival!.lastAttractionId = "restrooms";
  g.attractions.restrooms.slots[0] = card("hearts", 13);
  g.hands[g.currentPlayer] = [card("hearts", 12), card("clubs", 2)];
  const move = chooseAiMove(g);
  assert.equal(move.type, "place");
  if (move.type === "place") assert.notEqual(move.attractionId, "restrooms");
});
