import { create } from "zustand";
import { chooseAiMove } from "@/lib/game/ai";
import * as audio from "@/lib/game/audio";
import {
  attractionAccepts,
  advanceTurn,
  closePark,
  completedAttractions,
  createGame,
  exchangeLimit,
  exchangeCard,
  hasRequiredAction,
  legalExchanges,
  legalPlacements,
  legalVisits,
  nightEmergencyAvailable,
  passTurn,
  placeCard,
  placeVisitor,
  prepareNightUnlock,
  unlockNightAttraction,
} from "@/lib/game/engine";
import {
  clearGame,
  loadGame,
  loadSecrets,
  loadSettings,
  saveGame,
  saveSettings,
  unlockSecret,
} from "@/lib/game/persist";
import type {
  AttractionId,
  Card,
  ExchangeTarget,
  GameChallenge,
  GameDifficulty,
  GameState,
  Mode,
  Screen,
} from "@/lib/game/types";
import type { Settings } from "@/lib/game/persist";

export type FxKind = "place" | "complete" | "exchange" | "end" | "deal";
export type FxEvent = { n: number; kind: FxKind; attractionId: AttractionId | null };
export type AiMoveFx = {
  n: number;
  card: Card;
  attractionId: AttractionId;
  index: number | null;
  kind: "place" | "visit";
  player?: 0 | 1;
};

interface GameStore {
  screen: Screen;
  game: GameState | null;
  selectedCardId: string | null;
  exchangeMode: boolean;
  openAttraction: AttractionId | null;
  rulesOpen: boolean;
  muted: boolean;
  nightTheme: boolean;
  machineRoomUnlocked: boolean;
  showcaseTheme: GameChallenge;
  cardBack: Settings["cardBack"];
  aiThinking: boolean;
  fx: FxEvent | null;
  bloomId: AttractionId | null;
  swapFx: { n: number; incoming: Card; outgoing: Card } | null;
  aiMoveFx: AiMoveFx | null;
  visitorPromptHidden: boolean;
  mapIntroOpen: boolean;
  mapOutroOpen: boolean;
  nightEmergencyDeferred: boolean;
  onlineLocalPlayer: 0 | 1 | null;
  onlineConnected: boolean;
  hydrate: () => void;
  start: (
    mode: Mode,
    challenge?: GameChallenge,
    difficulty?: GameDifficulty,
    names?: [string, string],
  ) => void;
  setOnlineLocalPlayer: (player: 0 | 1 | null) => void;
  setOnlineConnected: (connected: boolean) => void;
  syncOnlineGame: (game: GameState, move?: AiMoveFx | null) => void;
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
  dismissMapIntro: () => void;
  finishMapOutro: () => void;
  continueAfterPass: () => void;
  toggleMute: () => void;
  toggleNightTheme: () => void;
  setShowcaseTheme: (theme: GameChallenge) => void;
  setCardBack: (cardBack: Settings["cardBack"]) => void;
  unlockMachineRoom: () => void;
  unlockNightSector: (id: AttractionId) => void;
  deferNightEmergency: () => void;
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
  const canAct = () => {
    const { game, onlineLocalPlayer } = get();
    return (
      !game ||
      game.mode !== "online" ||
      (get().onlineConnected && onlineLocalPlayer === game.currentPlayer)
    );
  };
  const pulse: GameStore["pulse"] = (kind, attractionId = null) => {
    fxN += 1;
    set({ fx: { n: fxN, kind, attractionId } });
    if (kind === "complete" && attractionId) {
      window.clearTimeout(bloomTimer);
      set({ bloomId: attractionId });
      bloomTimer = window.setTimeout(() => set({ bloomId: null }), CELEBRATE_MS);
    }
  };

  const beginMapOutro = (game: GameState) => {
    if (get().mapOutroOpen) return;
    audio.playMapFold();
    set({
      game,
      screen: "playing",
      selectedCardId: null,
      exchangeMode: false,
      openAttraction: null,
      aiThinking: false,
      visitorPromptHidden: false,
      mapIntroOpen: false,
      mapOutroOpen: true,
      nightEmergencyDeferred: false,
    });
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
        nightEmergencyDeferred: false,
      });
      window.clearTimeout(advanceTimer);
      advanceTimer = window.setTimeout(() => {
        const current = get().game;
        if (!current) return;
        if (current.ended) {
          beginMapOutro(current);
          return;
        }
        if (current.night?.pendingUnlock) {
          const waiting = prepareNightUnlock(current);
          persist(waiting);
          set({ game: waiting, aiThinking: false, openAttraction: null });
          return;
        }
        afterHuman(advanceTurn(current), fromHuman);
      }, CELEBRATE_MS);
      return;
    }
    if (next.ended) {
      beginMapOutro(next);
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
      nightEmergencyDeferred: false,
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
      const aiCanExchange = current.hands[current.currentPlayer].some(
        (card) => legalExchanges(current, card.id).length > 0,
      );
      if (nightEmergencyAvailable(current) && !aiCanExchange) {
        set({ aiThinking: false, openAttraction: null });
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
        if (move.type === "place")
          next = placeCard(current, move.cardId, move.attractionId, move.index);
        else if (move.type === "visit")
          next = placeVisitor(current, move.cardId, move.attractionId);
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
          player: 1,
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
    nightTheme: false,
    machineRoomUnlocked: false,
    showcaseTheme: "classic",
    cardBack: "classic",
    aiThinking: false,
    fx: null,
    bloomId: null,
    swapFx: null,
    aiMoveFx: null,
    visitorPromptHidden: false,
    mapIntroOpen: false,
    mapOutroOpen: false,
    nightEmergencyDeferred: false,
    onlineLocalPlayer: null,
    onlineConnected: false,
    pulse,
    hydrate: () => {
      const settings = loadSettings();
      const secrets = loadSecrets();
      audio.setMuted(settings.muted);
      const saved = loadGame();
      set((s) => ({
        muted: settings.muted,
        nightTheme: settings.nightTheme,
        machineRoomUnlocked: secrets.pentonuiSignal,
        showcaseTheme: settings.showcaseTheme,
        cardBack: settings.cardBack,
        game: s.screen === "title" ? saved : (s.game ?? saved),
      }));
    },
    start: (mode, challenge = "classic", difficulty = "standard", names) => {
      window.clearTimeout(aiRevealTimer);
      window.clearTimeout(aiRevealClearTimer);
      audio.unlockAudio();
      audio.startChallengeBed(challenge);
      audio.playStart();
      audio.playMapUnfold();
      audio.playDeal();
      window.setTimeout(() => audio.playDeal(), 70);
      window.setTimeout(() => audio.playDeal(), 140);
      const game = createGame(mode, names, challenge, difficulty);
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
        mapIntroOpen: true,
        mapOutroOpen: false,
        nightEmergencyDeferred: false,
      });
    },
    setOnlineLocalPlayer: (onlineLocalPlayer) => set({ onlineLocalPlayer }),
    setOnlineConnected: (onlineConnected) => set({ onlineConnected }),
    syncOnlineGame: (game, move = null) => {
      const previous = get().game;
      persist(game);
      audio.unlockAudio();
      audio.startChallengeBed(game.challenge ?? "classic");
      if (move) {
        set({ aiMoveFx: move, aiThinking: true });
        window.setTimeout(() => {
          if (get().aiMoveFx?.n !== move.n) return;
          juice(previous, game, get().pulse, move.attractionId);
          if (game.ended) {
            beginMapOutro(game);
            return;
          }
          set({
            game,
            screen: "playing",
            selectedCardId: null,
            exchangeMode: false,
            openAttraction: null,
            aiThinking: false,
          });
        }, 680);
        window.setTimeout(() => {
          if (get().aiMoveFx?.n === move.n) set({ aiMoveFx: null });
        }, 1650);
        return;
      }
      if (game.ended && !previous?.ended) {
        beginMapOutro(game);
        return;
      }
      set({
        game,
        screen: game.ended ? "end" : "playing",
        selectedCardId: null,
        exchangeMode: false,
        openAttraction: null,
        aiThinking: false,
        aiMoveFx: null,
        mapIntroOpen: previous?.mode === "online" ? get().mapIntroOpen : true,
        mapOutroOpen: false,
      });
    },
    resume: () => {
      const saved = get().game ?? loadGame();
      if (!saved) return;
      audio.unlockAudio();
      audio.startChallengeBed(saved.challenge ?? "classic");
      set({
        game: saved,
        screen: saved.ended ? "end" : "playing",
        openAttraction: null,
        mapIntroOpen: false,
        mapOutroOpen: false,
        nightEmergencyDeferred: false,
      });
      if (saved.mode === "ai" && saved.currentPlayer === 1 && !saved.ended) queueAi();
    },
    goTitle: () => {
      window.clearTimeout(aiTimer);
      window.clearTimeout(aiRevealTimer);
      window.clearTimeout(aiRevealClearTimer);
      const theme = loadSettings().showcaseTheme;
      if (theme === "classic") audio.startTitleBed();
      else audio.startChallengeBed(theme);
      set({
        screen: "title",
        aiThinking: false,
        aiMoveFx: null,
        selectedCardId: null,
        exchangeMode: false,
        openAttraction: null,
        mapIntroOpen: false,
        mapOutroOpen: false,
        nightEmergencyDeferred: false,
      });
    },
    quitToTitle: () => {
      window.clearTimeout(aiTimer);
      window.clearTimeout(aiRevealTimer);
      window.clearTimeout(aiRevealClearTimer);
      clearGame();
      const theme = loadSettings().showcaseTheme;
      if (theme === "classic") audio.startTitleBed();
      else audio.startChallengeBed(theme);
      set({
        screen: "title",
        game: null,
        selectedCardId: null,
        exchangeMode: false,
        openAttraction: null,
        aiThinking: false,
        aiMoveFx: null,
        mapIntroOpen: false,
        mapOutroOpen: false,
        nightEmergencyDeferred: false,
      });
    },
    selectCard: (id) => {
      if (!canAct()) return;
      const { selectedCardId } = get();
      const next = selectedCardId === id ? null : id;
      if (next) {
        audio.playSelect();
        audio.tapHaptic("select");
      }
      set({ selectedCardId: next });
    },
    toggleExchange: () => {
      if (!canAct()) return;
      const { game, exchangeMode } = get();
      if (!game || game.exchangesUsed >= exchangeLimit(game) || game.swappedCardId) return;
      audio.playUi();
      set({
        exchangeMode: !exchangeMode,
        nightEmergencyDeferred: exchangeMode ? false : get().nightEmergencyDeferred,
      });
    },
    openPark: (id) => {
      audio.playUi();
      set({ openAttraction: id });
    },
    place: (attractionId, index) => {
      if (!canAct()) return;
      const { game, selectedCardId, exchangeMode } = get();
      if (!game || !selectedCardId || exchangeMode || get().aiThinking || game.pendingAdvance)
        return;
      try {
        const next = placeCard(game, selectedCardId, attractionId, index);
        juice(game, next, get().pulse, attractionId);
        afterHuman(next);
      } catch {
        /* illegal */
      }
    },
    visit: (attractionId) => {
      if (!canAct()) return;
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
      if (!canAct()) return;
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
        const incoming =
          next.hands[next.currentPlayer].find((c) => c.id === next.swappedCardId) ?? null;
        set({
          game: next,
          selectedCardId: next.swappedCardId,
          exchangeMode: false,
          swapFx: outgoing && incoming ? { n: Date.now(), incoming, outgoing } : null,
        });
        window.setTimeout(() => {
          if (get().swapFx?.n) set({ swapFx: null });
        }, 780);
      } catch {
        /* illegal */
      }
    },
    pass: () => {
      if (!canAct()) return;
      const { game } = get();
      if (!game || get().aiThinking) return;
      if (hasRequiredAction(game)) return;
      const next = passTurn(game);
      afterHuman(next);
    },
    closePark: () => {
      if (!canAct()) return;
      const { game } = get();
      if (!game || game.ended) return;
      window.clearTimeout(aiTimer);
      window.clearTimeout(aiRevealTimer);
      window.clearTimeout(aiRevealClearTimer);
      window.clearTimeout(advanceTimer);
      const next = closePark(game);
      set({ aiThinking: false, aiMoveFx: null, swapFx: null, bloomId: null });
      juice(game, next, get().pulse);
      afterHuman(next);
    },
    hideVisitorPrompt: () => {
      audio.playUi();
      set({ visitorPromptHidden: true });
    },
    dismissMapIntro: () => set({ mapIntroOpen: false }),
    finishMapOutro: () => {
      const game = get().game;
      if (!game?.ended) {
        set({ mapOutroOpen: false });
        return;
      }
      set({
        screen: "end",
        mapOutroOpen: false,
        selectedCardId: null,
        exchangeMode: false,
        openAttraction: null,
        aiThinking: false,
        visitorPromptHidden: false,
      });
    },
    continueAfterPass: () => {
      audio.playUi();
      set({ screen: "playing", selectedCardId: null, openAttraction: null });
    },
    toggleMute: () => {
      const muted = !get().muted;
      audio.setMuted(muted);
      saveSettings({ ...loadSettings(), muted });
      set({ muted });
      if (!muted) audio.playUi();
    },
    toggleNightTheme: () => {
      if (!loadSecrets().nightPerfect) return;
      const nightTheme = !get().nightTheme;
      saveSettings({ ...loadSettings(), nightTheme });
      set({ nightTheme });
      audio.playUi();
    },
    setShowcaseTheme: (showcaseTheme) => {
      saveSettings({ ...loadSettings(), showcaseTheme });
      set({ showcaseTheme });
      if (showcaseTheme === "classic") audio.startTitleBed();
      else audio.startChallengeBed(showcaseTheme);
      audio.playUi();
    },
    setCardBack: (cardBack) => {
      saveSettings({ ...loadSettings(), cardBack });
      set({ cardBack });
      audio.playUi();
    },
    unlockMachineRoom: () => {
      unlockSecret("pentonuiSignal");
      set({ machineRoomUnlocked: true });
      audio.playComplete("haunted");
    },
    unlockNightSector: (id) => {
      if (!canAct()) return;
      const game = get().game;
      if (!game?.night) return;
      const emergency = nightEmergencyAvailable(game);
      try {
        const opened = unlockNightAttraction(game, id, emergency);
        persist(opened);
        audio.playComplete(id);
        get().pulse("complete", id);
        if (emergency) {
          set({ game: opened, selectedCardId: null, exchangeMode: false, openAttraction: null });
          if (opened.mode === "ai" && opened.currentPlayer === 1) queueAi();
          return;
        }
        afterHuman(advanceTurn(opened), true);
      } catch {
        /* stale choice */
      }
    },
    deferNightEmergency: () => {
      if (!canAct()) return;
      const game = get().game;
      if (!game || !nightEmergencyAvailable(game)) return;
      const canExchange = game.hands[game.currentPlayer].some(
        (card) => legalExchanges(game, card.id).length > 0,
      );
      if (!canExchange) return;
      audio.playUi();
      set({ nightEmergencyDeferred: true, exchangeMode: true, selectedCardId: null });
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
