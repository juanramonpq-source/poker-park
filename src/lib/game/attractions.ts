import { isAce, isFace, rankLabel } from "./deck.ts";
import type { AttractionId, AttractionState, Card, Rank } from "./types.ts";

export interface AttractionDef {
  id: AttractionId;
  name: string;
  tagline: string;
  rules: string;
  slotCount: number;
}

export const ATTRACTION_DEFS: Record<AttractionId, AttractionDef> = {
  coaster: {
    id: "coaster",
    name: "Montaña Rusa",
    tagline: "Sube, looping y baja · 2–9 o 3–10",
    rules: "Rellena la vía en orden, de menor a mayor y sin saltos. Empieza con un 2 o un 3. Solo números: las figuras no suben.",
    slotCount: 8,
  },
  haunted: {
    id: "haunted",
    name: "Casa del Terror",
    tagline: "4 picas de número y el as de picas",
    rules: "Cuatro picas de número forman la casa. Cuando estén las cuatro, el tejado se completa con el as de picas (A♠).",
    slotCount: 5,
  },
  love: {
    id: "love",
    name: "Túnel del Amor",
    tagline: "Arco de 7 corazones, sin figuras · as en la cumbre",
    rules: "Siete corazones de número. Empieza por un extremo, sube, coloca el as de corazones (A♥) en la cumbre y baja por el otro lado.",
    slotCount: 7,
  },
  forest: {
    id: "forest",
    name: "Bosque Encantado",
    tagline: "3×3 y dos columnas de diamantes a la entrada",
    rules: "El claro es un 3×3 de tréboles y diamantes de número, con el as de diamantes (A♦) al centro. Debajo, dos columnas de diamantes marcan la entrada.",
    slotCount: 11,
  },
  chairs: {
    id: "chairs",
    name: "Sillas Voladoras",
    tagline: "Primero la torre de 3 picas, luego 4 figuras",
    rules: "Primero la torre de tres picas de número. Cuando esté lista, cuelgan cuatro figuras (J, Q o K) en las sillas.",
    slotCount: 7,
  },
  restaurant: {
    id: "restaurant",
    name: "Restaurante",
    tagline: "Números y el as de tréboles al centro",
    rules: "Seis cartas de número en 2×3. El as de tréboles (A♣) ocupa el hueco central. Las figuras no comen aquí.",
    slotCount: 6,
  },
  restrooms: {
    id: "restrooms",
    name: "Aseos",
    tagline: "Un rey y una reina",
    rules: "Un rey y una reina juntos, de cualquier palo. Las jotas no entran.",
    slotCount: 2,
  },
};

export function emptyAttraction(id: AttractionId): AttractionState {
  return {
    slots: Array.from({ length: ATTRACTION_DEFS[id].slotCount }, () => null),
    visitors: [],
  };
}

const LOVE_LTR = [0, 1, 2, 3, 4, 5, 6] as const;
const LOVE_RTL = [6, 5, 4, 3, 2, 1, 0] as const;

function isPrefixFill(slots: (Card | null)[], path: readonly number[]): boolean {
  let empty = false;
  for (const index of path) {
    if (!slots[index]) empty = true;
    else if (empty) return false;
  }
  return true;
}

function loveDir(slots: (Card | null)[]): "ltr" | "rtl" | null {
  if (slots.every((c) => !c)) return null;
  const ltr = isPrefixFill(slots, LOVE_LTR);
  const rtl = isPrefixFill(slots, LOVE_RTL);
  if (ltr && !rtl) return "ltr";
  if (rtl && !ltr) return "rtl";
  if (ltr && rtl) return slots[0] ? "ltr" : "rtl";
  return null;
}

function slotAllowsFace(id: AttractionId, index: number): boolean {
  return (id === "chairs" && index < 4) || id === "restrooms";
}

export function isAttractionValid(id: AttractionId, slots: (Card | null)[]): boolean {
  for (let i = 0; i < slots.length; i++) {
    const card = slots[i];
    if (card && isFace(card) && !slotAllowsFace(id, i)) return false;
  }
  switch (id) {
    case "coaster": {
      let empty = false;
      for (let i = 0; i < 8; i++) {
        const card = slots[i];
        if (!card) {
          empty = true;
          continue;
        }
        if (empty) return false;
        if (card.rank < 2 || card.rank > 10) return false;
        if (i === 0 && card.rank !== 2 && card.rank !== 3) return false;
        if (i > 0) {
          const prev = slots[i - 1];
          if (!prev || card.rank !== prev.rank + 1) return false;
        }
      }
      return true;
    }
    case "haunted": {
      for (let i = 0; i < 4; i++) {
        const card = slots[i];
        if (!card) continue;
        if (card.suit !== "spades" || isAce(card)) return false;
      }
      const roof = slots[4];
      if (roof) {
        if (roof.suit !== "spades" || !isAce(roof)) return false;
        if (!slots.slice(0, 4).every(Boolean)) return false;
      }
      return true;
    }
    case "love": {
      for (let i = 0; i < 7; i++) {
        const card = slots[i];
        if (!card) continue;
        if (card.suit !== "hearts") return false;
        if (i === 3) {
          if (!isAce(card)) return false;
        } else if (isAce(card)) {
          return false;
        }
      }
      if (slots.every((c) => !c)) return true;
      return loveDir(slots) !== null;
    }
    case "forest": {
      for (let i = 0; i < slots.length; i++) {
        const card = slots[i];
        if (!card) continue;
        if (i === 4) {
          if (!(card.suit === "diamonds" && isAce(card))) return false;
          continue;
        }
        if (isAce(card) || isFace(card)) return false;
        if (i === 9 || i === 10) {
          if (card.suit !== "diamonds") return false;
          continue;
        }
        if (card.suit !== "clubs" && card.suit !== "diamonds") return false;
      }
      return true;
    }
    case "chairs": {
      const towerReady = Boolean(slots[4] && slots[5] && slots[6]);
      for (let i = 0; i < 4; i++) {
        const card = slots[i];
        if (!card) continue;
        if (!isFace(card) || !towerReady) return false;
      }
      for (let i = 4; i < 7; i++) {
        const card = slots[i];
        if (card && (card.suit !== "spades" || isAce(card) || isFace(card))) return false;
      }
      return true;
    }
    case "restaurant": {
      for (let i = 0; i < 6; i++) {
        const card = slots[i];
        if (!card) continue;
        if (i === 1) {
          if (!(card.suit === "clubs" && isAce(card))) return false;
        } else if (isAce(card)) {
          return false;
        }
      }
      return true;
    }
    case "restrooms": {
      const filled = slots.filter((c): c is Card => c !== null);
      if (filled.some((c) => c.rank !== 12 && c.rank !== 13)) return false;
      const queens = filled.filter((c) => c.rank === 12).length;
      const kings = filled.filter((c) => c.rank === 13).length;
      return queens <= 1 && kings <= 1;
    }
  }
}

export function legalSlotsForCard(
  id: AttractionId,
  slots: (Card | null)[],
  card: Card,
): number[] {
  const legal: number[] = [];
  for (let i = 0; i < slots.length; i++) {
    if (slots[i]) continue;
    const next = slots.slice();
    next[i] = card;
    if (isAttractionValid(id, next)) legal.push(i);
  }
  return legal;
}

export function isAttractionComplete(id: AttractionId, slots: (Card | null)[]): boolean {
  return slots.every(Boolean) && isAttractionValid(id, slots);
}

export function filledCount(slots: (Card | null)[]): number {
  return slots.filter(Boolean).length;
}

export function attractionProgress(id: AttractionId, slots: (Card | null)[]): string {
  return `${filledCount(slots)}/${ATTRACTION_DEFS[id].slotCount}`;
}

export const SLOT_MARK: Partial<Record<AttractionId, Record<number, string>>> = {
  haunted: { 4: "A♠" },
  love: { 3: "A♥" },
  forest: { 4: "A♦", 9: "♦", 10: "♦" },
  restaurant: { 1: "A♣" },
  restrooms: { 0: "K/Q", 1: "K/Q" },
};

const STATIC_HINT = SLOT_MARK;

export function slotHint(
  id: AttractionId,
  slots: (Card | null)[],
  index: number,
): string | undefined {
  if (id === "coaster") {
    const next = slots.findIndex((c) => !c);
    if (next !== index) return undefined;
    if (index === 0) return "2 o 3";
    const prev = slots[index - 1];
    if (!prev) return undefined;
    return rankLabel((prev.rank + 1) as Rank);
  }
  if (id === "love") {
    if (slots.every((c) => !c)) {
      if (index === 0 || index === 6) return "Inicio";
      if (index === 3) return "A♥";
      return undefined;
    }
    const dir = loveDir(slots);
    if (!dir) {
      if (index === 3) return "A♥";
      return undefined;
    }
    const path = dir === "ltr" ? LOVE_LTR : LOVE_RTL;
    const next = path.find((i) => !slots[i]);
    if (next !== index) return index === 3 ? "A♥" : undefined;
    if (index === 3) return "A♥";
    const pos = path.indexOf(index);
    return pos < 3 ? "Subida" : "Bajada";
  }
  if (id === "chairs") {
    const towerReady = Boolean(slots[4] && slots[5] && slots[6]);
    if (index < 4) return towerReady ? "Fig" : undefined;
    return "Picas";
  }
  return STATIC_HINT[id]?.[index];
}
