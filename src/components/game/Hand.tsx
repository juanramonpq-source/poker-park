import { isFace } from "@/lib/game/deck";
import { canVisitAnything } from "@/lib/game/engine";
import { PlayingCard } from "@/components/game/PlayingCard";
import { Button } from "@/components/ui/button";
import { useGameStore, useLegalForSelected } from "@/store/game-store";

export function Hand() {
  const game = useGameStore((s) => s.game);
  const selectedCardId = useGameStore((s) => s.selectedCardId);
  const selectCard = useGameStore((s) => s.selectCard);
  const exchangeMode = useGameStore((s) => s.exchangeMode);
  const swapFx = useGameStore((s) => s.swapFx);
  const aiThinking = useGameStore((s) => s.aiThinking);
  const visitorPromptHidden = useGameStore((s) => s.visitorPromptHidden);
  const closePark = useGameStore((s) => s.closePark);
  const { places, visits, exchanges } = useLegalForSelected();

  if (!game) return null;
  const viewer = game.mode === "ai" ? 0 : game.currentPlayer;
  const hand = game.hands[viewer];
  const locked = aiThinking || game.pendingAdvance || (game.mode === "ai" && game.currentPlayer === 1);
  const selectedHasMove =
    places.length + visits.length + exchanges.length > 0 || !selectedCardId;
  const selectedCard = hand.find((c) => c.id === selectedCardId);

  return (
    <footer className="shrink-0 overflow-visible border-t border-border bg-surface/95 pb-[max(0.45rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto max-w-3xl px-2 pt-2">
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <p className="min-w-0 truncate text-[11px] text-muted">
            {locked
              ? game.pendingAdvance
                ? "¡Atracción conseguida!"
                : "Espera a tu compañero"
              : exchangeMode
                ? "Carta de la mano, luego una del parque"
                : visitorPromptHidden && canVisitAnything(game)
                  ? "Elige una figura y toca una atracción"
                  : game.swappedCardId
                    ? "Coloca la carta que acaba de entrar"
                    : "Elige una carta y toca una atracción"}
          </p>
          {visitorPromptHidden && !locked ? (
            <Button size="sm" variant="secondary" onClick={closePark}>
              Cerrar el parque
            </Button>
          ) : null}
        </div>
        <div className="flex items-end justify-center px-2 pt-3 pb-1">
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
        {selectedCardId && !selectedHasMove && !locked ? (
          <p className="pt-1 text-center text-[10px] leading-snug text-muted">
            {selectedCard && isFace(selectedCard)
              ? "Las figuras van a las sillas, los aseos o a visitantes."
              : "Esa carta no encaja ahora. Prueba otra o un intercambio."}
          </p>
        ) : null}
      </div>
    </footer>
  );
}
