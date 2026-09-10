import type { Card, Rank, Suit } from "./types.ts";

export const SUITS: Suit[] = ["hearts", "diamonds", "clubs", "spades"];

export function makeDeck(): Card[] {
  const cards: Card[] = [];
  for (const suit of SUITS) {
    for (let rank = 1; rank <= 13; rank++) {
      cards.push({
        id: `${suit}-${rank}`,
        suit,
        rank: rank as Rank,
      });
    }
  }
  return cards;
}

export function shuffle<T>(items: T[], rng: () => number = Math.random): T[] {
  const next = items.slice();
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const a = next[i]!;
    const b = next[j]!;
    next[i] = b;
    next[j] = a;
  }
  return next;
}

export function rankLabel(rank: Rank): string {
  if (rank === 1) return "A";
  if (rank === 11) return "J";
  if (rank === 12) return "Q";
  if (rank === 13) return "K";
  return String(rank);
}

export function isFace(card: Card): boolean {
  return card.rank >= 11;
}

export function isAce(card: Card): boolean {
  return card.rank === 1;
}

export function suitName(suit: Suit): string {
  switch (suit) {
    case "hearts":
      return "corazones";
    case "diamonds":
      return "diamantes";
    case "clubs":
      return "tréboles";
    case "spades":
      return "picas";
  }
}

export function cardName(card: Card): string {
  return `${card.id.startsWith("night-joker:") ? "Comodín: " : ""}${rankLabel(card.rank)} de ${suitName(card.suit)}`;
}

export function isRed(suit: Suit): boolean {
  return suit === "hearts" || suit === "diamonds";
}
