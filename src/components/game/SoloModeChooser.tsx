import { FerrisWheel, User, UserRound, X } from "lucide-react";
import { useState } from "react";
import type { GameChallenge, GameDifficulty, Mode } from "@/lib/game/types";
import { Button } from "@/components/ui/button";
import { DifficultySelector } from "@/components/game/DifficultySelector";
import { CHALLENGE_NAMES } from "@/lib/game/challenges";
import { cn } from "@/lib/utils";

const CHALLENGE_HINTS: Record<GameChallenge, string> = {
  classic: "Completa las siete atracciones respetando el recorrido propio de cada una.",
  night: "Empieza con dos sectores iluminados y devuelve la corriente al resto del parque.",
  festival: "Alterna atracciones para mantener el combo de luces mientras completas el parque.",
  mirror: "Construye las siete atracciones siguiendo sus dependencias en orden inverso.",
  storm: "Consulta el pronóstico: un sector distinto queda cerrado temporalmente cada turno.",
  impossible: "Combina Espejo, Tormenta y Festival en la jornada final de las 00:13.",
};

export function SoloModeChooser({
  onClose,
  onChoose,
  challenge = "classic",
  initialDifficulty = "standard",
}: {
  onClose: () => void;
  onChoose: (mode: Extract<Mode, "solo" | "ai">, difficulty: GameDifficulty) => void;
  challenge?: GameChallenge;
  initialDifficulty?: GameDifficulty;
}) {
  const [mode, setMode] = useState<Extract<Mode, "solo" | "ai">>("solo");
  const [difficulty, setDifficulty] = useState<GameDifficulty>(initialDifficulty);

  return (
    <div className="tutorial-overlay solo-mode-overlay" role="dialog" aria-modal="true" aria-labelledby="solo-mode-title">
      <button className="tutorial-backdrop" type="button" aria-label="Cerrar modo solitario" onClick={onClose} />
      <section className="tutorial-card solo-mode-card">
        <div className="tutorial-heading">
          <div>
            <p className="tutorial-kicker">Elige cómo montar el parque</p>
            <h2 id="solo-mode-title">Modo solitario</h2>
          </div>
          <Button size="icon" variant="ghost" onClick={onClose} aria-label="Cerrar modo solitario">
            <X className="size-4" />
          </Button>
        </div>
        <p className="solo-mode-challenge"><FerrisWheel aria-hidden /><span><small>{CHALLENGE_NAMES[challenge]}</small>{CHALLENGE_HINTS[challenge]}</span></p>
        <p className="tutorial-choice-copy">Juega con una única mano o deja que el parque controle la mano de tu compañero.</p>
        <div className="solo-mode-choices">
          <button type="button" className={cn("solo-mode-choice", mode === "solo" && "is-selected")} aria-pressed={mode === "solo"} onClick={() => setMode("solo")}>
            <span className="solo-mode-choice-icon"><User aria-hidden /></span>
            <span><strong>Montar solo</strong><small>Una única mano con cinco cartas iniciales.</small></span>
          </button>
          <button type="button" className={cn("solo-mode-choice", mode === "ai" && "is-selected")} aria-pressed={mode === "ai"} onClick={() => setMode("ai")}>
            <span className="solo-mode-choice-icon"><UserRound aria-hidden /></span>
            <span><strong>Con compañero virtual</strong><small>Tú juegas una mano y el parque se ocupa de la otra.</small></span>
          </button>
        </div>
        <DifficultySelector challenge={challenge} value={difficulty} onChange={setDifficulty} />
        {challenge === "night" && mode === "solo" ? <p className="tutorial-choice-copy">Las Jotas descansan en la caseta y se reemplazan al robar. {difficulty === "easy" ? "Además, tienes un comodín de un solo uso en el llavero. Con 6 revisiones abres el Pase Maestro; con 7 consigues Guardianes del Alba." : "Podrás colocarlas en las Sillas cuando la torre esté lista."}</p> : null}
        <Button size="lg" className="mt-4 w-full" onClick={() => onChoose(mode, difficulty)}>
          {mode === "solo" ? "Empezar montando solo" : "Empezar con compañero virtual"}
        </Button>
      </section>
    </div>
  );
}
