import {
  Check,
  CloudLightning,
  Crown,
  FerrisWheel,
  FlipHorizontal2,
  Lightbulb,
  LockKeyhole,
  Sparkles,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import type { Secrets } from "@/lib/game/persist";
import { masterTrialsComplete } from "@/lib/game/persist";
import type { GameChallenge, Mode } from "@/lib/game/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type MasterMode = Exclude<GameChallenge, "classic" | "night">;

const MASTER_MODES: {
  id: MasterMode;
  title: string;
  kicker: string;
  rule: string;
  reward: string;
  icon: typeof Sparkles;
  secretKey: keyof Secrets;
}[] = [
  {
    id: "festival",
    title: "Festival de las Luces",
    kicker: "Encadena el brillo",
    rule: "Alterna atracciones: cada cambio mantiene el combo y enciende más bombillas.",
    reward: "Reverso Fuegos de Feria",
    icon: Lightbulb,
    secretKey: "festivalPerfect",
  },
  {
    id: "mirror",
    title: "Parque Espejo",
    kicker: "Todo empieza al otro lado",
    rule: "Los planos aparecen reflejados. Las reglas son las mismas, pero la lectura cambia.",
    reward: "Insignia Plata de Luna",
    icon: FlipHorizontal2,
    secretKey: "mirrorPerfect",
  },
  {
    id: "storm",
    title: "Día de Tormenta",
    kicker: "Juega con el pronóstico",
    rule: "La lluvia cierra un sector cada turno. Siempre conoceréis el siguiente.",
    reward: "Reverso Nube Dorada",
    icon: CloudLightning,
    secretKey: "stormPerfect",
  },
  {
    id: "impossible",
    title: "Poker Park 00:13",
    kicker: "El parque imposible",
    rule: "Espejo, tormenta y combos de luz en una única jornada final.",
    reward: "Final verdadero y Galería Maestro",
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
  onStart: (mode: Mode, challenge: GameChallenge) => void;
}) {
  const impossibleOpen = masterTrialsComplete(secrets) || secrets.impossiblePerfect;
  const [selected, setSelected] = useState<MasterMode | null>(null);
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
                onClick={() => setSelected(mode.id)}
              >
                <span className="master-mode-icon">{locked ? <LockKeyhole /> : <Icon />}</span>
                <span className="master-mode-copy"><small>{locked ? "Entrada oculta" : mode.kicker}</small><strong>{mode.title}</strong><p>{locked ? "Completa los otros tres modos." : mode.rule}</p></span>
                <span className="master-mode-state">{complete ? <><Check /> Superado</> : locked ? "???" : "Jugar"}</span>
              </button>
            );
          })}
        </div>
        {selectedMode ? (
          <div className="master-start-panel stagger-in">
            <div><Sparkles aria-hidden /><span><small>Recompensa perfecta</small><strong>{selectedMode.reward}</strong></span></div>
            <div>
              <Button size="lg" onClick={() => onStart("hotseat", selectedMode.id)}><Users /> En pareja</Button>
              <Button size="lg" variant="secondary" onClick={() => onStart("ai", selectedMode.id)}><UserRound /> Con compañero</Button>
            </div>
          </div>
        ) : <p className="master-select-hint">Toca una entrada para consultar su recompensa y empezar.</p>}
      </section>
    </div>
  );
}
