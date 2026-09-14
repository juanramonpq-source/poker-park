import { createGame } from "../../src/lib/game/engine.ts";
import { makeDeck } from "../../src/lib/game/deck.ts";
import { hasMirrorRules } from "../../src/lib/game/challenges.ts";
import { ATTRACTION_IDS, type GameChallenge, type GameDifficulty, type Mode } from "../../src/lib/game/types.ts";

export function completedPark(mode: Mode = "solo", challenge: GameChallenge = "classic", difficulty: GameDifficulty = "standard") {
  const game = createGame(mode, undefined, challenge, difficulty);
  const deck = makeDeck();
  const card = (id: string) => ({ ...deck.find(card => card.id === id)! });
  game.attractions.coaster.slots = [2,3,4,5,6,7,8,9].map(rank => card(`clubs-${rank}`));
  if (hasMirrorRules(game)) game.attractions.coaster.slots.reverse();
  game.attractions.haunted.slots = [2,3,4,5,1].map(rank => card(`spades-${rank}`));
  game.attractions.love.slots = [2,3,4,1,5,6,7].map(rank => card(`hearts-${rank}`));
  game.attractions.forest.slots = ["diamonds-2","diamonds-3","diamonds-4","diamonds-5","diamonds-1","diamonds-6","diamonds-7","diamonds-8","clubs-10","diamonds-9","diamonds-10"].map(card);
  game.attractions.chairs.slots = ["hearts-11","spades-11","clubs-11","diamonds-11","spades-6","spades-7","spades-8"].map(card);
  game.attractions.restaurant.slots = ["hearts-8","clubs-1","hearts-9","hearts-10","spades-9","spades-10"].map(card);
  game.attractions.restrooms.slots = [card("hearts-12"), card("hearts-13")];
  game.deck = [];
  game.hands = [[card("clubs-12"), card("clubs-13")], mode === "solo" ? [] : [card("spades-12"), card("spades-13")]];
  if (mode === "solo") game.deck = [card("spades-12"), card("spades-13")];
  game.entrance = [card("diamonds-12"), card("diamonds-13")];
  if (game.night) {
    game.night.unlocked = [...ATTRACTION_IDS];
    game.night.route = [];
    game.night.jackBox = [];
    game.night.jokerUsed = true;
  }
  return game;
}
