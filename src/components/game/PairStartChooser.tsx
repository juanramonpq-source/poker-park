import { FerrisWheel, Globe2, Users, X } from "lucide-react";
import { useState } from "react";
import type { GameChallenge, GameDifficulty } from "@/lib/game/types";
import { Button } from "@/components/ui/button";
import { DifficultySelector } from "@/components/game/DifficultySelector";
import { CHALLENGE_NAMES } from "@/lib/game/challenges";
import { cn } from "@/lib/utils";

const CHALLENGE_HINTS: Record<GameChallenge, string> = {
  classic: "Completad las siete atracciones respetando el recorrido propio de cada una.",
  night: "Empezad con dos sectores iluminados y devolved la corriente al resto del parque.",
  festival: "Alternad atracciones para mantener el combo de luces mientras completáis el parque.",
  mirror: "Construid las siete atracciones siguiendo sus dependencias en orden inverso.",
  storm: "Consultad el pronóstico: un sector distinto queda cerrado temporalmente cada turno.",
  impossible: "Combinad Espejo, Tormenta y Festival en la jornada final de las 00:13.",
};

export function PairStartChooser({
  onClose,
  onStart,
  onOnline,
  challenge = "classic",
  initialDifficulty = "standard",
}: {
  onClose: () => void;
  onStart: (difficulty: GameDifficulty) => void;
  onOnline: (difficulty: GameDifficulty) => void;
  challenge?: GameChallenge;
  initialDifficulty?: GameDifficulty;
}) {
  const [playMode, setPlayMode] = useState<"local" | "online">("local");
  const [difficulty, setDifficulty] = useState<GameDifficulty>(initialDifficulty);

  return (
    <div className="tutorial-overlay solo-mode-overlay" role="dialog" aria-modal="true" aria-labelledby="pair-mode-title">
      <button className="tutorial-backdrop" type="button" aria-label="Cerrar preparación de partida" onClick={onClose} />
      <section className="tutorial-card solo-mode-card">
        <div className="tutorial-heading">
          <div>
            <p className="tutorial-kicker">Preparar jornada</p>
            <h2 id="pair-mode-title">Jugar en pareja</h2>
          </div>
          <Button size="icon" variant="ghost" onClick={onClose} aria-label="Cerrar preparación de partida"><X className="size-4" /></Button>
        </div>
        <p className="solo-mode-challenge"><FerrisWheel aria-hidden /><span><small>{CHALLENGE_NAMES[challenge]}</small>{CHALLENGE_HINTS[challenge]}</span></p>
        <p className="tutorial-choice-copy"><Users aria-hidden /> Dos manos y turnos alternos. Elegid si compartís pantalla o si cada persona juega desde su navegador.</p>
        <div className="solo-mode-choices">
          <button type="button" className={cn("solo-mode-choice", playMode === "local" && "is-selected")} aria-pressed={playMode === "local"} onClick={() => setPlayMode("local")}>
            <span className="solo-mode-choice-icon"><Users aria-hidden /></span>
            <span><strong>En este dispositivo</strong><small>Os pasáis el móvil o la tableta al cambiar el turno.</small></span>
          </button>
          <button type="button" className={cn("solo-mode-choice pair-online-choice", playMode === "online" && "is-selected")} aria-pressed={playMode === "online"} onClick={() => setPlayMode("online")}>
            <span className="solo-mode-choice-icon"><Globe2 aria-hidden /></span>
            <span><strong>Jugar online <em>Beta</em></strong><small>Cada persona ve su mano y las jugadas del otro navegador.</small></span>
          </button>
        </div>
        <DifficultySelector challenge={challenge} value={difficulty} onChange={setDifficulty} />
        <Button size="lg" className="mt-4 w-full" onClick={() => playMode === "online" ? onOnline(difficulty) : onStart(difficulty)}>
          {playMode === "online" ? "Preparar sala online" : "Empezar en este dispositivo"}
        </Button>
      </section>
    </div>
  );
}
