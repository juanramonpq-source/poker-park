import { canVisitAnything, hasRequiredAction, parkSolved, passLimit } from "@/lib/game/engine";
import { Button } from "@/components/ui/button";
import { useGameStore } from "@/store/game-store";

export function BlockedSheet() {
  const game = useGameStore((s) => s.game);
  const pass = useGameStore((s) => s.pass);
  const closePark = useGameStore((s) => s.closePark);
  const hideVisitorPrompt = useGameStore((s) => s.hideVisitorPrompt);
  const visitorPromptHidden = useGameStore((s) => s.visitorPromptHidden);
  const aiThinking = useGameStore((s) => s.aiThinking);
  const aiMoveFx = useGameStore((s) => s.aiMoveFx);
  if (!game || game.ended || game.pendingAdvance || aiThinking || aiMoveFx) return null;
  if (game.mode === "ai" && game.currentPlayer === 1) return null;
  if (hasRequiredAction(game)) return null;
  if (visitorPromptHidden) return null;

  const visits = canVisitAnything(game);
  const solved = parkSolved(game);
  const isSolo = game.mode === "solo";
  const weatherSolo = isSolo && (game.challenge === "storm" || game.challenge === "impossible");
  const lastPass = game.consecutivePasses >= passLimit(game) - 1;

  return (
    <div className="absolute inset-0 z-30 flex items-end justify-center p-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <button type="button" className="absolute inset-0 bg-fg/35 backdrop-blur-[2px]" aria-hidden />
      <section className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-surface p-5 shadow-soft stagger-in">
        {visits || solved ? (
          <>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
              {solved ? "Parque completo" : "El día se acaba"}
            </p>
            <h2 className="mt-2 font-display text-2xl font-medium tracking-tight text-fg">
              {solved
                ? "El parque está resuelto"
                : "Ya no se puede montar en más atracciones"}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {visits
                ? "Las figuras que quedan pueden sentarse como visitantes. No es obligatorio."
                : "No queda nada más que colocar. Es hora de cerrar el parque."}
            </p>
            <Button size="lg" className="mt-5 w-full" onClick={closePark}>
              Cerrar el parque
            </Button>
            {visits ? (
              <Button size="md" variant="secondary" className="mt-2 w-full" onClick={hideVisitorPrompt}>
                Dejar un visitante
              </Button>
            ) : null}
          </>
        ) : (
          <>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent">Atasco</p>
            <h2 className="mt-2 font-display text-2xl font-medium tracking-tight text-fg">
              Estás bloqueado, no puedes montar en nada
            </h2>
            {isSolo ? (
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {weatherSolo && !lastPass
                  ? "Tu mano está bloqueada por este frente. Deja que avance la tormenta: el siguiente sector puede abrir una jugada."
                  : weatherSolo
                    ? "Tu mano sigue sin poder colocar ni intercambiar después de dos frentes. Confirma el bloqueo para pasar al recuento."
                    : "Tu única mano no puede colocar ni intercambiar ninguna carta. Confirma el bloqueo para pasar al recuento."}
              </p>
            ) : lastPass ? (
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Tu compañero tampoco pudo. Fin de la jornada en el parque.
              </p>
            ) : (
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Pasa el turno: tu compañero puede desbloquear el día colocando o cambiando una carta.
              </p>
            )}
            <Button size="lg" className="mt-5 w-full" onClick={lastPass && !isSolo ? closePark : pass}>
              {isSolo
                ? weatherSolo && !lastPass
                  ? "Esperar al siguiente frente"
                  : "Terminar la jornada"
                : lastPass
                  ? "Cerrar el parque"
                  : "Pasar turno"}
            </Button>
          </>
        )}
      </section>
    </div>
  );
}
