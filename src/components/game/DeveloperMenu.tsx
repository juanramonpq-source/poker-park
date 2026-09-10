import {
  BookOpenCheck,
  Check,
  ChevronRight,
  CloudLightning,
  Code2,
  Crown,
  FerrisWheel,
  FlipHorizontal2,
  Gamepad2,
  Lightbulb,
  MoonStar,
  Palette,
  Radio,
  RotateCcw,
  SaveOff,
  Sparkles,
  Sun,
  UnlockKeyhole,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import type { SecretFlag, Secrets } from "@/lib/game/persist";
import type { GameChallenge } from "@/lib/game/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DeveloperTab = "progress" | "switches" | "tools";

const EMPTY_SECRETS: Secrets = {
  perfect: false,
  lifetime: false,
  nightPerfect: false,
  pentonuiSignal: false,
  festivalPerfect: false,
  mirrorPerfect: false,
  stormPerfect: false,
  impossiblePerfect: false,
  classicMedals: [],
};

const ALL_CLASSIC_MEDALS: GameChallenge[] = ["classic", "night", "festival", "mirror", "storm", "impossible"];

const PROGRESS_PRESETS: {
  id: string;
  title: string;
  kicker: string;
  result: string;
  icon: LucideIcon;
  secrets: Secrets;
}[] = [
  { id: "fresh", title: "Visitante nuevo", kicker: "Paso 0", result: "Solo están disponibles el parque de día y el tutorial.", icon: Sun, secrets: { ...EMPTY_SECRETS } },
  { id: "day-perfect", title: "Primer parque perfecto", kicker: "Paso 1", result: "Desbloquea La Noche de Guardia.", icon: FerrisWheel, secrets: { ...EMPTY_SECRETS, perfect: true } },
  { id: "night-perfect", title: "Guardia nocturna perfecta", kicker: "Paso 2", result: "Abre el Pase Maestro y la interfaz nocturna.", icon: MoonStar, secrets: { ...EMPTY_SECRETS, perfect: true, nightPerfect: true } },
  { id: "festival-perfect", title: "Festival superado", kicker: "Paso 3", result: "Registra el primer sello del Pase Maestro.", icon: Lightbulb, secrets: { ...EMPTY_SECRETS, perfect: true, nightPerfect: true, festivalPerfect: true } },
  { id: "mirror-perfect", title: "Parque Espejo superado", kicker: "Paso 4", result: "Añade el segundo sello del Pase Maestro.", icon: FlipHorizontal2, secrets: { ...EMPTY_SECRETS, perfect: true, nightPerfect: true, festivalPerfect: true, mirrorPerfect: true } },
  { id: "storm-perfect", title: "Tormenta superada", kicker: "Paso 5", result: "Completa los tres sellos y abre Poker Park 00:13.", icon: CloudLightning, secrets: { ...EMPTY_SECRETS, perfect: true, nightPerfect: true, festivalPerfect: true, mirrorPerfect: true, stormPerfect: true } },
  { id: "true-ending", title: "Final verdadero completado", kicker: "Paso 6", result: "Desbloquea Galería Maestro, fondos y Reverso DUAL.", icon: Crown, secrets: { ...EMPTY_SECRETS, perfect: true, nightPerfect: true, festivalPerfect: true, mirrorPerfect: true, stormPerfect: true, impossiblePerfect: true } },
  { id: "everything", title: "Colección completa", kicker: "Paso 7", result: "Activa también las seis medallas clásicas, Pase de por vida y Flor Mecánica.", icon: Sparkles, secrets: { ...EMPTY_SECRETS, perfect: true, lifetime: true, nightPerfect: true, pentonuiSignal: true, festivalPerfect: true, mirrorPerfect: true, stormPerfect: true, impossiblePerfect: true, classicMedals: ALL_CLASSIC_MEDALS } },
];

const SECRET_SWITCHES: { key: SecretFlag; title: string; note: string; icon: LucideIcon }[] = [
  { key: "perfect", title: "Parque diurno perfecto", note: "Abre La Noche de Guardia.", icon: FerrisWheel },
  { key: "nightPerfect", title: "Noche de Guardia perfecta", note: "Abre el Pase Maestro y el tema nocturno.", icon: MoonStar },
  { key: "festivalPerfect", title: "Festival de las Luces", note: "Marca el reto y su recompensa como superados.", icon: Lightbulb },
  { key: "mirrorPerfect", title: "Parque Espejo", note: "Marca el segundo reto secreto como superado.", icon: FlipHorizontal2 },
  { key: "stormPerfect", title: "Día de Tormenta", note: "Con los tres sellos abre el modo 00:13.", icon: CloudLightning },
  { key: "impossiblePerfect", title: "Final verdadero", note: "Abre Galería Maestro y el Reverso DUAL.", icon: Crown },
  { key: "lifetime", title: "Pase de por vida", note: "Muestra la insignia dorada de la portada.", icon: UnlockKeyhole },
  { key: "pentonuiSignal", title: "Señal Pentonúi", note: "Activa Flor Mecánica y la Sala de Máquinas.", icon: Radio },
];

const QUICK_MODES: { id: GameChallenge; name: string; icon: LucideIcon }[] = [
  { id: "classic", name: "Parque de día", icon: Sun },
  { id: "night", name: "Noche de Guardia", icon: MoonStar },
  { id: "festival", name: "Festival", icon: Lightbulb },
  { id: "mirror", name: "Espejo", icon: FlipHorizontal2 },
  { id: "storm", name: "Tormenta", icon: CloudLightning },
  { id: "impossible", name: "Poker Park 00:13", icon: Crown },
];

function sameSecrets(a: Secrets, b: Secrets) {
  const flagsMatch = (Object.keys(EMPTY_SECRETS).filter((key) => key !== "classicMedals") as SecretFlag[])
    .every((key) => a[key] === b[key]);
  return flagsMatch && a.classicMedals.length === b.classicMedals.length && a.classicMedals.every((mode) => b.classicMedals.includes(mode));
}

export function DeveloperMenu({
  secrets,
  tutorialSeen,
  hasSavedGame,
  onClose,
  onApplySecrets,
  onTutorialSeen,
  onClearSavedGame,
  onOpenMasterPass,
  onOpenGallery,
  onStartMode,
  onReset,
}: {
  secrets: Secrets;
  tutorialSeen: boolean;
  hasSavedGame: boolean;
  onClose: () => void;
  onApplySecrets: (secrets: Secrets) => void;
  onTutorialSeen: (seen: boolean) => void;
  onClearSavedGame: () => void;
  onOpenMasterPass: () => void;
  onOpenGallery: () => void;
  onStartMode: (challenge: GameChallenge) => void;
  onReset: () => void;
}) {
  const [tab, setTab] = useState<DeveloperTab>("progress");
  const [confirmReset, setConfirmReset] = useState(false);
  const activePreset = useMemo(() => PROGRESS_PRESETS.find((preset) => sameSecrets(preset.secrets, secrets)), [secrets]);
  const unlockCount = SECRET_SWITCHES.filter(({ key }) => secrets[key]).length;

  return (
    <div className="developer-layer" role="dialog" aria-modal="true" aria-labelledby="developer-title">
      <button type="button" className="developer-backdrop" onClick={onClose} aria-label="Cerrar menú de desarrollador" />
      <section className="developer-card">
        <header>
          <span><Code2 /></span>
          <div><small>Herramientas internas</small><h2 id="developer-title">Control de progresión</h2></div>
          <Button size="icon" variant="ghost" onClick={onClose} aria-label="Cerrar"><X /></Button>
        </header>

        <div className="developer-status" role="status">
          <span><strong>{activePreset?.kicker ?? "Manual"}</strong><small>{activePreset?.title ?? "Progreso personalizado"}</small></span>
          <span>{unlockCount}/{SECRET_SWITCHES.length} hitos</span>
        </div>

        <nav className="developer-tabs" aria-label="Secciones del menú de desarrollador">
          <button type="button" className={cn(tab === "progress" && "is-active")} onClick={() => setTab("progress")}><FerrisWheel /> Recorrido</button>
          <button type="button" className={cn(tab === "switches" && "is-active")} onClick={() => setTab("switches")}><UnlockKeyhole /> Desbloqueos</button>
          <button type="button" className={cn(tab === "tools" && "is-active")} onClick={() => setTab("tools")}><Gamepad2 /> Utilidades</button>
        </nav>

        {tab === "progress" ? (
          <div className="developer-progress-list">
            <p>Elige un punto coherente de la historia. Cada paso incluye todos los anteriores.</p>
            {PROGRESS_PRESETS.map(({ id, title, kicker, result, icon: Icon, secrets: preset }) => {
              const active = activePreset?.id === id;
              return (
                <button type="button" key={id} className={cn(active && "is-active")} onClick={() => onApplySecrets(preset)} aria-pressed={active}>
                  <span className="developer-step-icon"><Icon /></span>
                  <span><small>{kicker}</small><strong>{title}</strong><em>{result}</em></span>
                  {active ? <Check /> : <ChevronRight />}
                </button>
              );
            })}
          </div>
        ) : null}

        {tab === "switches" ? (
          <div className="developer-switch-list">
            <p>Activa o desactiva cualquier hallazgo por separado. Puede crear combinaciones que no aparecen en una partida normal.</p>
            {SECRET_SWITCHES.map(({ key, title, note, icon: Icon }) => (
              <button type="button" key={key} className={cn(secrets[key] && "is-active")} onClick={() => onApplySecrets({ ...secrets, [key]: !secrets[key] })} aria-pressed={secrets[key]}>
                <span><Icon /></span>
                <span><strong>{title}</strong><small>{note}</small></span>
                <i aria-hidden><span /></i>
              </button>
            ))}
          </div>
        ) : null}

        {tab === "tools" ? (
          <div className="developer-tools">
            <section>
              <h3><Gamepad2 /> Inicio rápido con CPU</h3>
              <p>Entra directamente en cualquier modo. Las reglas y la baraja son las reales.</p>
              <div className="developer-mode-grid">
                {QUICK_MODES.map(({ id, name, icon: Icon }) => <button type="button" key={id} onClick={() => onStartMode(id)}><Icon /><span>{name}</span></button>)}
              </div>
            </section>

            <section>
              <h3><Palette /> Pantallas secretas</h3>
              <div className="developer-screen-links">
                <button type="button" onClick={onOpenMasterPass}><Crown /><span><strong>Abrir Pase Maestro</strong><small>Comprueba bloqueos, sellos y recompensas.</small></span><ChevronRight /></button>
                <button type="button" onClick={onOpenGallery}><Palette /><span><strong>Abrir Galería Maestro</strong><small>Prueba fondos y todos los reversos.</small></span><ChevronRight /></button>
              </div>
            </section>

            <section>
              <h3><SaveOff /> Estado del dispositivo</h3>
              <div className="developer-device-actions">
                <button type="button" className={cn(tutorialSeen && "is-active")} onClick={() => onTutorialSeen(!tutorialSeen)} aria-pressed={tutorialSeen}>
                  <BookOpenCheck /><span><strong>Tutorial visto</strong><small>{tutorialSeen ? "La próxima partida empieza directamente." : "La próxima partida vuelve a preguntar."}</small></span><i aria-hidden><span /></i>
                </button>
                <button type="button" onClick={onClearSavedGame} disabled={!hasSavedGame}>
                  <SaveOff /><span><strong>Eliminar solo la partida guardada</strong><small>{hasSavedGame ? "Mantiene todos los hitos y recompensas." : "No hay ninguna partida pendiente."}</small></span>
                </button>
              </div>
            </section>

            <section className="developer-danger-zone">
              <h3><RotateCcw /> Acciones globales</h3>
              <div className="developer-global-actions">
                <button type="button" onClick={() => onApplySecrets(PROGRESS_PRESETS.at(-1)!.secrets)}><Sparkles /><span><strong>Desbloquear absolutamente todo</strong><small>Aplica el último paso del recorrido.</small></span></button>
                <button type="button" className="is-danger" onClick={() => setConfirmReset(true)}><RotateCcw /><span><strong>Resetear Poker Park</strong><small>Borra partida, tutorial, secretos, ajustes e insignias.</small></span></button>
              </div>
              {confirmReset ? (
                <div className="developer-confirm">
                  <p>¿Volver al juego completamente nuevo?</p>
                  <div><Button variant="secondary" onClick={() => setConfirmReset(false)}>Cancelar</Button><Button onClick={onReset}>Sí, resetear</Button></div>
                </div>
              ) : null}
            </section>
          </div>
        ) : null}
      </section>
    </div>
  );
}
