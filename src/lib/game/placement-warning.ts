import { hasMirrorRules } from "./challenges.ts";
import { makeDeck } from "./deck.ts";
import { jokerAvailable, playableCard } from "./night-tools.ts";
import { ATTRACTION_IDS, type AttractionId, type Card, type GameState } from "./types.ts";

export interface PlacementWarning {
  groups: { attractions: AttractionId[]; missing: number }[];
}

type Need = (card: Card) => boolean;
const number = (card: Card) => card.rank >= 2 && card.rank <= 10;
const suitNumber = (suit: Card["suit"]): Need => card => number(card) && card.suit === suit;
const ace = (suit: Card["suit"]): Need => card => card.rank === 1 && card.suit === suit;

/** Eventual empty-slot requirements. Order and temporary power/weather are not shortages. */
function needs(state: GameState, id: AttractionId, coasterStart: number): Need[] {
  const slots = state.attractions[id].slots;
  const reversed = hasMirrorRules(state);
  const firstCoasterCard = slots.findIndex(Boolean);
  const start = firstCoasterCard < 0 ? coasterStart :
    slots[firstCoasterCard]!.rank - (reversed ? 7 - firstCoasterCard : firstCoasterCard);
  let restroomRank = slots.some(c => c?.rank === 12) ? 13 : 12;
  const result: Need[] = [];
  slots.forEach((card, index) => {
    if (card) return;
    switch (id) {
      case "coaster": {
        const rank = start + (reversed ? 7 - index : index);
        result.push(c => number(c) && c.rank === rank); break;
      }
      case "haunted": result.push(index === 4 ? ace("spades") : suitNumber("spades")); break;
      case "love": result.push(index === 3 ? ace("hearts") : suitNumber("hearts")); break;
      case "forest": result.push(index === 4 ? ace("diamonds") : index >= 9 ? suitNumber("diamonds") :
        c => number(c) && (c.suit === "clubs" || c.suit === "diamonds")); break;
      case "chairs": result.push(index >= 4 ? suitNumber("spades") : c => c.rank >= 11); break;
      case "restaurant": result.push(index === 1 ? ace("clubs") : number); break;
      case "restrooms": {
        const rank = restroomRank; restroomRank = 13;
        result.push(c => c.rank === rank); break;
      }
    }
  });
  return result;
}

/** Maximum bipartite matching also detects shared shortages (e.g. Terror + Sillas). */
function missingCards(requirements: Need[], pool: Card[], wildcard: boolean): number {
  const edges = requirements.map(need => {
    const eligible = pool.flatMap((card, index) => need(card) ? [index] : []);
    if (wildcard) eligible.push(pool.length);
    return eligible;
  }).sort((a, b) => a.length - b.length);
  const assigned = new Array<number>(pool.length + 1).fill(-1);
  const augment = (slot: number, seen: Set<number>): boolean => {
    for (const candidate of edges[slot]) {
      if (seen.has(candidate)) continue;
      seen.add(candidate);
      if (assigned[candidate] < 0 || augment(assigned[candidate], seen)) {
        assigned[candidate] = slot;
        return true;
      }
    }
    return false;
  };
  return requirements.length - edges.reduce((n, _, index) => n + Number(augment(index, new Set())), 0);
}

function deficits(state: GameState): number[] {
  // Only public board information: never inspect the deck order or another player's hand.
  const committed = new Set(Object.values(state.attractions).flatMap(a =>
    [...a.slots, ...a.visitors].filter((c): c is Card => Boolean(c)).map(c => c.id)));
  const pool = makeDeck().filter(c => !committed.has(c.id));
  const variants = [2, 3].map(start => ATTRACTION_IDS.map(id => needs(state, id, start)));
  const result = new Array<number>(128).fill(0);
  for (let mask = 1; mask < 128; mask++) {
    result[mask] = Math.min(...variants.map(variant => missingCards(
      variant.flatMap((slots, index) => mask & (1 << index) ? slots : []), pool, jokerAvailable(state),
    )));
  }
  return result;
}

export function placementWarning(state: GameState, cardId: string, id: AttractionId, index: number): PlacementWarning | null {
  if (state.difficulty !== "easy") return null;
  const card = playableCard(state, cardId);
  if (!card) return null;
  const next = structuredClone(state);
  next.attractions[id].slots[index] = card;
  if (card.id.startsWith("night-joker:")) next.night!.jokerUsed = true;
  const before = deficits(state);
  const after = deficits(next);
  const changed: number[] = [];
  for (let mask = 1; mask < 128; mask++) {
    if (after[mask] <= before[mask]) continue;
    if (changed.some(smaller => (mask & smaller) === smaller)) continue;
    changed.push(mask);
  }
  return changed.length ? { groups: changed.map(mask => ({
    attractions: ATTRACTION_IDS.filter((_, i) => mask & (1 << i)), missing: after[mask],
  })) } : null;
}
