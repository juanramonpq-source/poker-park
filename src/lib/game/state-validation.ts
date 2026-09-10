import { z } from "zod";
import type { GameState } from "./types.ts";

const attractionId = z.enum(["coaster", "haunted", "love", "forest", "chairs", "restaurant", "restrooms"]);
const card = z.object({
  id: z.string().min(1).max(64),
  suit: z.enum(["hearts", "diamonds", "clubs", "spades"]),
  rank: z.number().int().min(1).max(13),
});
const cards = z.array(card).max(52);
const counter = z.number().int().nonnegative();
const attraction = (slots: number) => z.object({
  slots: z.array(card.nullable()).length(slots),
  visitors: cards,
});

// Validate external data at the boundary; placement rules remain in the engine.
const gameSchema = z.object({
  version: z.literal(7),
  mode: z.enum(["solo", "hotseat", "ai", "online"]),
  difficulty: z.enum(["standard", "easy"]).optional(),
  challenge: z.enum(["classic", "night", "festival", "mirror", "storm", "impossible"]).optional(),
  names: z.tuple([z.string(), z.string()]),
  deck: cards,
  hands: z.tuple([cards, cards]),
  entrance: z.tuple([card, card]),
  entranceFaceDown: z.tuple([z.boolean(), z.boolean()]),
  attractions: z.object({
    coaster: attraction(8), haunted: attraction(5), love: attraction(7),
    forest: attraction(11), chairs: attraction(7), restaurant: attraction(6), restrooms: attraction(2),
  }),
  exchangesUsed: counter,
  currentPlayer: z.union([z.literal(0), z.literal(1)]),
  drawnThisTurn: z.boolean(),
  consecutivePasses: counter,
  lastMessage: z.string().nullable(),
  lastCompleted: attractionId.nullable(),
  swappedCardId: z.string().nullable(),
  pendingAdvance: z.boolean(),
  ended: z.boolean(),
  endReason: z.enum(["empty", "block", "closed"]).nullable().optional(),
  night: z.object({
    unlocked: z.array(attractionId).max(7), route: z.array(attractionId).max(7),
    pendingUnlock: z.boolean(), emergencyUses: counter, aceRack: cards.optional(),
  }).optional(),
  festival: z.object({
    combo: counter, bestCombo: counter, bulbs: counter, lastAttractionId: attractionId.nullable(),
  }).optional(),
  storm: z.object({ forecast: z.array(attractionId).length(7), index: counter }).optional(),
});

export function isGameState(value: unknown): value is GameState {
  return gameSchema.safeParse(value).success;
}
