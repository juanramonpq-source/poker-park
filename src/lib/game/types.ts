export type Suit = "hearts" | "diamonds" | "clubs" | "spades";
export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
}

export type AttractionId =
  | "coaster"
  | "haunted"
  | "love"
  | "forest"
  | "chairs"
  | "restaurant"
  | "restrooms";

export type Mode = "hotseat" | "ai";

export type Screen = "title" | "playing" | "pass" | "end";

export interface AttractionState {
  slots: (Card | null)[];
  visitors: Card[];
}

export type ExchangeTarget =
  | { kind: "entrance"; index: 0 | 1 }
  | { kind: "slot"; attractionId: AttractionId; index: number };

export interface GameState {
  version: 7;
  mode: Mode;
  names: [string, string];
  deck: Card[];
  hands: [Card[], Card[]];
  entrance: [Card, Card];
  entranceFaceDown: [boolean, boolean];
  attractions: Record<AttractionId, AttractionState>;
  exchangesUsed: number;
  currentPlayer: 0 | 1;
  drawnThisTurn: boolean;
  consecutivePasses: number;
  lastMessage: string | null;
  lastCompleted: AttractionId | null;
  swappedCardId: string | null;
  pendingAdvance: boolean;
  ended: boolean;
  endReason: "empty" | "block" | null;
}

export type DayRating =
  | "empty"
  | "shy"
  | "improvised"
  | "fair"
  | "fun"
  | "round"
  | "unforgettable"
  | "perfect";

export const MAX_EXCHANGES = 3;
export const HAND_START = 3;

export const ATTRACTION_IDS: AttractionId[] = [
  "coaster",
  "haunted",
  "love",
  "forest",
  "chairs",
  "restaurant",
  "restrooms",
];
