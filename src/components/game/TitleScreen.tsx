import { BookOpen, Crown, FerrisWheel, MoonStar, Palette, ShieldCheck, Sparkles, Users, UserRound, Wrench, X } from "lucide-react";
import { useEffect, useState } from "react";
import { playLifetimeUnlock, playUi, startChallengeBed, startTitleBed, unlockAudio } from "@/lib/game/audio";
import {
  clearGame,
  loadSecrets,
  resetPokerParkProgress,
  saveSecrets,
  type Secrets,
} from "@/lib/game/persist";
import type { GameChallenge, GameDifficulty, Mode } from "@/lib/game/types";
import { exchangeLimit } from "@/lib/game/engine";
import { Button } from "@/components/ui/button";
import { useGameStore } from "@/store/game-store";
import { MasterPassOverlay } from "@/components/game/MasterPassOverlay";
import { DeveloperMenu } from "@/components/game/DeveloperMenu";
import { MasterGallery } from "@/components/game/MasterGallery";
import { CHALLENGE_BACKGROUNDS } from "@/lib/game/challenges";
import { MenuMascots } from "@/components/game/ParkMascots";
import { LegalSheet } from "@/components/game/LegalSheet";

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
  const hydrate = useGameStore((s) => s.hydrate);
  const showcaseTheme = useGameStore((s) => s.showcaseTheme);
  const setShowcaseTheme = useGameStore((s) => s.setShowcaseTheme);
  const cardBack = useGameStore((s) => s.cardBack);
  const setCardBack = useGameStore((s) => s.setCardBack);
  const canResume = Boolean(game && !game.ended);
  const [secrets, setSecrets] = useState<Secrets>({
    perfect: false,
    lifetime: false,
    nightPerfect: false,
    pentonuiSignal: false,
    festivalPerfect: false,
    mirrorPerfect: false,
    stormPerfect: false,
    impossiblePerfect: false,
  });
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [tutorialChoiceOpen, setTutorialChoiceOpen] = useState(false);
  const [nightModeOpen, setNightModeOpen] = useState(false);
  const [masterPassOpen, setMasterPassOpen] = useState(false);
  const [developerOpen, setDeveloperOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [legalOpen, setLegalOpen] = useState(false);
  const [tutorialComplete, setTutorialComplete] = useState(false);
  const [studioTaps, setStudioTaps] = useState(0);
  const [pendingMode, setPendingMode] = useState<Mode | null>(null);
  const [pendingChallenge, setPendingChallenge] = useState<GameChallenge>("classic");
  const [pendingDifficulty, setPendingDifficulty] = useState<GameDifficulty>("standard");
  const [dayDifficulty, setDayDifficulty] = useState<GameDifficulty>("standard");

  useEffect(() => {
    setSecrets(loadSecrets());
    setTutorialComplete(window.localStorage.getItem(TUTORIAL_SEEN_KEY) === "true");
  }, []);

  const wake = () => {
    unlockAudio();
    if (showcaseTheme === "classic") startTitleBed();
    else startChallengeBed(showcaseTheme);
  };

  const tutorialSeen = () =>
    typeof window !== "undefined" && window.localStorage.getItem(TUTORIAL_SEEN_KEY) === "true";

  const rememberTutorialChoice = () => {
    window.localStorage.setItem(TUTORIAL_SEEN_KEY, "true");
    setTutorialComplete(true);
  };

  const requestStart = (
    mode: Mode,
    challenge: GameChallenge = "classic",
    difficulty: GameDifficulty = challenge === "classic" ? dayDifficulty : "standard",
  ) => {
    wake();
    if (tutorialSeen()) {
      start(mode, challenge, difficulty);
      return;
    }
    setPendingMode(mode);
    setPendingChallenge(challenge);
    setPendingDifficulty(difficulty);
    setTutorialChoiceOpen(true);
  };

  const skipTutorial = () => {
    if (!pendingMode) return;
    rememberTutorialChoice();
    const mode = pendingMode;
    setPendingMode(null);
    setTutorialChoiceOpen(false);
    start(mode, pendingChallenge, pendingDifficulty);
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
    start(mode, pendingChallenge, pendingDifficulty);
  };

  const tapStudio = () => {
    const next = studioTaps + 1;
    if (next >= 5) {
      setStudioTaps(0);
      setDeveloperOpen(true);
      playLifetimeUnlock();
      return;
    }
    setStudioTaps(next);
  };

  const applyDeveloperSecrets = (next: Secrets) => {
    saveSecrets(next);
    setSecrets(next);
    hydrate();
    playUi();
  };

  const setDeveloperTutorialSeen = (seen: boolean) => {
    if (seen) window.localStorage.setItem(TUTORIAL_SEEN_KEY, "true");
    else window.localStorage.removeItem(TUTORIAL_SEEN_KEY);
    setTutorialComplete(seen);
    playUi();
  };

  const clearSavedRun = () => {
    clearGame();
    hydrate();
    playUi();
  };

  const startDeveloperMode = (challenge: GameChallenge) => {
    setDeveloperOpen(false);
    wake();
    start("ai", challenge);
  };

  const resetEverything = () => {
    resetPokerParkProgress();
    window.location.reload();
  };

  const startMasterMode = (mode: Mode, challenge: GameChallenge) => {
    setMasterPassOpen(false);
    requestStart(mode, challenge);
  };

  const cover = showcaseTheme === "classic"
    ? (secrets.impossiblePerfect ? "/images/park-impossible.webp" : "/images/park-cover.webp")
    : CHALLENGE_BACKGROUNDS[showcaseTheme];
  const desktopCover = showcaseTheme === "classic" && !secrets.impossiblePerfect
    ? "/images/park-cover-desktop.webp"
    : cover;

  return (
    <main
      className="title-screen fixed inset-0 h-dvh overflow-hidden bg-bg text-fg"
      onPointerDown={wake}
    >
      <picture className="title-cover-picture" aria-hidden="true">
        <source media="(min-width: 768px)" srcSet={desktopCover} />
        <img
          src={cover}
          alt=""
          className="title-cover"
        />
      </picture>
      <div className="title-vignette" />
      <Motes />
      <button type="button" className="title-studio-badge" aria-label="Poker Park por Pentonúi Games" onClick={tapStudio}>
        <img src="/brand/pentonui-games-icon.png" alt="" />
        <span>
          <small>Una producción de</small>
          <strong>Pentonúi Games</strong>
        </span>
      </button>

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
            Montad en las atracciones del parque, guiados por la baraja francesa y en compañía.
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
            <div className="day-difficulty-selector" role="group" aria-label="Dificultad de la jornada de día">
              <button
                type="button"
                className={dayDifficulty === "standard" ? "is-selected" : undefined}
                aria-pressed={dayDifficulty === "standard"}
                onClick={() => setDayDifficulty("standard")}
              >
                <span>Clásico</span><small>3 cambios</small>
              </button>
              <button
                type="button"
                className={dayDifficulty === "easy" ? "is-selected" : undefined}
                aria-pressed={dayDifficulty === "easy"}
                onClick={() => setDayDifficulty("easy")}
              >
                <span>Fácil</span><small>4 cambios</small>
              </button>
            </div>
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
            {secrets.nightPerfect ? (
              <button type="button" className="master-pass-button" onClick={() => setMasterPassOpen(true)}>
                <span><Crown aria-hidden /></span>
                <span><small>Mapa secreto descubierto</small><strong>Pase Maestro</strong></span>
                <Sparkles aria-hidden />
              </button>
            ) : null}
            {secrets.impossiblePerfect ? (
              <button type="button" className="master-gallery-button" onClick={() => setGalleryOpen(true)}>
                <Palette aria-hidden /> Galería Maestro
              </button>
            ) : null}
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
              <button type="button" onClick={() => setLegalOpen(true)} className="title-text-action">
                <ShieldCheck className="size-4" strokeWidth={1.7} />
                Privacidad
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
              <span><Crown aria-hidden /> 5 cambios compartidos</span>
              <span><img src="/images/ace-keyring.webp" alt="" /> Llavero de Ases</span>
            </div>
            <div className="tutorial-choice-actions">
              <Button size="lg" className="w-full" onClick={() => { setNightModeOpen(false); requestStart("hotseat", "night"); }}><Users /> Guardia en pareja</Button>
              <Button size="lg" variant="secondary" className="w-full" onClick={() => { setNightModeOpen(false); requestStart("ai", "night"); }}><UserRound /> Guardia con compañero</Button>
            </div>
          </section>
        </div>
      ) : null}
      {masterPassOpen ? (
        <MasterPassOverlay secrets={secrets} onClose={() => setMasterPassOpen(false)} onStart={startMasterMode} />
      ) : null}
      {developerOpen ? (
        <DeveloperMenu
          secrets={secrets}
          tutorialSeen={tutorialComplete}
          hasSavedGame={canResume}
          onClose={() => setDeveloperOpen(false)}
          onApplySecrets={applyDeveloperSecrets}
          onTutorialSeen={setDeveloperTutorialSeen}
          onClearSavedGame={clearSavedRun}
          onOpenMasterPass={() => { setDeveloperOpen(false); setMasterPassOpen(true); }}
          onOpenGallery={() => { setDeveloperOpen(false); setGalleryOpen(true); }}
          onStartMode={startDeveloperMode}
          onReset={resetEverything}
        />
      ) : null}
      {galleryOpen ? (
        <MasterGallery
          theme={showcaseTheme}
          cardBack={cardBack}
          onTheme={setShowcaseTheme}
          onCardBack={setCardBack}
          onClose={() => setGalleryOpen(false)}
        />
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
              <li><span>2</span><p><strong>Tocad o arrastrad.</strong> Podéis elegir una carta y tocar su destino, o llevarla directamente hasta una posición iluminada.</p></li>
              <li><span>3</span><p><strong>Guardad los cambios.</strong> Esta partida permite {exchangeLimit({ challenge: pendingChallenge, difficulty: pendingDifficulty })} cambios; usadlos cuando desbloqueen una atracción.</p></li>
            </ol>
            <Button size="lg" className="mt-5 w-full" onClick={finishTutorial}>
              {pendingMode ? "Empezar partida" : "¡Entendido!"}
            </Button>
          </section>
        </div>
      ) : null}
      <LegalSheet open={legalOpen} onClose={() => setLegalOpen(false)} />
      <MenuMascots />
    </main>
  );
}
