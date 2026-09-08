import { create } from "zustand";
import { chooseAiMove } from "@/lib/game/ai";
import * as audio from "@/lib/game/audio";
import {
  attractionAccepts,
  advanceTurn,
  closePark,
  completedAttractions,
  createGame,
  exchangeCard,
  hasLegalAction,
  hasRequiredAction,
  parkSolved,
  legalExchanges,
  legalPlacements,
  legalVisits,
  passTurn,
  placeCard,
  placeVisitor,
} from "@/lib/game/engine";
import { clearGame, loadGame, loadSettings, saveGame, saveSettings } from "@/lib/game/persist";
import type { AttractionId, Card, ExchangeTarget, GameState, Mode, Screen } from "@/lib/game/types";

export type FxKind = "place" | "complete" | "exchange" | "end" | "deal";
export type FxEvent = { n: number; kind: FxKind; attractionId: AttractionId | null };
export type AiMoveFx = {
  n: number;
  card: Card;
  attractionId: AttractionId;
  index: number | null;
  kind: "place" | "visit";
};

interface GameStore {
  screen: Screen;
  game: GameState | null;
  selectedCardId: string | null;
  exchangeMode: boolean;
  openAttraction: AttractionId | null;
  rulesOpen: boolean;
  muted: boolean;
  aiThinking: boolean;
  fx: FxEvent | null;
  bloomId: AttractionId | null;
  swapFx: { n: number; incoming: Card; outgoing: Card } | null;
  aiMoveFx: AiMoveFx | null;
  visitorPromptHidden: boolean;
  hydrate: () => void;
  start: (mode: Mode) => void;
  resume: () => void;
  goTitle: () => void;
  quitToTitle: () => void;
  selectCard: (id: string | null) => void;
  toggleExchange: () => void;
  openPark: (id: AttractionId | null) => void;
  place: (attractionId: AttractionId, index: number) => void;
  visit: (attractionId: AttractionId) => void;
  exchange: (target: ExchangeTarget) => void;
  pass: () => void;
  closePark: () => void;
  hideVisitorPrompt: () => void;
  continueAfterPass: () => void;
  toggleMute: () => void;
  setRulesOpen: (open: boolean) => void;
  pulse: (kind: FxKind, attractionId?: AttractionId | null) => void;
}

let aiTimer = 0;
let aiRevealTimer = 0;
let aiRevealClearTimer = 0;
let bloomTimer = 0;
let advanceTimer = 0;
let fxN = 0;
const CELEBRATE_MS = 3200;

function persist(game: GameState | null) {
  saveGame(game);
}

function juice(
  prev: GameState | null,
  next: GameState,
  pulse: GameStore["pulse"],
  attractionId: AttractionId | null = null,
) {
  if (next.lastCompleted && next.lastCompleted !== prev?.lastCompleted) {
    audio.playComplete(next.lastCompleted);
    audio.tapHaptic("complete");
    pulse("complete", next.lastCompleted);
  } else if (next.exchangesUsed > (prev?.exchangesUsed ?? 0)) {
    audio.playExchange();
    audio.tapHaptic("exchange");
    if (next.exchangesUsed >= 2) audio.playAforo();
    pulse("exchange");
  } else if (next.ended && !prev?.ended) {
    audio.playEnd();
    pulse("end");
  } else {
    audio.playPlace();
    audio.tapHaptic("place");
    pulse("place", attractionId);
  }
}

export const useGameStore = create<GameStore>((set, get) => {
  const pulse: GameStore["pulse"] = (kind, attractionId = null) => {
    fxN += 1;
    set({ fx: { n: fxN, kind, attractionId } });
    if (kind === "complete" && attractionId) {
      window.clearTimeout(bloomTimer);
      set({ bloomId: attractionId });
      bloomTimer = window.setTimeout(() => set({ bloomId: null }), CELEBRATE_MS);
    }
  };

  const afterHuman = (next: GameState, fromHuman = true) => {
    persist(next);
    if (next.pendingAdvance && next.lastCompleted) {
      set({
        game: next,
        selectedCardId: null,
        exchangeMode: false,
        aiThinking: false,
        visitorPromptHidden: false,
      });
      window.clearTimeout(advanceTimer);
      advanceTimer = window.setTimeout(() => {
        const current = get().game;
        if (!current) return;
        if (current.ended) {
          set({
            game: current,
            screen: "end",
            selectedCardId: null,
            exchangeMode: false,
            openAttraction: null,
            aiThinking: false,
            visitorPromptHidden: false,
          });
          return;
        }
        afterHuman(advanceTurn(current), fromHuman);
      }, CELEBRATE_MS);
      return;
    }
    if (next.ended) {
      set({
        game: next,
        screen: "end",
        selectedCardId: null,
        exchangeMode: false,
        openAttraction: null,
        aiThinking: false,
        visitorPromptHidden: false,
      });
      return;
    }
    if (fromHuman && next.mode === "hotseat") {
      audio.playPass();
      set({
        game: next,
        screen: "pass",
        selectedCardId: null,
        exchangeMode: false,
        openAttraction: null,
        visitorPromptHidden: false,
      });
      return;
    }
    set({
      game: next,
      selectedCardId: null,
      exchangeMode: false,
      openAttraction: fromHuman ? null : get().openAttraction,
      aiThinking: false,
      visitorPromptHidden: false,
    });
    if (next.currentPlayer === 1 && next.mode === "ai") {
      queueAi();
    }
  };

  const queueAi = () => {
    window.clearTimeout(aiTimer);
    set({ aiThinking: true });
    aiTimer = window.setTimeout(() => {
      const current = get().game;
      if (!current || current.ended || current.currentPlayer !== 1) {
        set({ aiThinking: false });
        return;
      }
      const move = chooseAiMove(current);
      let next = current;
      let outgoing: Card | undefined;
      const playedCard =
        move.type === "place" || move.type === "visit"
          ? current.hands[current.currentPlayer].find((card) => card.id === move.cardId)
          : undefined;
      try {
        if (move.type === "place") next = placeCard(current, move.cardId, move.attractionId, move.index);
        else if (move.type === "visit") next = placeVisitor(current, move.cardId, move.attractionId);
        else if (move.type === "exchange") {
          outgoing = current.hands[current.currentPlayer].find((c) => c.id === move.cardId);
          next = exchangeCard(current, move.cardId, move.target);
        } else if (move.type === "close") next = closePark(current);
        else next = passTurn(current);
      } catch {
        next = passTurn(current, true);
      }
      if ((move.type === "place" || move.type === "visit") && playedCard) {
        const reveal: AiMoveFx = {
          n: Date.now(),
          card: playedCard,
          attractionId: move.attractionId,
          index: move.type === "place" ? move.index : null,
          kind: move.type,
        };
        persist(next);
        window.clearTimeout(aiRevealTimer);
        window.clearTimeout(aiRevealClearTimer);
        set({ aiMoveFx: reveal, aiThinking: true, openAttraction: null });
        aiRevealTimer = window.setTimeout(() => {
          if (get().aiMoveFx?.n !== reveal.n) return;
          juice(current, next, get().pulse, move.attractionId);
          afterHuman(next, false);
        }, 680);
        aiRevealClearTimer = window.setTimeout(() => {
          if (get().aiMoveFx?.n === reveal.n) set({ aiMoveFx: null });
        }, 1650);
        return;
      }
      juice(current, next, get().pulse, null);
      const incoming = next.swappedCardId
        ? next.hands[next.currentPlayer].find((c) => c.id === next.swappedCardId)
        : undefined;
      if (move.type === "exchange" && outgoing && incoming) {
        set({ swapFx: { n: Date.now(), incoming, outgoing } });
        window.setTimeout(() => {
          if (get().swapFx?.n) set({ swapFx: null });
        }, 780);
      }
      afterHuman(next, false);
    }, 720);
  };

  return {
    screen: "title",
    game: null,
    selectedCardId: null,
    exchangeMode: false,
    openAttraction: null,
    rulesOpen: false,
    muted: false,
    aiThinking: false,
    fx: null,
    bloomId: null,
    swapFx: null,
    aiMoveFx: null,
    visitorPromptHidden: false,
    pulse,
    hydrate: () => {
      const settings = loadSettings();
      audio.setMuted(settings.muted);
      const saved = loadGame();
      set((s) => ({
        muted: settings.muted,
        game: s.screen === "title" ? saved : s.game ?? saved,
      }));
    },
    start: (mode) => {
      window.clearTimeout(aiRevealTimer);
      window.clearTimeout(aiRevealClearTimer);
      audio.unlockAudio();
      audio.startParkBed();
      audio.playStart();
      audio.playDeal();
      window.setTimeout(() => audio.playDeal(), 70);
      window.setTimeout(() => audio.playDeal(), 140);
      const game = createGame(mode);
      persist(game);
      pulse("deal");
      set({
        game,
        screen: "playing",
        selectedCardId: null,
        exchangeMode: false,
        openAttraction: null,
        aiThinking: false,
        aiMoveFx: null,
        visitorPromptHidden: false,
      });
    },
    resume: () => {
      const saved = get().game ?? loadGame();
      if (!saved) return;
      audio.unlockAudio();
      audio.startParkBed();
      set({
        game: saved,
        screen: saved.ended ? "end" : "playing",
        openAttraction: null,
      });
      if (saved.mode === "ai" && saved.currentPlayer === 1 && !saved.ended) queueAi();
    },
    goTitle: () => {
      window.clearTimeout(aiTimer);
      window.clearTimeout(aiRevealTimer);
      window.clearTimeout(aiRevealClearTimer);
      audio.startTitleBed();
      set({
        screen: "title",
        aiThinking: false,
        aiMoveFx: null,
        selectedCardId: null,
        exchangeMode: false,
        openAttraction: null,
      });
    },
    quitToTitle: () => {
      window.clearTimeout(aiTimer);
      window.clearTimeout(aiRevealTimer);
      window.clearTimeout(aiRevealClearTimer);
      clearGame();
      audio.startTitleBed();
      set({
        screen: "title",
        game: null,
        selectedCardId: null,
        exchangeMode: false,
        openAttraction: null,
        aiThinking: false,
        aiMoveFx: null,
      });
    },
    selectCard: (id) => {
      const { selectedCardId } = get();
      const next = selectedCardId === id ? null : id;
      if (next) {
        audio.playSelect();
        audio.tapHaptic("select");
      }
      set({ selectedCardId: next });
    },
    toggleExchange: () => {
      const { game } = get();
      if (!game || game.exchangesUsed >= 3) return;
      audio.playUi();
      set({ exchangeMode: !get().exchangeMode, selectedCardId: null });
    },
    openPark: (id) => {
      audio.playUi();
      set({ openAttraction: id });
    },
    place: (attractionId, index) => {
      const { game, selectedCardId, exchangeMode } = get();
      if (!game || !selectedCardId || exchangeMode || get().aiThinking || game.pendingAdvance) return;
      try {
        const next = placeCard(game, selectedCardId, attractionId, index);
        juice(game, next, get().pulse, attractionId);
        afterHuman(next);
      } catch {
        /* illegal */
      }
    },
    visit: (attractionId) => {
      const { game, selectedCardId } = get();
      if (!game || !selectedCardId || get().aiThinking) return;
      try {
        const next = placeVisitor(game, selectedCardId, attractionId);
        juice(game, next, get().pulse, attractionId);
        afterHuman(next);
      } catch {
        /* illegal */
      }
    },
    exchange: (target) => {
      const { game, selectedCardId, exchangeMode } = get();
      if (!game || !selectedCardId || !exchangeMode || get().aiThinking) return;
      try {
        const outgoing = game.hands[game.currentPlayer].find((c) => c.id === selectedCardId);
        const next = exchangeCard(game, selectedCardId, target);
        juice(game, next, get().pulse);
        persist(next);
        if (next.ended) {
          afterHuman(next);
          return;
        }
        const incoming = next.hands[next.currentPlayer].find((c) => c.id === next.swappedCardId) ?? null;
        set({
          game: next,
          selectedCardId: next.swappedCardId,
          exchangeMode: false,
          swapFx:
            outgoing && incoming
              ? { n: Date.now(), incoming, outgoing }
              : null,
        });
        window.setTimeout(() => {
          if (get().swapFx?.n) set({ swapFx: null });
        }, 780);
      } catch {
        /* illegal */
      }
    },
    pass: () => {
      const { game } = get();
      if (!game || get().aiThinking) return;
      if (hasRequiredAction(game)) return;
      const next = passTurn(game);
      afterHuman(next);
    },
    closePark: () => {
      const { game } = get();
      if (!game || get().aiThinking) return;
      if (hasRequiredAction(game)) return;
      const next = closePark(game);
      juice(game, next, get().pulse);
      afterHuman(next);
    },
    hideVisitorPrompt: () => {
      audio.playUi();
      set({ visitorPromptHidden: true });
    },
    continueAfterPass: () => {
      audio.playUi();
      set({ screen: "playing", selectedCardId: null, openAttraction: null });
    },
    toggleMute: () => {
      const muted = !get().muted;
      audio.setMuted(muted);
      saveSettings({ version: 1, muted });
      set({ muted });
      if (!muted) audio.playUi();
    },
    setRulesOpen: (open) => {
      audio.unlockAudio();
      audio.startTitleBed();
      if (open) audio.playUi();
      set({ rulesOpen: open });
    },
  };
});

export function useLegalForSelected() {
  const game = useGameStore((s) => s.game);
  const selectedCardId = useGameStore((s) => s.selectedCardId);
  const exchangeMode = useGameStore((s) => s.exchangeMode);
  if (!game || !selectedCardId) {
    return { places: [], visits: [] as AttractionId[], exchanges: [] as ExchangeTarget[] };
  }
  return {
    places: exchangeMode ? [] : legalPlacements(game, selectedCardId),
    visits: exchangeMode ? [] : legalVisits(game, selectedCardId),
    exchanges: exchangeMode ? legalExchanges(game, selectedCardId) : [],
  };
}

export function attractionIsHot(
  game: GameState,
  attractionId: AttractionId,
  cardId: string | null,
  exchangeMode: boolean,
) {
  if (!cardId) return false;
  if (exchangeMode) {
    return legalExchanges(game, cardId).some(
      (t) => t.kind === "slot" && t.attractionId === attractionId,
    );
  }
  return attractionAccepts(game, attractionId, cardId);
}

export { completedAttractions };
