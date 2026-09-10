import { Medal, Sparkles } from "lucide-react";
import { exchangeLimit } from "@/lib/game/engine";
import type { GameChallenge, GameDifficulty } from "@/lib/game/types";
import { cn } from "@/lib/utils";

export function DifficultySelector({
  challenge,
  value,
  onChange,
  dark = false,
}: {
  challenge: GameChallenge;
  value: GameDifficulty;
  onChange: (difficulty: GameDifficulty) => void;
  dark?: boolean;
}) {
  const classicChanges = exchangeLimit({ challenge, difficulty: "standard" });
  const easyChanges = exchangeLimit({ challenge, difficulty: "easy" });

  return (
    <div className={cn("mode-difficulty", dark && "is-dark")}>
      <p>Elige dificultad</p>
      <div role="group" aria-label="Dificultad de la partida">
        <button type="button" className={value === "standard" ? "is-selected" : undefined} aria-pressed={value === "standard"} onClick={() => onChange("standard")}>
          <Medal aria-hidden />
          <span><strong>Clásico</strong><small>{classicChanges} cambios · concede medalla</small></span>
        </button>
        <button type="button" className={value === "easy" ? "is-selected" : undefined} aria-pressed={value === "easy"} onClick={() => onChange("easy")}>
          <Sparkles aria-hidden />
          <span><strong>Fácil</strong><small>{easyChanges} cambios · mismos desbloqueos</small></span>
        </button>
      </div>
    </div>
  );
}
