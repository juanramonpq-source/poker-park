import {
  ATTRACTION_DEFS,
  emptyAttraction,
  isAttractionComplete,
  legalSlotsForCard,
} from "./attractions";
import { cardName, isFace, makeDeck, shuffle } from "./deck";
import type {
  AttractionId,
  Card,
  DayRating,
  ExchangeTarget,
  GameState,
  Mode,
} from "./types";
import { ATTRACTION_IDS, MAX_EXCHANGES } from "./types";

function clone<T>(value: T): T {
  return structuredClone(value);
}

export function createGame(mode: Mode, names?: [string, string]): GameState {
  const shuffled = shuffle(makeDeck());
  const entrance0 = shuffled.pop()!;
  const entrance1 = shuffled.pop()!;
  const hand0: Card[] = [shuffled.pop()!, shuffled.pop()!, shuffled.pop()!];
  const hand1: Card[] = [shuffled.pop()!, shuffled.pop()!, shuffled.pop()!];

  const attractions = Object.fromEntries(
    ATTRACTION_IDS.map((id) => [id, emptyAttraction(id)]),
  ) as GameState["attractions"];

  const defaultNames: [string, string] =
    mode === "ai" ? ["Tú", "Compañero"] : ["Jugador 1", "Jugador 2"];

  const state: GameState = {
    version: 7,
    mode,
    names: names ?? defaultNames,
    deck: shuffled,
    hands: [hand0, hand1],
    entrance: [entrance0, entrance1],
    entranceFaceDown: [false, false],
    attractions,
    exchangesUsed: 0,
    currentPlayer: 0,
    drawnThisTurn: false,
    consecutivePasses: 0,
    lastMessage: "El parque abre. El sol está alto.",
    lastCompleted: null,
    swappedCardId: null,
    pendingAdvance: false,
    ended: false,
    endReason: null,
  };

  return beginTurn(state);
}

export function beginTurn(state: GameState): GameState {
  if (state.ended) return state;
  const next = clone(state);
  next.lastCompleted = null;
  next.swappedCardId = null;
  if (!next.drawnThisTurn && next.deck.length > 0) {
    const card = next.deck.pop()!;
    next.hands[next.currentPlayer].push(card);
    next.drawnThisTurn = true;
  } else {
    next.drawnThisTurn = true;
  }
  return maybeEnd(next);
}

function removeFromHand(state: GameState, cardId: string): Card {
  const hand = state.hands[state.currentPlayer];
  const index = hand.findIndex((c) => c.id === cardId);
  if (index < 0) throw new Error("Esa carta no está en tu mano");
  const [card] = hand.splice(index, 1);
  return card!;
}

export function remainingCards(state: GameState): Card[] {
  return [...state.hands[0], ...state.hands[1], ...state.deck];
}

export function visitorPhase(state: GameState): boolean {
  const pool = remainingCards(state);
  for (const id of ATTRACTION_IDS) {
    const attr = state.attractions[id];
    if (isAttractionComplete(id, attr.slots)) continue;
    for (const card of pool) {
      if (legalSlotsForCard(id, attr.slots, card).length > 0) return false;
    }
  }
  return ATTRACTION_IDS.some((id) =>
    isAttractionComplete(id, state.attractions[id].slots),
  );
}

export function legalPlacements(
  state: GameState,
  cardId: string,
): { attractionId: AttractionId; index: number }[] {
  const card = state.hands[state.currentPlayer].find((c) => c.id === cardId);
  if (!card || state.ended) return [];
  const out: { attractionId: AttractionId; index: number }[] = [];
  for (const id of ATTRACTION_IDS) {
    for (const index of legalSlotsForCard(id, state.attractions[id].slots, card)) {
      out.push({ attractionId: id, index });
    }
  }
  return out;
}

export function legalVisits(state: GameState, cardId: string): AttractionId[] {
  if (!visitorPhase(state)) return [];
  const card = state.hands[state.currentPlayer].find((c) => c.id === cardId);
  if (!card || !isFace(card) || state.ended) return [];
  return ATTRACTION_IDS.filter((id) =>
    isAttractionComplete(id, state.attractions[id].slots),
  );
}

export function legalExchanges(state: GameState, cardId: string): ExchangeTarget[] {
  if (state.ended || state.exchangesUsed >= MAX_EXCHANGES) return [];
  const card = state.hands[state.currentPlayer].find((c) => c.id === cardId);
  if (!card) return [];
  const targets: ExchangeTarget[] = [];

  state.entrance.forEach((parkCard, raw) => {
    const index = raw as 0 | 1;
    if (state.entranceFaceDown[index]) return;
    if (parkCard.id === card.id) return;
    targets.push({ kind: "entrance", index });
  });

  for (const id of ATTRACTION_IDS) {
    const slots = state.attractions[id].slots;
    if (isAttractionComplete(id, slots)) continue;
    slots.forEach((parkCard, index) => {
      if (!parkCard) return;
      const nextSlots = slots.slice();
      nextSlots[index] = card;
      if (legalSlotsForCard(id, slots.map((c, i) => (i === index ? null : c)), card).includes(index)) {
        targets.push({ kind: "slot", attractionId: id, index });
      }
    });
  }
  return targets;
}

export function hasLegalAction(state: GameState): boolean {
  if (state.ended || state.pendingAdvance) return false;
  const hand = state.hands[state.currentPlayer];
  for (const card of hand) {
    if (legalPlacements(state, card.id).length > 0) return true;
    if (legalVisits(state, card.id).length > 0) return true;
    if (legalExchanges(state, card.id).length > 0) return true;
  }
  return false;
}

export function hasRequiredAction(state: GameState): boolean {
  if (state.ended || state.pendingAdvance) return false;
  const hand = state.hands[state.currentPlayer];
  for (const card of hand) {
    if (legalPlacements(state, card.id).length > 0) return true;
    if (legalExchanges(state, card.id).length > 0) return true;
  }
  return false;
}

export function canVisitAnything(state: GameState): boolean {
  if (state.ended || state.pendingAdvance) return false;
  return state.hands[state.currentPlayer].some(
    (card) => legalVisits(state, card.id).length > 0,
  );
}

export function parkSolved(state: GameState): boolean {
  return ATTRACTION_IDS.every((id) =>
    isAttractionComplete(id, state.attractions[id].slots),
  );
}

export function closePark(state: GameState): GameState {
  const next = clone(state);
  next.ended = true;
  next.pendingAdvance = false;
  next.lastCompleted = null;
  next.endReason = parkSolved(next) ? "empty" : "block";
  next.lastMessage = "Fin de la jornada en el parque";
  return next;
}

function finishAction(prev: GameState, next: GameState, message: string): GameState {
  next.lastMessage = message;
  next.consecutivePasses = 0;
  next.drawnThisTurn = false;
  const justDone = ATTRACTION_IDS.find(
    (id) =>
      isAttractionComplete(id, next.attractions[id].slots) &&
      !isAttractionComplete(id, prev.attractions[id].slots),
  );
  next.lastCompleted = justDone ?? null;
  if (justDone) {
    next.lastMessage = `${ATTRACTION_DEFS[justDone].name}: ¡conseguido!`;
    next.pendingAdvance = true;
    return maybeEnd(next);
  }
  next.pendingAdvance = false;
  const ended = maybeEnd(next);
  if (ended.ended) return ended;
  ended.currentPlayer = ended.currentPlayer === 0 ? 1 : 0;
  return beginTurn(ended);
}

export function advanceTurn(state: GameState): GameState {
  if (state.ended) return state;
  const next = clone(state);
  next.pendingAdvance = false;
  next.lastCompleted = null;
  next.drawnThisTurn = false;
  next.currentPlayer = next.currentPlayer === 0 ? 1 : 0;
  return beginTurn(next);
}

function maybeEnd(state: GameState): GameState {
  const cardsLeft =
    state.deck.length + state.hands[0].length + state.hands[1].length;
  if (cardsLeft === 0) {
    state.ended = true;
    state.endReason = "empty";
    state.lastMessage = "Se acaba el día.";
    return state;
  }
  if (state.consecutivePasses >= 2) {
    state.ended = true;
    state.endReason = "block";
    state.lastMessage = "El parque se queda como está.";
    return state;
  }
  return state;
}

export function placeCard(
  state: GameState,
  cardId: string,
  attractionId: AttractionId,
  index: number,
): GameState {
  if (state.ended) return state;
  const legal = legalPlacements(state, cardId);
  if (!legal.some((p) => p.attractionId === attractionId && p.index === index)) {
    throw new Error("Esa carta no encaja ahí");
  }
  const next = clone(state);
  const card = removeFromHand(next, cardId);
  next.attractions[attractionId].slots[index] = card;
  return finishAction(
    state,
    next,
    `${next.names[state.currentPlayer]} coloca ${cardName(card)} en ${ATTRACTION_DEFS[attractionId].name}.`,
  );
}

export function placeVisitor(
  state: GameState,
  cardId: string,
  attractionId: AttractionId,
): GameState {
  if (state.ended) return state;
  if (!legalVisits(state, cardId).includes(attractionId)) {
    throw new Error("Aún no es hora de visitantes");
  }
  const next = clone(state);
  const card = removeFromHand(next, cardId);
  next.attractions[attractionId].visitors.push(card);
  return finishAction(
    state,
    next,
    `${cardName(card)} se queda en ${ATTRACTION_DEFS[attractionId].name}.`,
  );
}

export function exchangeCard(state: GameState, cardId: string, target: ExchangeTarget): GameState {
  if (state.ended) return state;
  const legal = legalExchanges(state, cardId);
  const ok = legal.some((t) => {
    if (t.kind !== target.kind) return false;
    if (t.kind === "entrance" && target.kind === "entrance") return t.index === target.index;
    if (t.kind === "slot" && target.kind === "slot") {
      return t.attractionId === target.attractionId && t.index === target.index;
    }
    return false;
  });
  if (!ok) throw new Error("Ese intercambio no mantiene la estructura");

  const next = clone(state);
  const hand = next.hands[next.currentPlayer];
  const handIndex = hand.findIndex((c) => c.id === cardId);
  const handCard = hand[handIndex]!;
  let taken: Card;

  if (target.kind === "entrance") {
    taken = next.entrance[target.index];
    next.entrance[target.index] = handCard;
  } else {
    taken = next.attractions[target.attractionId].slots[target.index]!;
    next.attractions[target.attractionId].slots[target.index] = handCard;
  }
  hand[handIndex] = taken;
  next.exchangesUsed += 1;
  next.swappedCardId = taken.id;
  next.consecutivePasses = 0;
  if (next.exchangesUsed >= 2) next.entranceFaceDown[0] = true;
  if (next.exchangesUsed >= 3) next.entranceFaceDown[1] = true;
  const aforo =
    next.exchangesUsed >= 3
      ? " Aforo completo."
      : next.exchangesUsed === 2
        ? " La primera entrada se cierra."
        : "";
  next.lastMessage = `Intercambio ${next.exchangesUsed}/${MAX_EXCHANGES}.${aforo} Coloca la carta nueva.`;
  return next;
}

export function passTurn(state: GameState, force = false): GameState {
  if (state.ended) return state;
  if (!force && hasRequiredAction(state)) {
    throw new Error("Todavía puedes jugar");
  }
  const next = clone(state);
  next.consecutivePasses += 1;
  next.drawnThisTurn = false;
  next.lastMessage = `${next.names[next.currentPlayer]} no puede colocar.`;
  const ended = maybeEnd(next);
  if (ended.ended) return ended;
  ended.currentPlayer = ended.currentPlayer === 0 ? 1 : 0;
  return beginTurn(ended);
}

export function completedAttractions(state: GameState): AttractionId[] {
  return ATTRACTION_IDS.filter((id) =>
    isAttractionComplete(id, state.attractions[id].slots),
  );
}

export function dayRating(count: number): DayRating {
  if (count <= 0) return "empty";
  if (count === 1) return "shy";
  if (count === 2) return "improvised";
  if (count === 3) return "fair";
  if (count === 4) return "fun";
  if (count === 5) return "round";
  if (count === 6) return "unforgettable";
  return "perfect";
}

export const RATING_SCALE: { count: number; rating: DayRating; title: string }[] = [
  { count: 0, rating: "empty", title: "Colas eternas" },
  { count: 1, rating: "shy", title: "Día tímido" },
  { count: 2, rating: "improvised", title: "Día improvisado" },
  { count: 3, rating: "fair", title: "Día de feria" },
  { count: 4, rating: "fun", title: "Día divertido" },
  { count: 5, rating: "round", title: "Día redondo" },
  { count: 6, rating: "unforgettable", title: "Día inolvidable" },
  { count: 7, rating: "perfect", title: "Fuegos sobre el parque" },
];

export function ratingCopy(rating: DayRating): { title: string; body: string } {
  switch (rating) {
    case "empty":
      return {
        title: "Colas eternas",
        body: "Hoy las vueltas se quedaron en la entrada. El parque sigue ahí mañana.",
      };
    case "shy":
      return {
        title: "Día tímido",
        body: "Una sola atracción. A veces basta con atreverse una vez.",
      };
    case "improvised":
      return {
        title: "Día improvisado",
        body: "No siempre da tiempo a todo. Lo importante es haber decidido juntos.",
      };
    case "fair":
      return {
        title: "Día de feria",
        body: "Tres vueltas y el olor a algodón. Ya es un día.",
      };
    case "fun":
      return {
        title: "Día divertido",
        body: "El recuerdo no está en la atracción más alta, sino en la que parecía pequeña.",
      };
    case "round":
      return {
        title: "Día redondo",
        body: "Casi el mapa entero. Os conocéis el parque de memoria.",
      };
    case "unforgettable":
      return {
        title: "Día inolvidable",
        body: "El sol se puso tarde. Algunas vueltas no se olvidan.",
      };
    case "perfect":
      return {
        title: "Fuegos sobre el parque",
        body: "Todas las atracciones. Todas las vueltas. El parque es vuestro.",
      };
  }
}

export interface DayBadge {
  id: string;
  name: string;
  hint: string;
  secret?: boolean;
}

export function dayBadges(state: GameState): DayBadge[] {
  const done = completedAttractions(state);
  const n = done.length;
  const badges: DayBadge[] = [];
  if (n >= 1) badges.push({ id: "ticket", name: "Ticket de entrada", hint: "Al menos una vuelta." });
  if (n >= 2) badges.push({ id: "cotton", name: "Algodón de azúcar", hint: "El día ya huele a feria." });
  if (n >= 3) badges.push({ id: "band", name: "Pulsera de feria", hint: "Tres atracciones, tres recuerdos." });
  if (n >= 4) badges.push({ id: "map", name: "Mapa doblado", hint: "Ya conocéis los recovecos." });
  if (n >= 5) badges.push({ id: "gold", name: "Ticket dorado", hint: "Un día que se cuenta." });
  if (n >= 6) badges.push({ id: "key", name: "Llave de la noria", hint: "Casi el parque entero." });
  if (n >= 7) badges.push({ id: "crown", name: "Dueños del parque", hint: "Todas las vueltas. Todas." });

  if (done.includes("coaster"))
    badges.push({ id: "coaster", name: "Grito en la cima", hint: "La montaña rusa, entera.", secret: true });
  if (done.includes("love"))
    badges.push({ id: "love", name: "Cumbre del corazón", hint: "El arco se cerró.", secret: true });
  if (done.includes("haunted"))
    badges.push({ id: "boo", name: "Susto de feria", hint: "Salisteis riendo.", secret: true });
  if (done.includes("chairs"))
    badges.push({ id: "chairs", name: "Vuelo corto", hint: "La torre aguantó.", secret: true });
  if (done.includes("forest") && done.includes("love") && done.includes("chairs"))
    badges.push({ id: "date", name: "Cita en el parque", hint: "Amor, vuelo y bosque.", secret: true });

  const visitors = ATTRACTION_IDS.reduce(
    (sum, id) => sum + state.attractions[id].visitors.length,
    0,
  );
  if (visitors > 0)
    badges.push({ id: "stay", name: "Una más", hint: "Alguien se quedó cuando cerraba.", secret: true });
  if (state.exchangesUsed === 0 && n >= 3)
    badges.push({ id: "flow", name: "Sin colas", hint: "Ni un solo intercambio.", secret: true });
  if (state.exchangesUsed >= 3 && n >= 4)
    badges.push({ id: "aforo", name: "Maestros del aforo", hint: "Los tres cambios, bien gastados.", secret: true });
  if (n === 0)
    badges.push({ id: "rain", name: "Entrada mojada", hint: "El parque sigue ahí mañana.", secret: true });
  return badges;
}

export function attractionAccepts(
  state: GameState,
  attractionId: AttractionId,
  cardId: string,
): boolean {
  return (
    legalPlacements(state, cardId).some((p) => p.attractionId === attractionId) ||
    legalVisits(state, cardId).includes(attractionId)
  );
}
