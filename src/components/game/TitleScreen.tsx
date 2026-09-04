import { FerrisWheel, Users, UserRound } from "lucide-react";
import { startTitleBed, unlockAudio } from "@/lib/game/audio";
import { loadSecrets } from "@/lib/game/persist";
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

export function TitleScreen() {
  const start = useGameStore((s) => s.start);
  const resume = useGameStore((s) => s.resume);
  const game = useGameStore((s) => s.game);
  const setRulesOpen = useGameStore((s) => s.setRulesOpen);
  const canResume = Boolean(game && !game.ended);
  const secrets = loadSecrets();

  const wake = () => {
    unlockAudio();
    startTitleBed();
  };

  return (
    <main
      className="relative min-h-dvh overflow-hidden bg-bg text-fg"
      onPointerDown={wake}
    >
      <img
        src="/images/park-cover.png"
        alt=""
        className="title-cover"
      />
      <div className="title-vignette" />
      <Motes />

      <div className="title-shell">
        <div className="title-hero">
          <div className="title-eyebrow">
            <FerrisWheel className={secrets.lifetime || secrets.perfect ? "size-5 text-accent" : "size-5"} strokeWidth={1.5} />
            <span>
              {secrets.lifetime ? "Pase de por vida" : "Juego de cartas"}
            </span>
          </div>

          <h1 className="title-name">
            Poker Park
          </h1>
          <p className="title-description">
            Un día de feria, cartas al sol y atracciones que se montan juntas.
          </p>
          <p className="title-detail">Cooperativo · 2 jugadores · Una baraja</p>
        </div>

        <div className="title-panel stagger-in">
          <p className="title-menu-kicker">Elige cómo recorrer el parque</p>
          <div className="title-actions">
            <Button size="lg" className="w-full" onClick={() => start("hotseat")}>
              <Users className="size-4" strokeWidth={1.75} />
              Jugar en pareja
            </Button>
            <Button size="lg" variant="secondary" className="w-full" onClick={() => start("ai")}>
              <UserRound className="size-4" strokeWidth={1.75} />
              Jugar con compañero
            </Button>
            {canResume ? (
              <Button size="md" variant="ghost" className="w-full" onClick={resume}>
                Continuar la jornada
              </Button>
            ) : null}
            <button
              type="button"
              onClick={() => setRulesOpen(true)}
              className="pt-1 text-center text-sm text-muted underline-offset-4 hover:text-fg hover:underline"
            >
              Cómo se juega
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
