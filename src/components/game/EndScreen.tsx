import { Download, MoonStar, Radio, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import {
  completedAttractions,
  dayBadges,
  dayRating,
  ratingCopy,
  RATING_SCALE,
  type DayBadge,
} from "@/lib/game/engine";
import { ATTRACTION_DEFS } from "@/lib/game/attractions";
import { playParty, playRollCrash, playRollFill, playRollTick } from "@/lib/game/audio";
import { loadSecrets, unlockSecret } from "@/lib/game/persist";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useGameStore } from "@/store/game-store";

const NIGHT_SCALE = [
  "Sin corriente", "Primera comprobación", "Sector asegurado", "Guardia en marcha",
  "Turno estable", "Parque bajo control", "Apertura casi lista", "Apertura autorizada",
];

function nightCopy(count: number) {
  if (count === 7) return {
    title: "La octava luz",
    body: "Todas las atracciones responden. Cuando el cielo empieza a aclarar, la noria enciende una luz que no figura en ningún plano: el parque os reconoce como sus Guardianes del Alba.",
  };
  if (count >= 5) return { title: "Parque bajo control", body: "El parte de mantenimiento queda casi completo. Habéis dejado la apertura de mañana muy cerca." };
  if (count >= 3) return { title: "Guardia en marcha", body: "Varias zonas vuelven a latir en la oscuridad. El equipo del amanecer sabrá por dónde continuar." };
  if (count >= 1) return { title: "Primera comprobación", body: "Una luz encendida basta para demostrar que la noche todavía puede remontar." };
  return { title: "Sin corriente", body: "El turno fue difícil. El parque descansará esta noche y volveréis con nuevas herramientas." };
}

function maintenanceBadges(count: number, emergencyUses: number): DayBadge[] {
  const badges: DayBadge[] = [];
  if (count >= 1) badges.push({ id: "torch", name: "Linterna en servicio", hint: "Primera revisión firmada." });
  if (count >= 3) badges.push({ id: "round", name: "Ronda de seguridad", hint: "Tres sectores comprobados." });
  if (count >= 5) badges.push({ id: "master", name: "Llave maestra", hint: "El parque vuelve a responder." });
  if (count === 7) badges.push({ id: "dawn", name: "Guardianes del Alba", hint: "Apertura autorizada.", secret: true });
  badges.push(emergencyUses === 0
    ? { id: "clean", name: "Parte impecable", hint: "Sin usar el generador.", secret: true }
    : { id: "generator", name: "Generador en marcha", hint: `${emergencyUses} incidencia${emergencyUses === 1 ? " resuelta" : "s resueltas"}.`, secret: true });
  return badges;
}

export function EndScreen() {
  const game = useGameStore((s) => s.game);
  const quitToTitle = useGameStore((s) => s.quitToTitle);
  const pulse = useGameStore((s) => s.pulse);
  const nightTheme = useGameStore((s) => s.nightTheme);
  const toggleNightTheme = useGameStore((s) => s.toggleNightTheme);
  const unlockMachineRoom = useGameStore((s) => s.unlockMachineRoom);
  const [step, setStep] = useState<"splash" | "tally" | "credits">("splash");
  const [shown, setShown] = useState(0);
  const [resolved, setResolved] = useState(false);
  const [pop, setPop] = useState(0);
  const [taps, setTaps] = useState(0);
  const [brandTaps, setBrandTaps] = useState(0);
  const [machineRoomOpen, setMachineRoomOpen] = useState(false);
  const [lifetime, setLifetime] = useState(() => loadSecrets().lifetime);
  const [nightReward, setNightReward] = useState(() => loadSecrets().nightPerfect);
  const done = game ? completedAttractions(game) : [];
  const isNight = game?.challenge === "night";
  const rating = dayRating(done.length);
  const copy = isNight ? nightCopy(done.length) : ratingCopy(rating);
  const badges = game ? (isNight ? maintenanceBadges(done.length, game.night?.emergencyUses ?? 0) : dayBadges(game)) : [];
  const perfect = rating === "perfect";
  const scale = isNight ? NIGHT_SCALE : RATING_SCALE.map((row) => row.title);

  useEffect(() => {
    const t = window.setTimeout(() => setStep("tally"), 1600);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (step !== "tally") return;
    playRollFill(0.62);
    const timers: number[] = [];
    let i = 0;
    const tick = () => {
      if (i < done.length) {
        i += 1;
        setShown(i);
        setPop(i);
        playRollTick(i);
        timers.push(window.setTimeout(tick, Math.max(220, 420 - i * 28)));
        return;
      }
      playRollFill(0.48);
      timers.push(window.setTimeout(() => {
        playRollCrash(done.length);
        setResolved(true);
        if (perfect) {
          unlockSecret(isNight ? "nightPerfect" : "perfect");
          if (isNight) setNightReward(true);
          playParty();
          pulse("end");
          timers.push(window.setTimeout(() => pulse("end"), 800));
        }
      }, 520));
    };
    timers.push(window.setTimeout(tick, done.length === 0 ? 640 : 680));
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [step, done.length, perfect, isNight, pulse]);

  if (!game) return null;

  const onTapScale = () => {
    if (isNight) return;
    const next = taps + 1;
    setTaps(next);
    if (next >= 7 && !lifetime) {
      unlockSecret("lifetime");
      setLifetime(true);
    }
  };

  const onBrandTap = () => {
    const next = brandTaps + 1;
    if (next >= 3) {
      setBrandTaps(0);
      unlockMachineRoom();
      setMachineRoomOpen(true);
      return;
    }
    setBrandTaps(next);
  };

  if (step === "splash") {
    return (
      <main className="end-splash grid min-h-dvh place-items-center bg-bg px-6 text-center text-fg">
        <div className="stagger-in">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-accent">{isNight ? "Parte 00:07" : "Poker Park"}</p>
          <h1 className="mt-3 font-display text-4xl font-medium tracking-tight">{isNight ? "Fin del turno de guardia" : "Fin de la jornada en el parque"}</h1>
        </div>
      </main>
    );
  }

  if (step === "credits") {
    return (
      <main className="end-credits relative grid min-h-dvh place-items-center overflow-hidden bg-bg px-6 pb-10 text-center text-fg">
        {perfect ? <div className="fireworks" aria-hidden /> : null}
        <div className="stagger-in relative z-10 max-w-sm">
          <p className="font-display text-3xl font-medium tracking-tight">Fin</p>
          <p className="mt-2 text-lg text-muted">{isNight ? "El parque puede dormir tranquilo." : "Gracias por jugar."}</p>
          <button type="button" className="end-brand end-brand-button" onClick={onBrandTap} aria-label="Pentonúi Games">
            <img src="/brand/pentonui-games-logo.webp" alt="Pentonúi Games" />
            <p>Creado por Pentonúi Games</p>
          </button>
          {lifetime ? <p className="mt-4 rounded-xl border border-accent/40 bg-accent/10 px-3 py-2 text-[12px] text-accent">Pase de por vida desbloqueado. La noria te espera en la entrada.</p> : null}
          <Button size="lg" className="mt-8 w-full" onClick={quitToTitle}>Volver al inicio</Button>
        </div>
        {machineRoomOpen ? (
          <div className="machine-room-secret" role="dialog" aria-modal="true" aria-labelledby="machine-room-title">
            <div className="machine-rings" aria-hidden><span /><span /><span /></div>
            <div className="machine-secret-card stagger-in">
              <img src="/brand/pentonui-games-icon.png" alt="" />
              <p>Protocolo P·3 · Señal recibida</p>
              <h2 id="machine-room-title">La Sala de Máquinas te ha reconocido</h2>
              <blockquote>“Hay parques que cierran. Este solo apaga las luces para poder soñar.”</blockquote>
              <div className="machine-code"><Radio aria-hidden /> 03:17 · IMAGINACIÓN EN SERVICIO</div>
              <p className="machine-reward"><Sparkles aria-hidden /> Reverso Flor Mecánica desbloqueado para todas tus cartas.</p>
              <Button size="lg" className="w-full" onClick={() => setMachineRoomOpen(false)}>Mantener la luz encendida</Button>
            </div>
          </div>
        ) : null}
      </main>
    );
  }

  const currentTitle = scale[shown] ?? scale[0]!;

  return (
    <main className="end-tally relative min-h-dvh overflow-y-auto bg-bg pb-10 text-fg">
      {perfect && resolved ? <div className="fireworks" aria-hidden /> : null}
      <div className="relative mx-auto max-w-md px-5 pt-[max(2.5rem,env(safe-area-inset-top))]">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">{isNight ? "Informe de mantenimiento" : "Recuento del día"}</p>
        <button type="button" onClick={onTapScale} className="mt-3 w-full text-left">
          <p key={pop} className="count-pop font-display text-7xl font-medium leading-none tracking-tight text-accent">{shown}<span className="ml-1 text-2xl text-muted">/ 7</span></p>
          <p className="mt-2 font-display text-xl text-fg">{currentTitle}</p>
        </button>

        <ol className="mt-4 space-y-1.5">
          {scale.map((title, count) => (
            <li key={count} className={cn("flex items-center justify-between rounded-lg px-2.5 py-1.5 text-[12px] transition-colors duration-200", count === shown ? "scale-[1.02] bg-accent text-accent-fg" : count < shown ? "bg-good/15 text-good" : "bg-surface text-faint")}>
              <span>{count} {isNight ? "revisiones" : "vueltas"}</span><span className="font-medium">{title}</span>
            </li>
          ))}
        </ol>

        {shown > 0 ? <ul className="mt-4 flex flex-wrap gap-1.5">{done.slice(0, shown).map((id) => <li key={id} className="settle rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] text-muted">{ATTRACTION_DEFS[id].name}</li>)}</ul> : null}

        {resolved ? (
          <div className="stagger-in">
            <h1 className="mt-6 font-display text-3xl font-medium tracking-tight">{copy.title}</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted">{copy.body}</p>
            <h2 className="mt-6 font-display text-lg">{isNight ? "Acreditaciones" : "Insignias"}</h2>
            <ul className="mt-2 grid grid-cols-2 gap-2">{badges.map((badge) => <li key={badge.id} className={cn("rounded-xl border px-3 py-2", badge.secret ? "border-accent/35 bg-accent/8" : "border-border bg-surface")}><p className="text-[12px] font-semibold text-fg">{badge.name}</p><p className="mt-0.5 text-[10px] leading-snug text-muted">{badge.hint}</p></li>)}</ul>
            {isNight && perfect && nightReward ? (
              <section className="night-reward-card">
                <div><ShieldCheck aria-hidden /><span><small>Secreto completado</small><strong>La octava luz</strong></span></div>
                <p>Tu acreditación de Guardián del Alba incluye dos recompensas.</p>
                <a href="/images/poker-park-night-wallpaper.webp" download="Poker-Park-Guardianes-del-Alba.webp"><Download aria-hidden /> Descargar fondo para móvil</a>
                <button type="button" onClick={toggleNightTheme}><MoonStar aria-hidden /> {nightTheme ? "Desactivar interfaz nocturna" : "Activar interfaz nocturna"}</button>
              </section>
            ) : !isNight ? (lifetime ? <p className="mt-4 text-center text-[12px] text-accent">Secreto: pase de por vida. La noria no se olvida de vosotros.</p> : <p className="mt-4 text-center text-[10px] text-faint">Pista secreta: toca siete veces el número del recuento.</p>) : null}
            <Button size="lg" className="mt-6 w-full" onClick={() => setStep("credits")}>Ver créditos</Button>
          </div>
        ) : <p className="mt-8 text-center text-sm text-muted">{isNight ? "Sellando el parte…" : "Redoble…"}</p>}
      </div>
    </main>
  );
}
