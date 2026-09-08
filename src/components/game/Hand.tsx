import { cardName, isFace } from "@/lib/game/deck";
import { canVisitAnything, legalExchanges } from "@/lib/game/engine";
import { Check, X } from "lucide-react";
import { PlayingCard } from "@/components/game/PlayingCard";
import { cn } from "@/lib/utils";
import { useGameStore, useLegalForSelected } from "@/store/game-store";

export function Hand() {
  const game = useGameStore((s) => s.game);
  const selectedCardId = useGameStore((s) => s.selectedCardId);
  const selectCard = useGameStore((s) => s.selectCard);
  const exchangeMode = useGameStore((s) => s.exchangeMode);
  const swapFx = useGameStore((s) => s.swapFx);
  const aiThinking = useGameStore((s) => s.aiThinking);
  const aiMoveFx = useGameStore((s) => s.aiMoveFx);
  const visitorPromptHidden = useGameStore((s) => s.visitorPromptHidden);
  const { places, visits, exchanges } = useLegalForSelected();

  if (!game) return null;
  const viewer = game.mode === "ai" ? 0 : game.currentPlayer;
  const hand = game.hands[viewer];
  const locked = aiThinking || Boolean(aiMoveFx) || game.pendingAdvance || (game.mode === "ai" && game.currentPlayer === 1);
  const selectedCard = hand.find((c) => c.id === selectedCardId);
  const selectedCanExchange = Boolean(
    selectedCard && !game.swappedCardId && legalExchanges(game, selectedCard.id).length,
  );
  const selectedHasMove =
    places.length + visits.length + exchanges.length > 0 || selectedCanExchange || !selectedCardId;
  const noMove = Boolean(selectedCardId) && !selectedHasMove && !locked;
  const isNight = game.challenge === "night";
  const guideTitle = locked
    ? game.pendingAdvance
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
    : `${hand.length} cartas disponibles`;

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
                className={selected ? "hand-card hand-card-on" : "hand-card"}
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
                  onClick={locked ? undefined : () => selectCard(card.id)}
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
    </footer>
  );
}
