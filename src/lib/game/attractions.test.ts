import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isAttractionValid, legalSlotsForCard } from "./attractions.ts";
import type { Card, Rank, Suit } from "./types.ts";

function card(suit: Suit, rank: Rank): Card {
  return { id: `${suit}-${rank}`, suit, rank };
}

describe("montaña rusa", () => {
  it("solo acepta 2 o 3 en el primer hueco", () => {
    const empty: (Card | null)[] = Array.from({ length: 8 }, () => null);
    assert.deepEqual(legalSlotsForCard("coaster", empty, card("hearts", 2)), [0]);
    assert.deepEqual(legalSlotsForCard("coaster", empty, card("spades", 3)), [0]);
    assert.deepEqual(legalSlotsForCard("coaster", empty, card("hearts", 5)), []);
    assert.deepEqual(legalSlotsForCard("coaster", empty, card("hearts", 1)), []);
  });

  it("obliga a seguir en orden ascendente, sin saltos", () => {
    const slots = [card("clubs", 2), card("hearts", 3), null, null, null, null, null, null];
    assert.deepEqual(legalSlotsForCard("coaster", slots, card("diamonds", 4)), [2]);
    assert.deepEqual(legalSlotsForCard("coaster", slots, card("spades", 5)), []);
    assert.deepEqual(legalSlotsForCard("coaster", slots, card("hearts", 3)), []);
  });

  it("no deja rellenar desde el final", () => {
    const empty: (Card | null)[] = Array.from({ length: 8 }, () => null);
    const next = empty.slice();
    next[7] = card("hearts", 9);
    assert.equal(isAttractionValid("coaster", next), false);
  });
});

describe("túnel del amor", () => {
  it("empieza por un extremo, nunca por el as", () => {
    const empty: (Card | null)[] = Array.from({ length: 7 }, () => null);
    assert.deepEqual(legalSlotsForCard("love", empty, card("hearts", 5)), [0, 6]);
    assert.deepEqual(legalSlotsForCard("love", empty, card("hearts", 1)), []);
    assert.deepEqual(legalSlotsForCard("love", empty, card("spades", 5)), []);
  });

  it("sube por un lado, coloca el as en la cumbre y baja", () => {
    const slots = [
      card("hearts", 5),
      card("hearts", 8),
      card("hearts", 3),
      null,
      null,
      null,
      null,
    ];
    assert.deepEqual(legalSlotsForCard("love", slots, card("hearts", 1)), [3]);
    assert.deepEqual(legalSlotsForCard("love", slots, card("hearts", 9)), []);
  });

  it("también puede empezar por la derecha", () => {
    const slots = [null, null, null, null, null, null, card("hearts", 4)];
    assert.deepEqual(legalSlotsForCard("love", slots, card("hearts", 7)), [5]);
    assert.deepEqual(legalSlotsForCard("love", slots, card("hearts", 1)), []);
  });
});

describe("ases", () => {
  it("solo permite el as de picas en el tejado cuando la casa ya está formada", () => {
    const empty: (Card | null)[] = Array.from({ length: 5 }, () => null);
    assert.deepEqual(legalSlotsForCard("haunted", empty, card("spades", 1)), []);

    const house = [
      card("spades", 2), card("spades", 4), card("spades", 6), card("spades", 8), null,
    ];
    assert.deepEqual(legalSlotsForCard("haunted", house, card("spades", 1)), [4]);
    const tooEarly = empty.slice();
    tooEarly[4] = card("spades", 1);
    assert.equal(isAttractionValid("haunted", tooEarly), false);
  });

  it("no deja usar ases fuera de sus huecos reservados", () => {
    const restaurant: (Card | null)[] = Array.from({ length: 6 }, () => null);
    assert.deepEqual(legalSlotsForCard("restaurant", restaurant, card("clubs", 1)), [1]);
    assert.deepEqual(legalSlotsForCard("restaurant", restaurant, card("hearts", 1)), []);

    const chairs: (Card | null)[] = Array.from({ length: 7 }, () => null);
    assert.deepEqual(legalSlotsForCard("chairs", chairs, card("spades", 1)), []);
  });
});

describe("figuras", () => {
  it("no se colocan como palos ni como números", () => {
    const love: (Card | null)[] = Array.from({ length: 7 }, () => null);
    assert.deepEqual(legalSlotsForCard("love", love, card("hearts", 11)), []);
    assert.deepEqual(legalSlotsForCard("love", love, card("hearts", 13)), []);

    const haunted: (Card | null)[] = Array.from({ length: 5 }, () => null);
    assert.deepEqual(legalSlotsForCard("haunted", haunted, card("spades", 11)), []);
    assert.deepEqual(legalSlotsForCard("haunted", haunted, card("spades", 12)), []);

    const forest: (Card | null)[] = Array.from({ length: 11 }, () => null);
    assert.deepEqual(legalSlotsForCard("forest", forest, card("clubs", 12)), []);
    assert.deepEqual(legalSlotsForCard("forest", forest, card("diamonds", 13)), []);

    const restaurant: (Card | null)[] = Array.from({ length: 6 }, () => null);
    assert.deepEqual(legalSlotsForCard("restaurant", restaurant, card("hearts", 11)), []);
    assert.deepEqual(legalSlotsForCard("restaurant", restaurant, card("diamonds", 5)), [0, 2, 3, 4, 5]);

    const coaster: (Card | null)[] = Array.from({ length: 8 }, () => null);
    assert.deepEqual(legalSlotsForCard("coaster", coaster, card("hearts", 12)), []);
  });

  it("solo caben en sillas, aseos o como visitantes", () => {
    const chairs: (Card | null)[] = Array.from({ length: 7 }, () => null);
    assert.deepEqual(legalSlotsForCard("chairs", chairs, card("hearts", 11)), []);
    assert.deepEqual(legalSlotsForCard("chairs", chairs, card("spades", 13)), []);
    assert.deepEqual(legalSlotsForCard("chairs", chairs, card("spades", 7)), [4, 5, 6]);

    const restrooms: (Card | null)[] = [null, null];
    assert.deepEqual(legalSlotsForCard("restrooms", restrooms, card("hearts", 13)), [0, 1]);
    assert.deepEqual(legalSlotsForCard("restrooms", restrooms, card("spades", 12)), [0, 1]);
    assert.deepEqual(legalSlotsForCard("restrooms", restrooms, card("clubs", 11)), []);
  });

  it("el bosque pide dos columnas de diamantes bajo el 3×3", () => {
    const forest: (Card | null)[] = Array.from({ length: 11 }, () => null);
    assert.deepEqual(
      legalSlotsForCard("forest", forest, card("diamonds", 5)),
      [0, 1, 2, 3, 5, 6, 7, 8, 9, 10],
    );
    assert.deepEqual(
      legalSlotsForCard("forest", forest, card("clubs", 7)),
      [0, 1, 2, 3, 5, 6, 7, 8],
    );
    assert.deepEqual(legalSlotsForCard("forest", forest, card("diamonds", 1)), [4]);
    assert.deepEqual(legalSlotsForCard("forest", forest, card("clubs", 1)), []);
    const gated = forest.slice();
    gated[9] = card("diamonds", 4);
    assert.deepEqual(
      legalSlotsForCard("forest", gated, card("diamonds", 6)),
      [0, 1, 2, 3, 5, 6, 7, 8, 10],
    );
    assert.deepEqual(legalSlotsForCard("forest", gated, card("clubs", 6)), [0, 1, 2, 3, 5, 6, 7, 8]);
    assert.ok(!legalSlotsForCard("forest", forest, card("hearts", 4)).length);
  });

  it("las sillas no admiten figuras hasta tener la torre de 3 picas", () => {
    const partial: (Card | null)[] = [
      null, null, null, null,
      card("spades", 4), card("spades", 8), null,
    ];
    assert.deepEqual(legalSlotsForCard("chairs", partial, card("hearts", 11)), []);
    assert.deepEqual(legalSlotsForCard("chairs", partial, card("spades", 2)), [6]);

    const ready: (Card | null)[] = [
      null, null, null, null,
      card("spades", 4), card("spades", 8), card("spades", 2),
    ];
    assert.deepEqual(legalSlotsForCard("chairs", ready, card("hearts", 11)), [0, 1, 2, 3]);
    assert.deepEqual(legalSlotsForCard("chairs", ready, card("spades", 13)), [0, 1, 2, 3]);
  });
});
