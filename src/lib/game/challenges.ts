import type { AttractionId, GameChallenge, GameState } from "./types";

export const MASTER_CHALLENGES: GameChallenge[] = ["festival", "mirror", "storm"];

export const CHALLENGE_NAMES: Record<GameChallenge, string> = {
  classic: "Jornada de día",
  night: "La Noche de Guardia",
  festival: "Festival de las Luces",
  mirror: "Parque Espejo",
  storm: "Día de Tormenta",
  impossible: "Poker Park 00:13",
};

export const CHALLENGE_BACKGROUNDS: Record<GameChallenge, string> = {
  classic: "/images/park-cover.webp",
  night: "/images/poker-park-night-wallpaper.webp",
  festival: "/images/park-festival.webp",
  mirror: "/images/park-mirror.webp",
  storm: "/images/park-storm.webp",
  impossible: "/images/park-impossible.webp",
};

export function hasFestivalRules(state: GameState) {
  return state.challenge === "festival" || state.challenge === "impossible";
}

export function hasMirrorRules(state: GameState) {
  return state.challenge === "mirror" || state.challenge === "impossible";
}

export function hasStormRules(state: GameState) {
  return state.challenge === "storm" || state.challenge === "impossible";
}

export function stormClosedAttraction(state: GameState): AttractionId | null {
  if (!hasStormRules(state) || !state.storm?.forecast.length) return null;
  return state.storm.forecast[state.storm.index % state.storm.forecast.length] ?? null;
}

export function nextStormAttraction(state: GameState): AttractionId | null {
  if (!hasStormRules(state) || !state.storm?.forecast.length) return null;
  return state.storm.forecast[(state.storm.index + 1) % state.storm.forecast.length] ?? null;
}

export function recordFestivalPlacement(state: GameState, attractionId: AttractionId) {
  if (!hasFestivalRules(state) || !state.festival) return;
  const alternated = state.festival.lastAttractionId !== attractionId;
  state.festival.combo = alternated ? state.festival.combo + 1 : 1;
  state.festival.bestCombo = Math.max(state.festival.bestCombo, state.festival.combo);
  state.festival.bulbs += state.festival.combo;
  state.festival.lastAttractionId = attractionId;
}

export function advanceStorm(state: GameState) {
  if (!hasStormRules(state) || !state.storm) return;
  state.storm.index = (state.storm.index + 1) % state.storm.forecast.length;
}

export function challengeClass(challenge: GameChallenge | undefined) {
  return `challenge-${challenge ?? "classic"}`;
}
