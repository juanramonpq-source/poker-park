import {
  Check,
  CloudLightning,
  Crown,
  FerrisWheel,
  FlipHorizontal2,
  Lightbulb,
  LockKeyhole,
  Sparkles,
  User,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import type { Secrets } from "@/lib/game/persist";
import { masterTrialsComplete } from "@/lib/game/persist";
import type { GameChallenge, GameDifficulty, Mode } from "@/lib/game/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SoloModeChooser } from "@/components/game/SoloModeChooser";
import { DifficultySelector } from "@/components/game/DifficultySelector";

type MasterMode = Exclude<GameChallenge, "classic" | "night">;

const FESTIVAL_BRIEFING = [
  "La meta sigue siendo completar las 7 atracciones, con exactamente las mismas reglas que en una jornada normal.",
  "Cada carta colocada legalmente en una atracción distinta de la anterior aumenta el combo: ×1, ×2, ×3…",
  "Repetir la misma atracción en dos colocaciones seguidas devuelve el combo a ×1. Las bombillas indican el brillo conseguido; no cambian qué cartas son válidas.",
];

const MIRROR_BRIEFING = [
  "Montaña Rusa: empieza en la salida y rellena la vía hacia atrás. Casa del Terror: el A♠ del tejado va primero.",
  "Túnel del Amor: abre con A♥ en la cumbre y baja por los dos lados. Bosque: primero las dos columnas de la entrada.",
  "Sillas Voladoras: cuelga las cuatro figuras antes de levantar la torre. Restaurante: A♣ primero. Aseos: reina antes que rey.",
];

const MASTER_MODES: {
  id: MasterMode;
  title: string;
  kicker: string;
  rule: string;
  reward: string;
  changes: number;
  icon: typeof Sparkles;
  secretKey: keyof Secrets;
}[] = [
  {
    id: "festival",
    title: "Festival de las Luces",
    kicker: "Encadena el brillo",
    rule: "Alterna atracciones: cada cambio mantiene el combo y enciende más bombillas.",
    reward: "Reverso Fuegos de Feria",
    changes: 4,
    icon: Lightbulb,
    secretKey: "festivalPerfect",
  },
  {
    id: "mirror",
    title: "Parque Espejo",
    kicker: "Todo empieza al otro lado",
    rule: "No solo se refleja el plano: cada atracción debe construirse en el orden inverso.",
    reward: "Insignia Plata de Luna",
    changes: 5,
    icon: FlipHorizontal2,
    secretKey: "mirrorPerfect",
  },
  {
    id: "storm",
    title: "Día de Tormenta",
    kicker: "Juega con el pronóstico",
    rule: "La lluvia cierra un sector cada turno. Siempre conoceréis el siguiente.",
    reward: "Reverso Nube Dorada",
    changes: 5,
    icon: CloudLightning,
    secretKey: "stormPerfect",
  },
  {
    id: "impossible",
    title: "Poker Park 00:13",
    kicker: "El parque imposible",
    rule: "Espejo, tormenta y combos de luz en una única jornada final. No tiene cronómetro: solo acaba al cerrar el parque, agotar las cartas o confirmar el bloqueo.",
    reward: "Final verdadero, Reverso DUAL y Galería Maestro",
    changes: 6,
    icon: Crown,
    secretKey: "impossiblePerfect",
  },
];

export function MasterPassOverlay({
  secrets,
  onClose,
  onStart,
}: {
  secrets: Secrets;
  onClose: () => void;
  onStart: (mode: Mode, challenge: GameChallenge, difficulty: GameDifficulty) => void;
}) {
  const impossibleOpen = masterTrialsComplete(secrets) || secrets.impossiblePerfect;
  const [selected, setSelected] = useState<MasterMode | null>(null);
  const [soloChoiceOpen, setSoloChoiceOpen] = useState(false);
  const [difficulty, setDifficulty] = useState<GameDifficulty>("standard");
  const selectedMode = MASTER_MODES.find((mode) => mode.id === selected);

  return (
    <div className="master-pass-layer" role="dialog" aria-modal="true" aria-labelledby="master-pass-title">
      <button type="button" className="master-pass-backdrop" onClick={onClose} aria-label="Cerrar Pase Maestro" />
      <section className="master-pass-card">
        <header>
          <span className="master-pass-seal" aria-hidden><FerrisWheel /></span>
          <span>
            <small>Acceso tras La Noche de Guardia</small>
            <h2 id="master-pass-title">Pase Maestro</h2>
          </span>
          <Button size="icon" variant="ghost" onClick={onClose} aria-label="Cerrar Pase Maestro"><X /></Button>
        </header>
        <p className="master-pass-intro">Tres parques que no figuraban en el mapa. Complétalos para revelar la entrada de las 00:13.</p>
        <div className="master-mode-grid">
          {MASTER_MODES.map((mode) => {
            const locked = mode.id === "impossible" && !impossibleOpen;
            const complete = Boolean(secrets[mode.secretKey]);
            const Icon = mode.icon;
            return (
              <button
                type="button"
                key={mode.id}
                disabled={locked}
                className={cn("master-mode-option", `master-mode-${mode.id}`, selected === mode.id && "is-selected", complete && "is-complete")}
                onClick={() => { setSelected(mode.id); setDifficulty("standard"); }}
              >
                <span className="master-mode-icon">{locked ? <LockKeyhole /> : <Icon />}</span>
                <span className="master-mode-copy"><small>{locked ? "Entrada oculta" : `${mode.kicker} · ${mode.changes} cambios en Clásico`}</small><strong>{mode.title}</strong><p>{locked ? "Completa los otros tres modos." : mode.rule}</p></span>
                <span className="master-mode-state">{complete ? <><Check /> Superado</> : locked ? "???" : "Jugar"}</span>
              </button>
            );
          })}
        </div>
        {selectedMode ? (
          <div className="master-start-panel stagger-in">
            <div><Sparkles aria-hidden /><span><small>Recompensa perfecta</small><strong>{selectedMode.reward}</strong></span></div>
            {selectedMode.id === "festival" ? (
              <section className="festival-briefing" aria-label="Cómo jugar al Festival de las Luces">
                <p><strong>Objetivo del modo</strong> Completar el parque y, como reto adicional, mantener encendida la cadena de luces.</p>
                <ol>
                  {FESTIVAL_BRIEFING.map((rule, index) => <li key={rule}><span>{index + 1}</span>{rule}</li>)}
                </ol>
                <p className="festival-briefing-example"><strong>Ejemplo:</strong> Montaña Rusa → Túnel del Amor → Bosque da combo ×3 y 6 bombillas. Bosque otra vez reinicia el combo a ×1.</p>
              </section>
            ) : null}
            {selectedMode.id === "impossible" ? (
              <section className="festival-briefing impossible-ending-briefing" aria-label="Cuándo termina Poker Park 00:13">
                <p><strong>Importante: 00:13 no tiene reloj.</strong> La tormenta solo bloquea una atracción durante un turno; no acaba la partida.</p>
                <ol>
                  <li><span>1</span>Se termina al pulsar <strong>Cerrar</strong>.</li>
                  <li><span>2</span>Se termina si ya no queda ninguna carta en el mazo ni en las manos.</li>
                  <li><span>3</span>Con tormenta el bloqueo espera dos rondas: dos turnos sin jugada en solitario o cuatro pases en pareja.</li>
                </ol>
              </section>
            ) : null}
            {selectedMode.id === "mirror" ? (
              <section className="festival-briefing mirror-briefing" aria-label="Cómo jugar al Parque Espejo">
                <p><strong>Objetivo del modo</strong> Completar las 7 atracciones, pero respetando sus dependencias al revés. Las jugadas válidas se iluminan igual que siempre.</p>
                <ol>
                  {MIRROR_BRIEFING.map((rule, index) => <li key={rule}><span>{index + 1}</span>{rule}</li>)}
                </ol>
              </section>
            ) : null}
            <DifficultySelector challenge={selectedMode.id} value={difficulty} onChange={setDifficulty} dark />
            <div className="master-start-actions">
              <Button size="lg" onClick={() => onStart("hotseat", selectedMode.id, difficulty)}><Users /> En pareja</Button>
              <Button size="lg" variant="secondary" onClick={() => setSoloChoiceOpen(true)}><User /> Modo solitario</Button>
            </div>
          </div>
        ) : <p className="master-select-hint">Toca una entrada para consultar su recompensa y empezar.</p>}
      </section>
      {soloChoiceOpen && selectedMode ? (
        <SoloModeChooser
          onClose={() => setSoloChoiceOpen(false)}
          challenge={selectedMode.id}
          initialDifficulty={difficulty}
          onChoose={(mode, chosenDifficulty) => onStart(mode, selectedMode.id, chosenDifficulty)}
        />
      ) : null}
    </div>
  );
}
