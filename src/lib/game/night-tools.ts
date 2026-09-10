import { makeDeck } from "./deck.ts";
import type { Card, GameState } from "./types.ts";

export function hasJackBox(state: GameState): boolean {
  return state.challenge === "night" && state.mode === "solo" && Boolean(state.night);
}

export function jokerAvailable(state: GameState): boolean {
  return hasJackBox(state) && state.difficulty === "easy" && !state.night?.jokerUsed;
}

export function jokerOptions(state: GameState): Card[] {
  return jokerAvailable(state) ? makeDeck().map(card => ({ ...card, id: `night-joker:${card.suit}:${card.rank}` })) : [];
}

export function playableCards(state: GameState): Card[] {
  return [...state.hands[state.currentPlayer], ...(hasJackBox(state) ? state.night?.jackBox ?? [] : [])];
}

export function playableCard(state: GameState, id: string): Card | undefined {
  return playableCards(state).find(card => card.id === id) ??
    (id.startsWith("night-joker:") ? jokerOptions(state).find(card => card.id === id) : undefined);
}

/** Mutates only a freshly created/cloned state. Every stored jack draws a replacement. */
export function storeNightJacks(state: GameState): void {
  if (!hasJackBox(state)) return;
  const hand = state.hands[0];
  const box = state.night!.jackBox ??= [];
  for (let index = 0; index < hand.length;) {
    if (hand[index].rank !== 11 || hand[index].id.startsWith("night-joker:")) { index += 1; continue; }
    const [jack] = hand.splice(index, 1);
    box.push(jack);
    const replacement = state.deck.pop();
    if (replacement) hand.splice(index, 0, replacement);
    if (state.swappedCardId === jack.id) state.swappedCardId = replacement?.id ?? null;
  }
}
