import { useEffect, type ReactNode } from "react";
import { ArrowLeftRight, Compass, KeyRound, Map as MapIcon, Route, Ticket } from "lucide-react";
import { useEntranceMotion } from "@/components/game/useEntranceMotion";
import {
  ParkMapArtwork,
  ParkMapArtworkSymbols,
  type MapOrientation,
} from "@/components/game/ParkMapArtwork";
import { CHALLENGE_NAMES } from "@/lib/game/challenges";
import type { GameChallenge, GameState } from "@/lib/game/types";
import { cn } from "@/lib/utils";
import { useGameStore } from "@/store/game-store";

const INTRO_COPY: Record<
  GameChallenge,
  { eyebrow: string; title: string; detail: string; stamp: string }
> = {
  classic: {
    eyebrow: "Plano oficial del parque",
    title: "Elige tu ruta",
    detail: "La baraja francesa guía el recorrido de atracción en atracción.",
    stamp: "Edición de día",
  },
  night: {
    eyebrow: "Plano de mantenimiento",
    title: "Comienza la inspección",
    detail: "Revisa los sectores encendidos y devuelve la corriente al parque.",
    stamp: "Turno 00:07",
  },
  festival: {
    eyebrow: "Plano de iluminación",
    title: "Enciende la ruta",
    detail: "Alterna atracciones para que el brillo recorra todo el parque.",
    stamp: "Festival de las Luces",
  },
  mirror: {
    eyebrow: "Plano reflejado",
    title: "Lee el mapa al revés",
    detail: "Las rutas conocidas empiezan ahora desde el otro lado.",
    stamp: "Copia especular",
  },
  storm: {
    eyebrow: "Plano impermeable",
    title: "Sigue el pronóstico",
    detail: "Elige la siguiente parada antes de que la tormenta cierre el paso.",
    stamp: "Alerta meteorológica",
  },
  impossible: {
    eyebrow: "Expediente reservado · 00:13",
    title: "El último plano",
    detail: "Espejo, tormenta y luces comparten una única ruta imposible.",
    stamp: "Acceso reservado",
  },
};

function MapPanel({
  side,
  challenge,
  symbolId,
  orientation,
  children,
}: {
  side: "left" | "center" | "right";
  challenge: GameChallenge;
  symbolId: string;
  orientation: MapOrientation;
  children?: ReactNode;
}) {
  return (
    <div className={cn("park-map-intro-fold", `map-intro-fold-${side}`)}>
      <div className="map-intro-panorama">
        <ParkMapArtwork challenge={challenge} symbolId={symbolId} orientation={orientation} />
      </div>
      {children}
    </div>
  );
}

export function ParkMapIntro({
  game,
  direction = "opening",
}: {
  game: GameState;
  direction?: "opening" | "closing";
}) {
  const dismissMapIntro = useGameStore((state) => state.dismissMapIntro);
  const finishMapOutro = useGameStore((state) => state.finishMapOutro);
  const challenge = game.challenge ?? "classic";
  const pace = useEntranceMotion(`map-${direction}-${challenge}`);
  const copy = INTRO_COPY[challenge];
  const soloOpening = game.mode === "solo";
  const finish = direction === "closing" ? finishMapOutro : dismissMapIntro;
  const symbolId = `park-map-intro-${challenge}-${direction}`;
  const orientation: MapOrientation =
    typeof window !== "undefined" && window.matchMedia("(max-width: 640px)").matches
      ? "portrait"
      : "landscape";

  useEffect(() => {
    if (pace === "pending") return;
    const duration = pace === "reduced" ? 0 : direction === "closing" ? 5400 : 3500;
    const fallback = window.setTimeout(finish, duration);
    return () => window.clearTimeout(fallback);
  }, [finish, pace, direction]);

  return (
    <div
      className={cn("park-map-intro", direction === "closing" && "is-closing")}
      role="status"
      aria-live="polite"
      aria-label={
        direction === "closing"
          ? `Plegando el plano de ${CHALLENGE_NAMES[challenge]}`
          : `Desplegando el plano de ${CHALLENGE_NAMES[challenge]}`
      }
      data-map-intro={direction === "opening" ? "visible" : undefined}
      data-map-outro={direction === "closing" ? "visible" : undefined}
      data-map-challenge={challenge}
      data-entrance-pace={pace}
      onAnimationEnd={(event) => {
        if (event.target === event.currentTarget) finish();
      }}
    >
      <ParkMapArtworkSymbols id={symbolId} orientation={orientation} />
      <div className="map-intro-table" aria-hidden />
      {direction === "opening" ? <>
        <div className="park-entry-gates" aria-hidden><span /><span /></div>
        <div className="park-entry-ticket" aria-hidden>
          {challenge === "night" ? <KeyRound /> : <Ticket />}
          <small>{challenge === "night" ? "Turno 00:07" : "Entrada validada"}</small>
          <strong>{challenge === "night" ? "Tu guardia comienza" : "Bienvenido a Poker Park"}</strong>
          <span>♠ ♥ ♣ ♦</span>
        </div>
        {challenge === "night" ? <div className="park-entry-lantern" aria-hidden /> : null}
      </> : null}
      <section className="park-map-intro-sheet map-intro-v2" aria-hidden>
        <MapPanel side="left" challenge={challenge} symbolId={symbolId} orientation={orientation} />
        <MapPanel side="center" challenge={challenge} symbolId={symbolId} orientation={orientation}>
          <header className="map-intro-heading">
            <span className="map-intro-heading-icon"><MapIcon aria-hidden /></span>
            <span>{direction === "closing" ? "Fin del recorrido" : copy.eyebrow}</span>
            <strong>{direction === "closing" ? "Cerramos el parque" : copy.title}</strong>
            <small>
              {direction === "closing"
                ? "Guardamos el plano y preparamos el recuento de la jornada."
                : soloOpening
                  ? `${copy.detail} Cinco cartas iniciales y una sola mano.`
                  : copy.detail}
            </small>
          </header>
          <span className="map-intro-entrance"><ArrowLeftRight aria-hidden /> Entrada</span>
          <span className="map-intro-stamp"><Route aria-hidden /> {copy.stamp}</span>
          <Compass className="map-intro-compass" aria-hidden />
        </MapPanel>
        <MapPanel side="right" challenge={challenge} symbolId={symbolId} orientation={orientation} />
        <span className="map-intro-crease is-left" />
        <span className="map-intro-crease is-right" />
      </section>
      {direction === "opening" ? (
        <button className="map-intro-skip" type="button" onClick={dismissMapIntro}>
          Abrir el plano ahora
        </button>
      ) : (
        <p className="map-intro-closing-copy">Preparando el recuento…</p>
      )}
    </div>
  );
}
