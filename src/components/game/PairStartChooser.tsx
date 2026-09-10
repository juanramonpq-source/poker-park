import { FerrisWheel, Users, X } from "lucide-react";
import { useState } from "react";
import type { GameDifficulty } from "@/lib/game/types";
import { Button } from "@/components/ui/button";
import { DifficultySelector } from "@/components/game/DifficultySelector";

export function PairStartChooser({
  onClose,
  onStart,
}: {
  onClose: () => void;
  onStart: (difficulty: GameDifficulty) => void;
}) {
  const [difficulty, setDifficulty] = useState<GameDifficulty>("standard");

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
        <p className="solo-mode-challenge"><FerrisWheel aria-hidden /><span><small>Parque de día</small>Completad las siete atracciones respetando el recorrido propio de cada una.</span></p>
        <p className="tutorial-choice-copy"><Users aria-hidden /> Dos manos, turnos alternos y todas las decisiones compartidas en el mismo dispositivo.</p>
        <DifficultySelector challenge="classic" value={difficulty} onChange={setDifficulty} />
        <Button size="lg" className="mt-4 w-full" onClick={() => onStart(difficulty)}>Empezar la jornada</Button>
      </section>
    </div>
  );
}
