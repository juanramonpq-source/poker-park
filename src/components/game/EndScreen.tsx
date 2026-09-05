import { useEffect, useState } from "react";
import {
  completedAttractions,
  dayBadges,
  dayRating,
  ratingCopy,
  RATING_SCALE,
} from "@/lib/game/engine";
import { ATTRACTION_DEFS } from "@/lib/game/attractions";
import { playParty, playRollCrash, playRollFill, playRollTick } from "@/lib/game/audio";
import { loadSecrets, unlockSecret } from "@/lib/game/persist";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useGameStore } from "@/store/game-store";

export function EndScreen() {
  const game = useGameStore((s) => s.game);
  const quitToTitle = useGameStore((s) => s.quitToTitle);
  const pulse = useGameStore((s) => s.pulse);
  const [step, setStep] = useState<"splash" | "tally" | "credits">("splash");
  const [shown, setShown] = useState(0);
  const [resolved, setResolved] = useState(false);
  const [pop, setPop] = useState(0);
  const [taps, setTaps] = useState(0);
  const [lifetime, setLifetime] = useState(() => loadSecrets().lifetime);
  const done = game ? completedAttractions(game) : [];
  const rating = dayRating(done.length);
  const copy = ratingCopy(rating);
  const badges = game ? dayBadges(game) : [];
  const perfect = rating === "perfect";

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
      timers.push(
        window.setTimeout(() => {
          playRollCrash(done.length);
          setResolved(true);
          if (perfect) {
            unlockSecret("perfect");
            playParty();
            pulse("end");
            timers.push(window.setTimeout(() => pulse("end"), 800));
          }
        }, 520),
      );
    };
    timers.push(window.setTimeout(tick, done.length === 0 ? 640 : 680));
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [step, done.length, perfect, pulse]);

  if (!game) return null;

  const onTapScale = () => {
    const next = taps + 1;
    setTaps(next);
    if (next >= 7 && !lifetime) {
      unlockSecret("lifetime");
      setLifetime(true);
    }
  };

  if (step === "splash") {
    return (
      <main className="grid min-h-dvh place-items-center bg-bg px-6 text-center text-fg">
        <div className="stagger-in">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-accent">Poker Park</p>
          <h1 className="mt-3 font-display text-4xl font-medium tracking-tight">
            Fin de la jornada en el parque
          </h1>
        </div>
      </main>
    );
  }

  if (step === "credits") {
    return (
      <main className="relative grid min-h-dvh place-items-center overflow-hidden bg-bg px-6 pb-10 text-center text-fg">
        {perfect ? <div className="fireworks" aria-hidden /> : null}
        <div className="stagger-in relative z-10 max-w-sm">
          <p className="font-display text-3xl font-medium tracking-tight">Fin</p>
          <p className="mt-2 text-lg text-muted">Gracias por jugar.</p>
          <div className="end-brand">
            <img src="/brand/pentonui-games-logo.webp" alt="Pentonúi Games" />
            <p>Creado por Pentonúi Games</p>
          </div>
          {lifetime ? (
            <p className="mt-4 rounded-xl border border-accent/40 bg-accent/10 px-3 py-2 text-[12px] text-accent">
              Pase de por vida desbloqueado. La noria te espera en la entrada.
            </p>
          ) : null}
          <Button size="lg" className="mt-8 w-full" onClick={quitToTitle}>
            Volver al inicio
          </Button>
        </div>
      </main>
    );
  }

  const currentTitle = RATING_SCALE[shown]?.title ?? RATING_SCALE[0]!.title;

  return (
    <main className="relative min-h-dvh overflow-y-auto bg-bg pb-10 text-fg">
      {perfect && resolved ? <div className="fireworks" aria-hidden /> : null}
      <div className="relative mx-auto max-w-md px-5 pt-[max(2.5rem,env(safe-area-inset-top))]">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
          Recuento del día
        </p>
        <button type="button" onClick={onTapScale} className="mt-3 w-full text-left">
          <p key={pop} className="count-pop font-display text-7xl font-medium leading-none tracking-tight text-accent">
            {shown}
            <span className="ml-1 text-2xl text-muted">/ 7</span>
          </p>
          <p className="mt-2 font-display text-xl text-fg">{currentTitle}</p>
        </button>

        <ol className="mt-4 space-y-1.5">
          {RATING_SCALE.map((row) => (
            <li
              key={row.count}
              className={cn(
                "flex items-center justify-between rounded-lg px-2.5 py-1.5 text-[12px] transition-colors duration-200",
                row.count === shown
                  ? "scale-[1.02] bg-accent text-accent-fg"
                  : row.count < shown
                    ? "bg-good/15 text-good"
                    : "bg-surface text-faint",
              )}
            >
              <span>{row.count} vueltas</span>
              <span className="font-medium">{row.title}</span>
            </li>
          ))}
        </ol>

        {shown > 0 ? (
          <ul className="mt-4 flex flex-wrap gap-1.5">
            {done.slice(0, shown).map((id) => (
              <li
                key={id}
                className="settle rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] text-muted"
              >
                {ATTRACTION_DEFS[id].name}
              </li>
            ))}
          </ul>
        ) : null}

        {resolved ? (
          <div className="stagger-in">
            <h1 className="mt-6 font-display text-3xl font-medium tracking-tight">{copy.title}</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted">{copy.body}</p>
            <h2 className="mt-6 font-display text-lg">Insignias</h2>
            <ul className="mt-2 grid grid-cols-2 gap-2">
              {badges.map((badge) => (
                <li
                  key={badge.id}
                  className={cn(
                    "rounded-xl border px-3 py-2",
                    badge.secret ? "border-accent/35 bg-accent/8" : "border-border bg-surface",
                  )}
                >
                  <p className="text-[12px] font-semibold text-fg">{badge.name}</p>
                  <p className="mt-0.5 text-[10px] leading-snug text-muted">{badge.hint}</p>
                </li>
              ))}
            </ul>
            {lifetime ? (
              <p className="mt-4 text-center text-[12px] text-accent">
                Secreto: pase de por vida. La noria no se olvida de vosotros.
              </p>
            ) : (
              <p className="mt-4 text-center text-[10px] text-faint">Hay un secreto en el recuento.</p>
            )}
            <Button size="lg" className="mt-6 w-full" onClick={() => setStep("credits")}>
              Fin
            </Button>
          </div>
        ) : (
          <p className="mt-8 text-center text-sm text-muted">Redoble…</p>
        )}
      </div>
    </main>
  );
}
