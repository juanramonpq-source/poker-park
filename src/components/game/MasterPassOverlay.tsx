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
import { PairStartChooser } from "@/components/game/PairStartChooser";
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

const STORM_BRIEFING = [
  "Al empezar cada turno, la tormenta cierra temporalmente una atracción. Las cartas que ya estaban colocadas permanecen a salvo.",
  "El pronóstico anuncia qué sector se cerrará después, para que puedas preparar una ruta alternativa.",
  "Si el temporal te deja sin jugada, el parque espera dos turnos en solitario o cuatro pases en pareja antes de declarar el bloqueo.",
];

const IMPOSSIBLE_BRIEFING = [
  "Espejo invierte las dependencias de las siete atracciones: cada recorrido debe construirse desde el otro lado.",
  "Tormenta cierra temporalmente una atracción en cada turno. El pronóstico revela la siguiente y las cartas ya colocadas permanecen a salvo.",
  "Festival enciende la cadena de luces al alternar atracciones. Repetir destino reinicia el combo a x1, pero no cambia qué cartas son válidas.",
];

const MASTER_MODES: {
  id: MasterMode;
  title: string;
  chapter: string;
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
    chapter: "Reto I",
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
    chapter: "Reto II",
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
    chapter: "Reto III",
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
    chapter: "Reto final",
    kicker: "Los tres secretos despiertan",
    rule: "El reto final activa Espejo, Tormenta y Festival a la vez: construye las 7 atracciones al revés, esquiva los cierres y mantén viva la cadena de luces.",
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
  const [selected, setSelected] = useState<MasterMode>("festival");
  const [soloChoiceOpen, setSoloChoiceOpen] = useState(false);
  const [pairChoiceOpen, setPairChoiceOpen] = useState(false);
  const [difficulty, setDifficulty] = useState<GameDifficulty>("standard");
  const selectedMode = MASTER_MODES.find((mode) => mode.id === selected);

  return (
    <div className="master-pass-layer" role="dialog" aria-modal="true" aria-labelledby="master-pass-title">
      <button type="button" className="master-pass-backdrop" onClick={onClose} aria-label="Cerrar Pase Maestro" />
      <section className="master-pass-card">
        <header>
          <span className="master-pass-seal" aria-hidden><FerrisWheel /></span>
          <span>
            <small>Mapa secreto desplegado</small>
            <h2 id="master-pass-title">Pase Maestro</h2>
          </span>
          <Button size="icon" variant="ghost" onClick={onClose} aria-label="Cerrar Pase Maestro"><X /></Button>
        </header>
        <p className="master-pass-intro">Has encontrado cuatro parques que no figuraban en ningún plano. Cada entrada transforma la jornada y esconde una recompensa.</p>
        <nav className="master-mode-grid" aria-label="Retos del Pase Maestro">
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
                aria-pressed={selected === mode.id}
                onClick={() => { setSelected(mode.id); setDifficulty("standard"); }}
              >
                <span className="master-mode-icon">{locked ? <LockKeyhole /> : <Icon />}</span>
                <span className="master-mode-copy"><small>{mode.chapter}</small><strong>{mode.title}</strong><p>{locked ? "Completa los tres retos anteriores" : mode.kicker}</p></span>
                <span className="master-mode-state">{complete ? <><Check /> Superado</> : locked ? "Entrada oculta" : "Descubrir"}</span>
              </button>
            );
          })}
        </nav>
        <div className="master-start-panel stagger-in">
          {selectedMode ? (
            <>
            <div className="master-mode-summary">
              <span><small>Entrada seleccionada</small><strong>{selectedMode.title}</strong><p>{selectedMode.rule}</p></span>
              <span className="master-mode-reward"><Sparkles aria-hidden /><span><small>Recompensa perfecta</small><strong>{selectedMode.reward}</strong></span></span>
            </div>
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
              <section className="festival-briefing impossible-ending-briefing" aria-label="Cómo jugar a Poker Park 00:13">
                <p><strong>Objetivo del modo</strong> Completar las 7 atracciones con los tres retos del Pase Maestro actuando simultáneamente.</p>
                <ol>
                  {IMPOSSIBLE_BRIEFING.map((rule, index) => <li key={rule}><span>{index + 1}</span>{rule}</li>)}
                </ol>
                <p className="festival-briefing-example"><strong>Las 00:13 marcan la apertura, no una cuenta atrás.</strong> Dispones de 6 cambios en Clásico o 7 en Fácil; si el clima bloquea el parque, se esperan dos rondas completas antes de cerrar.</p>
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
            {selectedMode.id === "storm" ? (
              <section className="festival-briefing storm-briefing" aria-label="Cómo jugar al Día de Tormenta">
                <p><strong>Objetivo del modo</strong> Completar las 7 atracciones mientras el frente de lluvia obliga a cambiar de plan en cada turno.</p>
                <ol>
                  {STORM_BRIEFING.map((rule, index) => <li key={rule}><span>{index + 1}</span>{rule}</li>)}
                </ol>
                <p className="festival-briefing-example"><strong>Ejemplo:</strong> si el Restaurante está cerrado, juegas en otro sector; al avanzar el turno, vuelve a abrirse y la tormenta se desplaza.</p>
              </section>
            ) : null}
            <DifficultySelector challenge={selectedMode.id} value={difficulty} onChange={setDifficulty} dark />
            <div className="master-start-actions">
              <Button size="lg" onClick={() => setPairChoiceOpen(true)}><Users /> En pareja</Button>
              <Button size="lg" variant="secondary" onClick={() => setSoloChoiceOpen(true)}><User /> Modo solitario</Button>
            </div>
            </>
          ) : null}
        </div>
      </section>
      {soloChoiceOpen && selectedMode ? (
        <SoloModeChooser
          onClose={() => setSoloChoiceOpen(false)}
          challenge={selectedMode.id}
          initialDifficulty={difficulty}
          onChoose={(mode, chosenDifficulty) => onStart(mode, selectedMode.id, chosenDifficulty)}
        />
      ) : null}
      {pairChoiceOpen && selectedMode ? (
        <PairStartChooser
          onClose={() => setPairChoiceOpen(false)}
          challenge={selectedMode.id}
          initialDifficulty={difficulty}
          onStart={(chosenDifficulty) => onStart("hotseat", selectedMode.id, chosenDifficulty)}
          onOnline={(chosenDifficulty) => onStart("online", selectedMode.id, chosenDifficulty)}
        />
      ) : null}
    </div>
  );
}
