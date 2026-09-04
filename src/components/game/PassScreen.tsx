import { Button } from "@/components/ui/button";
import { useGameStore } from "@/store/game-store";

export function PassScreen() {
  const game = useGameStore((s) => s.game);
  const continueAfterPass = useGameStore((s) => s.continueAfterPass);
  if (!game) return null;
  const name = game.names[game.currentPlayer];

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center bg-bg px-6 pb-24 text-center">
      <img
        src="/images/park-day.jpg"
        alt=""
        className="absolute inset-0 size-full object-cover object-[center_30%] opacity-50"
      />
      <div className="absolute inset-0 bg-bg/70" />
      <div className="relative stagger-in flex max-w-sm flex-col items-center gap-5">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
          Pasa el teléfono
        </p>
        <h1 className="font-display text-4xl font-medium tracking-tight text-fg">
          {name}
        </h1>
        <p className="text-sm leading-relaxed text-muted">
          La mano del otro jugador queda oculta. Cuando tengas el teléfono, abre tu turno.
        </p>
        <Button size="lg" className="mt-2 w-full" onClick={continueAfterPass}>
          Soy {name}
        </Button>
      </div>
    </main>
  );
}
