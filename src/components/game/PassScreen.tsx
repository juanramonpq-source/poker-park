import { Button } from "@/components/ui/button";
import { useGameStore } from "@/store/game-store";
import { EyeOff, UserRound } from "lucide-react";

export function PassScreen() {
  const game = useGameStore((s) => s.game);
  const continueAfterPass = useGameStore((s) => s.continueAfterPass);
  if (!game) return null;
  const name = game.names[game.currentPlayer];

  return (
    <main className="pass-screen">
      <img
        src="/images/park-day.jpg"
        alt=""
        className="pass-cover"
      />
      <div className="pass-vignette" />
      <div className="pass-card stagger-in">
        <span className="pass-icon"><UserRound aria-hidden /></span>
        <p className="pass-kicker">Pasa el teléfono</p>
        <h1>Turno de {name}</h1>
        <div className="pass-privacy"><EyeOff aria-hidden /><span>La otra mano está oculta</span></div>
        <p className="pass-copy">Cuando tengas el teléfono, pulsa el botón para ver tus cartas y comenzar el turno.</p>
        <Button size="lg" className="w-full" onClick={continueAfterPass}>
          Soy {name}
        </Button>
      </div>
    </main>
  );
}
