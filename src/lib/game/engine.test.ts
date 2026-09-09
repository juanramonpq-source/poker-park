import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createGame,
  exchangeCard,
  exchangeLimit,
  legalExchanges,
  nightEmergencyAvailable,
  passTurn,
} from "./engine.ts";
import type { Card, GameChallenge, Rank, Suit } from "./types.ts";

function card(suit: Suit, rank: Rank): Card {
  return { id: `${suit}-${rank}`, suit, rank };
}

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
    assert.equal(exchangeLimit({ challenge: "classic", difficulty: "easy" }), 4);
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
  it("reserva los cuatro ases fuera del reparto nocturno", () => {
    const game = createGame("hotseat", undefined, "night");
    assert.equal(game.night?.aceRack?.length, 4);
    assert.ok(game.night?.aceRack?.every((ace) => ace.rank === 1));
    assert.ok([...game.deck, ...game.hands[0], ...game.hands[1], ...game.entrance].every((item) => item.rank !== 1));
  });

  it("cambia una figura por un as que pueda colocarse inmediatamente", () => {
    let game = createGame("hotseat", undefined, "night");
    game.hands[0] = [card("hearts", 11)];
    const target = legalExchanges(game, "hearts-11").find(
      (item) => item.kind === "ace-rack" && item.cardId === "clubs-1",
    );
    assert.deepEqual(target, { kind: "ace-rack", cardId: "clubs-1" });
    game = exchangeCard(game, "hearts-11", target!);
    assert.equal(game.hands[0][0]?.id, "clubs-1");
    assert.equal(game.swappedCardId, "clubs-1");
    assert.ok(game.deck.some((item) => item.id === "hearts-11"));
    assert.ok(!game.night?.aceRack?.some((item) => item.id === "clubs-1"));
  });

  it("mantiene el as de picas en el llavero hasta que la casa está preparada", () => {
    const game = createGame("hotseat", undefined, "night");
    game.night!.unlocked.push("haunted");
    game.hands[0] = [card("hearts", 12)];
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
