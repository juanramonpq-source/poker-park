import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import { cardName, isFace } from "@/lib/game/deck";
import { canVisitAnything, legalExchanges, legalPlacements, legalVisits } from "@/lib/game/engine";
import { Check, X } from "lucide-react";
import { PlayingCard } from "@/components/game/PlayingCard";
import { cn } from "@/lib/utils";
import { useGameStore, useLegalForSelected } from "@/store/game-store";
import type { AttractionId, Card, GameState } from "@/lib/game/types";

type DropCandidate =
  | { kind: "slot"; attractionId: AttractionId; index: number; element: HTMLElement }
  | { kind: "attraction"; attractionId: AttractionId; element: HTMLElement }
  | null;

type DragPreview = {
  card: Card;
  x: number;
  y: number;
  candidate: DropCandidate;
};

const DRAG_THRESHOLD = 9;
const SHEET_DWELL_MS = 380;

function dropCandidateAt(game: GameState, card: Card, x: number, y: number): DropCandidate {
  const hit = document.elementFromPoint(x, y) as HTMLElement | null;
  if (!hit) return null;
  const placements = legalPlacements(game, card.id);
  const slot = hit.closest<HTMLElement>("[data-card-drop-slot='true']");
  if (slot) {
    const attractionId = slot.dataset.dropAttraction as AttractionId | undefined;
    const index = Number(slot.dataset.dropIndex);
    if (attractionId && placements.some((place) => place.attractionId === attractionId && place.index === index)) {
      return { kind: "slot", attractionId, index, element: slot };
    }
  }
  const tile = hit.closest<HTMLElement>("[data-card-drop-attraction]");
  const attractionId = tile?.dataset.cardDropAttraction as AttractionId | undefined;
  if (
    tile &&
    attractionId &&
    (placements.some((place) => place.attractionId === attractionId) || legalVisits(game, card.id).includes(attractionId))
  ) {
    return { kind: "attraction", attractionId, element: tile };
  }
  return null;
}

export function Hand() {
  const game = useGameStore((s) => s.game);
  const selectedCardId = useGameStore((s) => s.selectedCardId);
  const selectCard = useGameStore((s) => s.selectCard);
  const exchangeMode = useGameStore((s) => s.exchangeMode);
  const swapFx = useGameStore((s) => s.swapFx);
  const aiThinking = useGameStore((s) => s.aiThinking);
  const aiMoveFx = useGameStore((s) => s.aiMoveFx);
  const visitorPromptHidden = useGameStore((s) => s.visitorPromptHidden);
  const onlineLocalPlayer = useGameStore((s) => s.onlineLocalPlayer);
  const onlineConnected = useGameStore((s) => s.onlineConnected);
  const openPark = useGameStore((s) => s.openPark);
  const place = useGameStore((s) => s.place);
  const visit = useGameStore((s) => s.visit);
  const { places, visits, exchanges } = useLegalForSelected();
  const [drag, setDrag] = useState<DragPreview | null>(null);
  const pendingDrag = useRef<{ card: Card; pointerId: number; x: number; y: number; active: boolean } | null>(null);
  const hoveredElement = useRef<HTMLElement | null>(null);
  const dwellTimer = useRef(0);
  const dwellKey = useRef<string | null>(null);
  const suppressClick = useRef<string | null>(null);

  const clearHover = () => {
    hoveredElement.current?.classList.remove("card-drop-hover");
    hoveredElement.current = null;
    window.clearTimeout(dwellTimer.current);
    dwellKey.current = null;
  };

  const clearDrag = () => {
    clearHover();
    pendingDrag.current = null;
    setDrag(null);
    document.body.classList.remove("is-card-dragging");
  };

  useEffect(() => () => {
    window.clearTimeout(dwellTimer.current);
    document.body.classList.remove("is-card-dragging");
  }, []);

  if (!game) return null;
  const viewer = game.mode === "ai" ? 0 : game.mode === "online" ? (onlineLocalPlayer ?? 0) : game.currentPlayer;
  const hand = game.hands[viewer];
  const locked = aiThinking || Boolean(aiMoveFx) || game.pendingAdvance || (game.mode === "ai" && game.currentPlayer === 1) || (game.mode === "online" && (!onlineConnected || onlineLocalPlayer !== game.currentPlayer));
  const selectedCard = hand.find((c) => c.id === selectedCardId);
  const selectedCanExchange = Boolean(
    selectedCard && !game.swappedCardId && legalExchanges(game, selectedCard.id).length,
  );
  const selectedHasMove =
    places.length + visits.length + exchanges.length > 0 || selectedCanExchange || !selectedCardId;
  const noMove = Boolean(selectedCardId) && !selectedHasMove && !locked;
  const isNight = game.challenge === "night";
  const guideTitle = locked
      ? game.mode === "online" && !onlineConnected
        ? "Reconectando con tu compañero"
        : game.mode === "online" && onlineLocalPlayer !== game.currentPlayer
        ? `Es el turno de ${game.names[game.currentPlayer]}`
        : game.pendingAdvance
      ? isNight ? "¡Revisión superada!" : "¡Atracción conseguida!"
      : isNight ? "Tu compañero comprueba el sector" : "Espera a tu compañero"
    : noMove
      ? "Esta carta no encaja ahora"
      : selectedCard
        ? game.swappedCardId
          ? "Ahora coloca la carta recibida"
          : exchangeMode
            ? "Elige qué carta quieres recibir"
            : selectedCanExchange
              ? "Colócala o pulsa Cambiar"
              : "Ahora elige una atracción"
        : exchangeMode
          ? "Elige la carta que quieres cambiar"
          : isNight ? "Elige una carta para la revisión" : "Elige una carta de tu mano";
  const guideDetail = selectedCard
    ? `Seleccionada: ${cardName(selectedCard)}`
    : `${hand.length} cartas · toca o arrastra`;

  const beginDrag = (event: ReactPointerEvent<HTMLButtonElement>, card: Card) => {
    if (locked || exchangeMode || (event.pointerType === "mouse" && event.button !== 0)) return;
    pendingDrag.current = {
      card,
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      active: false,
    };
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      /* Algunos WebViews no exponen captura durante el primer instante táctil. */
    }
  };

  const moveDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const pending = pendingDrag.current;
    if (!pending || pending.pointerId !== event.pointerId) return;
    if (!pending.active) {
      const distance = Math.hypot(event.clientX - pending.x, event.clientY - pending.y);
      if (distance < DRAG_THRESHOLD) return;
      pending.active = true;
      if (useGameStore.getState().selectedCardId !== pending.card.id) selectCard(pending.card.id);
      document.body.classList.add("is-card-dragging");
    }
    event.preventDefault();
    const currentGame = useGameStore.getState().game;
    const candidate = currentGame ? dropCandidateAt(currentGame, pending.card, event.clientX, event.clientY) : null;
    if (hoveredElement.current !== candidate?.element) {
      clearHover();
      hoveredElement.current = candidate?.element ?? null;
      hoveredElement.current?.classList.add("card-drop-hover");
    }
    if (candidate?.kind === "attraction" && currentGame) {
      const choices = legalPlacements(currentGame, pending.card.id).filter((item) => item.attractionId === candidate.attractionId);
      const key = choices.length > 1 ? `${pending.card.id}:${candidate.attractionId}` : null;
      if (key && dwellKey.current !== key) {
        window.clearTimeout(dwellTimer.current);
        dwellKey.current = key;
        dwellTimer.current = window.setTimeout(() => openPark(candidate.attractionId), SHEET_DWELL_MS);
      }
    }
    setDrag({ card: pending.card, x: event.clientX, y: event.clientY, candidate });
  };

  const endDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const pending = pendingDrag.current;
    if (!pending || pending.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (!pending.active) {
      pendingDrag.current = null;
      return;
    }
    event.preventDefault();
    suppressClick.current = pending.card.id;
    window.setTimeout(() => {
      if (suppressClick.current === pending.card.id) suppressClick.current = null;
    }, 0);
    const currentGame = useGameStore.getState().game;
    const candidate = currentGame ? dropCandidateAt(currentGame, pending.card, event.clientX, event.clientY) : null;
    clearDrag();
    if (!currentGame || !candidate) return;
    if (candidate.kind === "slot") {
      place(candidate.attractionId, candidate.index);
      return;
    }
    if (legalVisits(currentGame, pending.card.id).includes(candidate.attractionId)) {
      visit(candidate.attractionId);
      return;
    }
    const choices = legalPlacements(currentGame, pending.card.id).filter((item) => item.attractionId === candidate.attractionId);
    if (choices.length === 1) place(candidate.attractionId, choices[0]!.index);
    else if (choices.length > 1) openPark(candidate.attractionId);
  };

  const cancelDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (pendingDrag.current?.pointerId !== event.pointerId) return;
    clearDrag();
  };

  return (
    <footer className="hand-panel">
      <div className="hand-inner">
        <div className="hand-guide" aria-live="polite">
          <span className={cn("hand-step", selectedCard && !noMove && "is-ready")}>
            {selectedCard && !noMove ? <Check aria-hidden /> : 1}
          </span>
          <span className="hand-guide-copy">
            <strong>{visitorPromptHidden && canVisitAnything(game) ? "Elige una figura para dejarla de visitante" : guideTitle}</strong>
            <small>{guideDetail}</small>
          </span>
          {selectedCard && !game.swappedCardId && !locked ? (
            <button type="button" className="clear-selection" onClick={() => selectCard(selectedCard.id)}>
              <X aria-hidden />
              <span>Quitar</span>
            </button>
          ) : null}
        </div>
        <div className="hand-cards" role="group" aria-label={`Tu mano: ${hand.length} cartas`}>
          {hand.map((card, i) => {
            const selected = selectedCardId === card.id;
            const tilt = (i - (hand.length - 1) / 2) * 5.5;
            return (
              <span
                key={card.id}
                className={cn("hand-card", selected && "hand-card-on", drag?.card.id === card.id && "hand-card-drag-source")}
                style={{
                  zIndex: selected ? 8 : i + 1,
                  marginLeft: i === 0 ? 0 : "-0.7rem",
                  ["--tilt" as string]: `${tilt}deg`,
                  animationDelay: `${i * 0.22}s`,
                }}
              >
                <PlayingCard
                  card={card}
                  size="md"
                  selected={selected}
                  dimmed={Boolean(selectedCardId) && !selected}
                  className={swapFx?.incoming.id === card.id ? "card-swap-in" : undefined}
                  onPointerDown={locked || exchangeMode ? undefined : (event) => beginDrag(event, card)}
                  onPointerMove={locked || exchangeMode ? undefined : moveDrag}
                  onPointerUp={locked || exchangeMode ? undefined : endDrag}
                  onPointerCancel={locked || exchangeMode ? undefined : cancelDrag}
                  onClick={locked ? undefined : () => {
                    if (suppressClick.current === card.id) {
                      suppressClick.current = null;
                      return;
                    }
                    selectCard(card.id);
                  }}
                />
              </span>
            );
          })}
        </div>
        {noMove ? (
          <p className="hand-warning">
            {selectedCard && isFace(selectedCard)
              ? "Las figuras van a las sillas, los aseos o a visitantes."
              : "Esa carta no encaja ahora. Prueba otra o un intercambio."}
          </p>
        ) : null}
      </div>
      {drag && typeof document !== "undefined" ? createPortal(
        <div className="card-drag-layer" aria-hidden="true">
          <div className="card-drag-ghost" style={{ left: drag.x, top: drag.y }}>
            <PlayingCard card={drag.card} size="md" className="drag-card-identity" />
            <span className={cn("card-drag-hint", drag.candidate && "is-ready")}>
              {drag.candidate ? "Suelta aquí" : "Busca una luz verde"}
            </span>
          </div>
        </div>,
        document.body,
      ) : null}
    </footer>
  );
}
