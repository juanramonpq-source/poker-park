import { BookOpen, Crown, FerrisWheel, MoonStar, Palette, ShieldCheck, Sparkles, User, Users, Wrench, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { playLifetimeUnlock, playMenuClick, playUi, startChallengeBed, startTitleBed, unlockAudio } from "@/lib/game/audio";
import {
  clearGame,
  hasMasterPass,
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
import { SoloModeChooser } from "@/components/game/SoloModeChooser";
import { PairStartChooser } from "@/components/game/PairStartChooser";
import { DifficultySelector } from "@/components/game/DifficultySelector";
import { ClassicMedals } from "@/components/game/ClassicMedals";
import { OnlineLobby } from "@/components/game/OnlineLobby";
import { OpeningSequence } from "@/components/game/OpeningSequence";
import { useOpeningSequence } from "@/components/game/useOpeningSequence";
import { MascotMedals } from "@/components/game/MascotMedals";
import { claimPentonuiMedal, loadMascotProgress, type MascotProgress } from "@/lib/game/mascot-progress";
import { PentonuiMedalReveal } from "@/components/game/PentonuiMedalReveal";

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
  const opening = useOpeningSequence();
  const titleAction = useRef<HTMLButtonElement>(null);
  const menuAction = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (opening.stage === "title") titleAction.current?.focus({ preventScroll: true });
    if (opening.stage === "ready" && !new URL(location.href).searchParams.has("sala")) menuAction.current?.querySelector("button")?.focus({ preventScroll: true });
  }, [opening.stage]);
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
  const canResume = Boolean(game && !game.ended && game.mode !== "online");
  const [secrets, setSecrets] = useState<Secrets>({
    perfect: false,
    lifetime: false,
    nightPerfect: false,
    pentonuiSignal: false,
    festivalPerfect: false,
    mirrorPerfect: false,
    stormPerfect: false,
    impossiblePerfect: false,
    classicMedals: [],
  });
  const [mascotProgress, setMascotProgress] = useState<MascotProgress>({
    version: 1,
    greetings: { turtle: 0, hedgehog: 0, fish: 0 },
    lastGreeted: null,
    pentonuiMedal: false,
  });
  const [pentonuiReveal, setPentonuiReveal] = useState(false);
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
  const [soloChoice, setSoloChoice] = useState<{ challenge: GameChallenge; initialDifficulty: GameDifficulty } | null>(null);
  const [pairSetup, setPairSetup] = useState<{ challenge: GameChallenge; initialDifficulty: GameDifficulty } | null>(null);
  const [nightDifficulty, setNightDifficulty] = useState<GameDifficulty>("standard");
  const [onlineSetup, setOnlineSetup] = useState<{ challenge: GameChallenge; difficulty: GameDifficulty } | null>(null);

  useEffect(() => {
    const loadedSecrets = loadSecrets();
    const loadedMascotProgress = loadMascotProgress();
    setSecrets(loadedSecrets);
    setMascotProgress(loadedMascotProgress);
    setTutorialComplete(window.localStorage.getItem(TUTORIAL_SEEN_KEY) === "true");
    if (new URL(window.location.href).searchParams.has("sala")) setOnlineSetup({ challenge: "classic", difficulty: "standard" });
  }, []);

  useEffect(() => {
    if (opening.stage !== "ready") return;
    const award = claimPentonuiMedal(secrets.classicMedals);
    setMascotProgress(award.progress);
    if (award.newlyAwarded) setPentonuiReveal(true);
  }, [opening.stage, secrets.classicMedals]);

  useEffect(() => {
    if (pentonuiReveal) playLifetimeUnlock();
  }, [pentonuiReveal]);

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
    difficulty: GameDifficulty = "standard",
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
    const award = claimPentonuiMedal(next.classicMedals);
    setMascotProgress(award.progress);
    if (award.newlyAwarded) setPentonuiReveal(true);
    hydrate();
    playUi();
  };

  const recordMenuMascotProgress = (progress: MascotProgress) => {
    setMascotProgress(progress);
    const award = claimPentonuiMedal(secrets.classicMedals);
    setMascotProgress(award.progress);
    if (award.newlyAwarded) setPentonuiReveal(true);
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

  const startMasterMode = (mode: Mode, challenge: GameChallenge, difficulty: GameDifficulty) => {
    setMasterPassOpen(false);
    if (mode === "online") {
      setOnlineSetup({ challenge, difficulty });
      return;
    }
    requestStart(mode, challenge, difficulty);
  };

  const openPairSetup = (
    challenge: GameChallenge = "classic",
    initialDifficulty: GameDifficulty = "standard",
  ) => {
    wake();
    setPairSetup({ challenge, initialDifficulty });
  };

  const openSoloChoice = (
    challenge: GameChallenge = "classic",
    initialDifficulty: GameDifficulty = "standard",
  ) => {
    wake();
    setSoloChoice({ challenge, initialDifficulty });
  };

  const chooseSoloMode = (mode: Extract<Mode, "solo" | "ai">, difficulty: GameDifficulty) => {
    if (!soloChoice) return;
    const { challenge } = soloChoice;
    setSoloChoice(null);
    requestStart(mode, challenge, difficulty);
  };

  const cover = showcaseTheme === "classic"
    ? (secrets.impossiblePerfect ? "/images/park-impossible.webp" : "/images/park-cover.webp")
    : CHALLENGE_BACKGROUNDS[showcaseTheme];
  const desktopCover = showcaseTheme === "classic" && !secrets.impossiblePerfect
    ? "/images/park-cover-desktop.webp"
    : cover;

  return (
    <main
      className={`title-screen fixed inset-0 h-dvh overflow-hidden bg-bg text-fg${opening.stage === "title" ? " cursor-pointer" : ""}`}
      data-opening={opening.stage}
      data-menu-night={nightModeOpen || soloChoice?.challenge === "night" || pairSetup?.challenge === "night" || undefined}
      onPointerDown={wake}
      onClick={event => {
        // Safari needs a direct click handler on the touch surface. Delegating
        // only through an ancestor's capture handler drops background taps.
        if (opening.stage !== "title" || !(event.target instanceof Element)) return;
        if (event.target.closest('button, [role="button"]')) return;
        playMenuClick();
        wake();
        opening.setStage("landing");
      }}
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
      {opening.stage === "sun" ? <><div className="opening-park-fade" aria-hidden /><div className="opening-sunbeam" aria-hidden /></> : null}
      <div className="title-nightfall" aria-hidden />
      <Motes />
      <div className="title-studio-strip" inert={opening.stage !== "ready" || undefined}>
        <button type="button" className="title-studio-badge" aria-label="Poker Park por Pentonúi Games" onClick={tapStudio}>
          <img src="/brand/pentonui-games-icon.png" alt="" />
          <span>
            <small>Una producción de</small>
            <strong>Pentonúi Games</strong>
          </span>
        </button>
        <div className="title-medal-rack">
          <ClassicMedals earned={secrets.classicMedals} />
          <MascotMedals progress={mascotProgress} />
        </div>
      </div>

      <div className="title-shell" inert={!["title", "landing", "ready"].includes(opening.stage) || undefined}>
        <div className="title-hero">
          <div className="title-eyebrow">
            <FerrisWheel className={secrets.perfect ? "size-5 text-accent" : "size-5"} strokeWidth={1.5} />
            <span>Juego de cartas</span>
          </div>

          <h1 className="title-name">
            {opening.stage === "title" ? <button ref={titleAction} type="button" className="opening-title-action" onClick={() => { wake(); opening.setStage("landing"); }}>Poker Park<span>Toca para entrar</span></button> : "Poker Park"}
          </h1>
          <p className="title-description">
            Vive un día en un parque de atracciones, guiado por una baraja francesa.
          </p>
          <p className="title-detail">1–2 jugadores · Una baraja</p>
          {secrets.lifetime || secrets.nightPerfect ? <div className="title-achievement-row">
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
          </div> : null}
        </div>

        <div className="title-panel" inert={opening.stage !== "ready" || undefined}>
          <p className="title-menu-kicker">Elige cómo recorrer el parque</p>
          <div ref={menuAction} className="title-actions">
            <Button size="lg" className="w-full title-start-button" onClick={() => openPairSetup()}>
              <Users className="size-4" strokeWidth={1.75} />
              Jugar en pareja
            </Button>
            <Button size="lg" variant="secondary" className="w-full title-start-button" onClick={() => openSoloChoice()}>
              <User className="size-4" strokeWidth={1.75} />
              Modo solitario
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
            {hasMasterPass(secrets) ? (
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
            {canResume ? <div className="title-utility-actions">
              <Button size="md" variant="ghost" className="w-full title-resume-button" onClick={resume}>
                {game?.challenge === "night" ? "Continuar la guardia" : "Continuar la jornada"}
              </Button>
              <button type="button" className="title-text-action opening-replay" onClick={opening.replay}>Ver secuencia de apertura</button>
            </div> : null}
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
            {!canResume ? <button type="button" className="title-text-action opening-replay" onClick={opening.replay}>Ver secuencia de apertura</button> : null}
          </div>
        </div>
      </div>
      <OpeningSequence stage={opening.stage} setStage={opening.setStage} wake={wake} skip={opening.skip} reduced={opening.reduced} />
      {nightModeOpen ? (
        <div className="tutorial-overlay night-menu-entrance" role="dialog" aria-modal="true" aria-labelledby="night-mode-title">
          <button className="tutorial-backdrop" type="button" aria-label="Cerrar reto nocturno" onClick={() => setNightModeOpen(false)} />
          <section className="tutorial-card night-mode-card">
            <div className="night-mode-icon"><MoonStar aria-hidden /></div>
            <p className="tutorial-kicker">Turno especial · 00:07</p>
            <h2 id="night-mode-title">La Noche de Guardia</h2>
            <p className="tutorial-choice-copy">El parque ha cerrado. Tu turno acaba de empezar. Solo dos sectores tienen corriente; cada revisión devuelve la luz a una nueva atracción.</p>
            <div className="night-mode-rules">
              <span><Wrench aria-hidden /> 2 atracciones abiertas</span>
              <span><Sparkles aria-hidden /> Nuevos sectores al completar</span>
              <span><Crown aria-hidden /> {exchangeLimit({ challenge: "night", difficulty: nightDifficulty })} cambios compartidos</span>
              <span><img src="/images/ace-keyring.webp" alt="" /> Ases en el mazo · llavero de emergencia</span>
              <span><Sparkles aria-hidden /> En Fácil: Pase Maestro con 6 revisiones; acreditación con 7</span>
            </div>
            <div className="tutorial-choice-actions">
              <DifficultySelector challenge="night" value={nightDifficulty} onChange={setNightDifficulty} dark />
              <Button size="lg" className="w-full" onClick={() => { setNightModeOpen(false); openPairSetup("night", nightDifficulty); }}><Users /> Guardia en pareja</Button>
              <Button size="lg" variant="secondary" className="w-full" onClick={() => { setNightModeOpen(false); openSoloChoice("night", nightDifficulty); }}><User /> Modo solitario</Button>
            </div>
          </section>
        </div>
      ) : null}
      {masterPassOpen ? (
        <MasterPassOverlay secrets={secrets} onClose={() => setMasterPassOpen(false)} onStart={startMasterMode} />
      ) : null}
      {pairSetup ? <PairStartChooser challenge={pairSetup.challenge} initialDifficulty={pairSetup.initialDifficulty} onClose={() => setPairSetup(null)} onStart={(difficulty) => { const { challenge } = pairSetup; setPairSetup(null); requestStart("hotseat", challenge, difficulty); }} onOnline={(difficulty) => { const { challenge } = pairSetup; setPairSetup(null); setOnlineSetup({ challenge, difficulty }); }} /> : null}
      {soloChoice ? <SoloModeChooser challenge={soloChoice.challenge} initialDifficulty={soloChoice.initialDifficulty} onClose={() => setSoloChoice(null)} onChoose={chooseSoloMode} /> : null}
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
              <li><span>1</span><p>{pendingMode === "solo" ? <><strong>Empieza con cinco cartas.</strong> Robas una más al abrir el primer turno y recorres el parque con una única mano.</> : <><strong>Robad y hablad.</strong> Es un juego colaborativo: cada jugador tiene su propia mano y decidís juntos dónde encaja cada carta.</>}</p></li>
              <li><span>2</span><p>{pendingMode === "solo" ? <><strong>Toca o arrastra.</strong> Elige una carta y toca su destino, o llévala directamente hasta una posición iluminada.</> : <><strong>Tocad o arrastrad.</strong> Podéis elegir una carta y tocar su destino, o llevarla directamente hasta una posición iluminada.</>}</p></li>
              <li><span>3</span><p>{pendingMode === "solo" ? <><strong>Administra los cambios.</strong> Esta partida permite {exchangeLimit({ challenge: pendingChallenge, difficulty: pendingDifficulty })}; si tu mano se bloquea por completo, termina la jornada.</> : <><strong>Guardad los cambios.</strong> Esta partida permite {exchangeLimit({ challenge: pendingChallenge, difficulty: pendingDifficulty })} cambios; usadlos cuando desbloqueen una atracción.</>}</p></li>
            </ol>
            <Button size="lg" className="mt-5 w-full" onClick={finishTutorial}>
              {pendingMode ? "Empezar partida" : "¡Entendido!"}
            </Button>
          </section>
        </div>
      ) : null}
      <LegalSheet open={legalOpen} onClose={() => setLegalOpen(false)} />
      {onlineSetup ? <OnlineLobby initialChallenge={onlineSetup.challenge} initialDifficulty={onlineSetup.difficulty} onClose={() => setOnlineSetup(null)} /> : null}
      <MenuMascots onProgress={recordMenuMascotProgress} />
      {pentonuiReveal && opening.stage === "ready" ? <PentonuiMedalReveal onClose={() => setPentonuiReveal(false)} /> : null}
    </main>
  );
}
