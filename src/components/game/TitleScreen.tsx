import { BookOpen, FerrisWheel, MoonStar, Sparkles, Users, UserRound, Wrench, X } from "lucide-react";
import { useEffect, useState } from "react";
import { startTitleBed, unlockAudio } from "@/lib/game/audio";
import { loadSecrets, type Secrets } from "@/lib/game/persist";
import type { GameChallenge, Mode } from "@/lib/game/types";
import { Button } from "@/components/ui/button";
import { useGameStore } from "@/store/game-store";

function Motes() {
  return (
    <div className="park-motes" aria-hidden>
      {Array.from({ length: 14 }, (_, i) => (
        <span key={i} style={{ ["--i" as string]: String(i) }} />
      ))}
    </div>
  );
}

const TUTORIAL_SEEN_KEY = "poker-park-tutorial-seen";

export function TitleScreen() {
  const start = useGameStore((s) => s.start);
  const resume = useGameStore((s) => s.resume);
  const game = useGameStore((s) => s.game);
  const setRulesOpen = useGameStore((s) => s.setRulesOpen);
  const nightTheme = useGameStore((s) => s.nightTheme);
  const toggleNightTheme = useGameStore((s) => s.toggleNightTheme);
  const canResume = Boolean(game && !game.ended);
  const [secrets, setSecrets] = useState<Secrets>({ perfect: false, lifetime: false, nightPerfect: false, pentonuiSignal: false });
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [tutorialChoiceOpen, setTutorialChoiceOpen] = useState(false);
  const [nightModeOpen, setNightModeOpen] = useState(false);
  const [pendingMode, setPendingMode] = useState<Mode | null>(null);
  const [pendingChallenge, setPendingChallenge] = useState<GameChallenge>("classic");

  useEffect(() => setSecrets(loadSecrets()), []);

  const wake = () => {
    unlockAudio();
    startTitleBed();
  };

  const tutorialSeen = () =>
    typeof window !== "undefined" && window.localStorage.getItem(TUTORIAL_SEEN_KEY) === "true";

  const rememberTutorialChoice = () => {
    window.localStorage.setItem(TUTORIAL_SEEN_KEY, "true");
  };

  const requestStart = (mode: Mode, challenge: GameChallenge = "classic") => {
    wake();
    if (tutorialSeen()) {
      start(mode, challenge);
      return;
    }
    setPendingMode(mode);
    setPendingChallenge(challenge);
    setTutorialChoiceOpen(true);
  };

  const skipTutorial = () => {
    if (!pendingMode) return;
    rememberTutorialChoice();
    const mode = pendingMode;
    setPendingMode(null);
    setTutorialChoiceOpen(false);
    start(mode, pendingChallenge);
  };

  const showTutorial = () => {
    setTutorialChoiceOpen(false);
    setTutorialOpen(true);
  };

  const finishTutorial = () => {
    setTutorialOpen(false);
    if (!pendingMode) return;
    rememberTutorialChoice();
    const mode = pendingMode;
    setPendingMode(null);
    start(mode, pendingChallenge);
  };

  return (
    <main
      className="title-screen fixed inset-0 h-dvh overflow-hidden bg-bg text-fg"
      onPointerDown={wake}
    >
      <picture className="title-cover-picture" aria-hidden="true">
        <source media="(min-width: 768px)" srcSet="/images/park-cover-desktop.webp" />
        <img
          src="/images/park-cover.webp"
          alt=""
          className="title-cover"
        />
      </picture>
      <div className="title-vignette" />
      <Motes />
      <div className="title-studio-badge" aria-label="Poker Park por Pentonúi Games">
        <img src="/brand/pentonui-games-icon.png" alt="" />
        <span>
          <small>Una producción de</small>
          <strong>Pentonúi Games</strong>
        </span>
      </div>

      <div className="title-shell">
        <div className="title-hero">
          <div className="title-eyebrow">
            <FerrisWheel className={secrets.perfect ? "size-5 text-accent" : "size-5"} strokeWidth={1.5} />
            <span>Juego de cartas</span>
          </div>

          <h1 className="title-name">
            Poker Park
          </h1>
          <p className="title-description">
            Un día de feria, cartas al sol y atracciones para montar en compañía.
          </p>
          <p className="title-detail">Cooperativo · 2 jugadores · Una baraja</p>
          {secrets.lifetime ? (
            <div className="title-lifetime-badge" role="status" aria-label="Insignia conseguida: Pase de por vida">
              <span className="title-lifetime-seal"><FerrisWheel aria-hidden /></span>
              <span>
                <small>Insignia conseguida</small>
                <strong>Pase de por vida</strong>
              </span>
              <Sparkles aria-hidden />
            </div>
          ) : null}
          {secrets.nightPerfect ? (
            <button type="button" className="title-night-toggle" onClick={toggleNightTheme}>
              <MoonStar aria-hidden />
              {nightTheme ? "Volver a la luz del día" : "Activar interfaz nocturna"}
            </button>
          ) : null}
        </div>

        <div className="title-panel stagger-in">
          <p className="title-menu-kicker">Elige cómo recorrer el parque</p>
          <div className="title-actions">
            <Button size="lg" className="w-full" onClick={() => requestStart("hotseat")}>
              <Users className="size-4" strokeWidth={1.75} />
              Jugar en pareja
            </Button>
            <Button size="lg" variant="secondary" className="w-full" onClick={() => requestStart("ai")}>
              <UserRound className="size-4" strokeWidth={1.75} />
              Jugar con compañero
            </Button>
            {secrets.perfect ? (
              <button type="button" className="night-challenge-button" onClick={() => setNightModeOpen(true)}>
                <span><MoonStar aria-hidden /></span>
                <span><small>Reto desbloqueado</small><strong>La Noche de Guardia</strong></span>
                <Wrench aria-hidden />
              </button>
            ) : (
              <p className="night-challenge-hint">Completa las 7 atracciones para descubrir un nuevo turno.</p>
            )}
            {canResume ? (
              <Button size="md" variant="ghost" className="w-full" onClick={resume}>
                {game?.challenge === "night" ? "Continuar la guardia" : "Continuar la jornada"}
              </Button>
            ) : null}
            <div className="title-secondary-actions">
              <button type="button" onClick={() => setTutorialOpen(true)} className="title-text-action">
                <Sparkles className="size-4" strokeWidth={1.7} />
                Tutorial rápido
              </button>
              <button type="button" onClick={() => setRulesOpen(true)} className="title-text-action">
                <BookOpen className="size-4" strokeWidth={1.7} />
                Reglas completas
              </button>
            </div>
          </div>
        </div>
      </div>
      {nightModeOpen ? (
        <div className="tutorial-overlay" role="dialog" aria-modal="true" aria-labelledby="night-mode-title">
          <button className="tutorial-backdrop" type="button" aria-label="Cerrar reto nocturno" onClick={() => setNightModeOpen(false)} />
          <section className="tutorial-card night-mode-card">
            <div className="night-mode-icon"><MoonStar aria-hidden /></div>
            <p className="tutorial-kicker">Turno especial · 00:07</p>
            <h2 id="night-mode-title">La Noche de Guardia</h2>
            <p className="tutorial-choice-copy">El parque ha cerrado. Ahora sois el personal de mantenimiento: empezáis con solo dos sectores encendidos y cada revisión devuelve la corriente a una nueva atracción.</p>
            <div className="night-mode-rules">
              <span><Wrench aria-hidden /> 2 atracciones abiertas</span>
              <span><Sparkles aria-hidden /> Nuevos sectores al completar</span>
            </div>
            <div className="tutorial-choice-actions">
              <Button size="lg" className="w-full" onClick={() => { setNightModeOpen(false); requestStart("hotseat", "night"); }}><Users /> Guardia en pareja</Button>
              <Button size="lg" variant="secondary" className="w-full" onClick={() => { setNightModeOpen(false); requestStart("ai", "night"); }}><UserRound /> Guardia con compañero</Button>
            </div>
          </section>
        </div>
      ) : null}
      {tutorialChoiceOpen ? (
        <div className="tutorial-overlay" role="dialog" aria-modal="true" aria-labelledby="tutorial-choice-title">
          <button className="tutorial-backdrop" type="button" aria-label="Cerrar pregunta de tutorial" onClick={() => setTutorialChoiceOpen(false)} />
          <section className="tutorial-card tutorial-choice-card">
            <p className="tutorial-kicker">Primera partida</p>
            <h2 id="tutorial-choice-title">¿Quieres saltarte el tutorial?</h2>
            <p className="tutorial-choice-copy">Dura menos de un minuto y explica lo esencial. Siempre podrás consultarlo después.</p>
            <div className="tutorial-choice-actions">
              <Button size="lg" variant="secondary" className="w-full" onClick={showTutorial}>No, ver tutorial</Button>
              <Button size="lg" className="w-full" onClick={skipTutorial}>Sí, jugar ya</Button>
            </div>
          </section>
        </div>
      ) : null}
      {tutorialOpen ? (
        <div className="tutorial-overlay" role="dialog" aria-modal="true" aria-labelledby="tutorial-title">
          <button className="tutorial-backdrop" type="button" aria-label="Cerrar tutorial" onClick={() => setTutorialOpen(false)} />
          <section className="tutorial-card">
            <div className="tutorial-heading">
              <div>
                <p className="tutorial-kicker">En menos de un minuto</p>
                <h2 id="tutorial-title">Tu primera vuelta</h2>
              </div>
              <Button size="icon" variant="ghost" onClick={() => setTutorialOpen(false)} aria-label="Cerrar tutorial">
                <X className="size-4" />
              </Button>
            </div>
            <ol className="tutorial-steps">
              <li><span>1</span><p><strong>Robad y hablad.</strong> Es un juego colaborativo: cada jugador tiene su propia mano y decidís juntos dónde encaja cada carta.</p></li>
              <li><span>2</span><p><strong>Tocad una atracción.</strong> Veréis su forma y las posiciones válidas para la carta elegida.</p></li>
              <li><span>3</span><p><strong>Guardad los cambios.</strong> Solo hay tres para toda la jornada; usadlos cuando desbloqueen una atracción.</p></li>
            </ol>
            <Button size="lg" className="mt-5 w-full" onClick={finishTutorial}>
              {pendingMode ? "Empezar partida" : "¡Entendido!"}
            </Button>
          </section>
        </div>
      ) : null}
    </main>
  );
}
