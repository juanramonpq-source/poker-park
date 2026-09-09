import { isAttractionComplete, legalSlotsForCard } from "./attractions.ts";
import { isAce, isFace } from "./deck.ts";
import { hasMirrorRules } from "./challenges.ts";
import {
  hasLegalAction,
  hasRequiredAction,
  legalExchanges,
  legalPlacements,
  legalVisits,
  remainingCards,
} from "./engine.ts";
import type { AttractionId, Card, ExchangeTarget, GameState } from "./types.ts";
import { ATTRACTION_IDS } from "./types.ts";

export type AiMove =
  | { type: "place"; cardId: string; attractionId: AttractionId; index: number }
  | { type: "visit"; cardId: string; attractionId: AttractionId }
  | { type: "exchange"; cardId: string; target: ExchangeTarget }
  | { type: "pass" }
  | { type: "close" };

function uniqueNeed(card: Card): AttractionId | null {
  if (isAce(card) && card.suit === "spades") return "haunted";
  if (isAce(card) && card.suit === "hearts") return "love";
  if (isAce(card) && card.suit === "diamonds") return "forest";
  if (isAce(card) && card.suit === "clubs") return "restaurant";
  return null;
}

function facesStillNeeded(state: GameState): number {
  let need = 0;
  const chairs = state.attractions.chairs;
  if (!isAttractionComplete("chairs", chairs.slots, hasMirrorRules(state))) {
    need += chairs.slots.slice(0, 4).filter((s) => !s).length;
  }
  const rest = state.attractions.restrooms;
  if (!isAttractionComplete("restrooms", rest.slots, hasMirrorRules(state))) {
    need += rest.slots.filter((s) => !s).length;
  }
  return need;
}

function scorePlace(
  state: GameState,
  card: Card,
  attractionId: AttractionId,
  index: number,
): number {
  let score = 12;
  const slots = state.attractions[attractionId].slots;
  const next = slots.slice();
  next[index] = card;
  const filled = next.filter(Boolean).length;
  score += filled * 6;
  if (isAttractionComplete(attractionId, next, hasMirrorRules(state))) score += 140;

  const key = uniqueNeed(card);
  if (key === attractionId) score += 90;
  else if (key) score -= 50;

  if (isFace(card) && attractionId !== "chairs" && attractionId !== "restrooms") {
    const remainingFaces = remainingCards(state).filter(isFace).length;
    if (remainingFaces <= facesStillNeeded(state) + 1) score -= 55;
  }

  if (attractionId === "coaster") score += state.challenge === "night" ? 82 : 18;
  if (attractionId === "restaurant") score += 4;
  if (attractionId === "love" && card.suit === "hearts") score += 10;
  if (attractionId === "forest") score += 8;
  if (attractionId === "haunted" && card.suit === "spades") score += 10;
  if (attractionId === "chairs" && (isFace(card) || card.suit === "spades")) score += 14;
  if (attractionId === "restrooms") score += 22;

  const almost = slots.filter(Boolean).length === slots.length - 1;
  if (almost) score += 40;

  return score;
}

export function chooseAiMove(state: GameState): AiMove {
  if (!hasRequiredAction(state)) return { type: "pass" };
  if (!hasLegalAction(state)) return { type: "pass" };

  let bestScore = -Infinity;
  let bestMove: AiMove = { type: "pass" };
  const consider = (score: number, move: AiMove) => {
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  };

  const hand = state.hands[state.currentPlayer];
  const swapped = state.swappedCardId
    ? hand.find((c) => c.id === state.swappedCardId)
    : undefined;

  const cards = swapped ? [swapped] : hand;
  for (const card of cards) {
    for (const place of legalPlacements(state, card.id)) {
      consider(
        scorePlace(state, card, place.attractionId, place.index) + (swapped ? 80 : 0),
        {
          type: "place",
          cardId: card.id,
          attractionId: place.attractionId,
          index: place.index,
        },
      );
    }
    for (const attractionId of legalVisits(state, card.id)) {
      consider(swapped ? 40 : 6, { type: "visit", cardId: card.id, attractionId });
    }
  }

  if (swapped && bestMove.type !== "pass") return bestMove;

  if (!swapped) {
    for (const card of hand) {
      for (const target of legalExchanges(state, card.id)) {
        let score = 20;
        if (target.kind === "slot") {
          const slots = state.attractions[target.attractionId].slots.slice();
          const previous = slots[target.index];
          slots[target.index] = card;
          if (isAttractionComplete(target.attractionId, slots, hasMirrorRules(state))) score += 160;
          if (previous && uniqueNeed(card) === target.attractionId) score += 40;
        } else if (target.kind === "ace-rack") {
          score += 300;
        }
        consider(score, { type: "exchange", cardId: card.id, target });
      }
    }
  }

  return bestMove;
}

export function anyLegalOnAttraction(
  state: GameState,
  attractionId: AttractionId,
  card: Card,
): number[] {
  return legalSlotsForCard(attractionId, state.attractions[attractionId].slots, card, hasMirrorRules(state));
}
