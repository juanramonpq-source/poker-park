import { useEffect, type ReactNode } from "react";
import { ArrowLeftRight, Compass, Map as MapIcon, Route } from "lucide-react";
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
    title: "Elegid vuestra ruta",
    detail: "La baraja francesa os guiará de atracción en atracción.",
    stamp: "Edición de día",
  },
  night: {
    eyebrow: "Plano de mantenimiento",
    title: "Comienza la inspección",
    detail: "Revisad los sectores encendidos y devolved la corriente al parque.",
    stamp: "Turno 00:07",
  },
  festival: {
    eyebrow: "Plano de iluminación",
    title: "Encended la ruta",
    detail: "Alternad atracciones para que el brillo recorra todo el parque.",
    stamp: "Festival de las Luces",
  },
  mirror: {
    eyebrow: "Plano reflejado",
    title: "Leed el mapa al revés",
    detail: "Las rutas conocidas empiezan ahora desde el otro lado.",
    stamp: "Copia especular",
  },
  storm: {
    eyebrow: "Plano impermeable",
    title: "Seguid el pronóstico",
    detail: "Elegid la siguiente parada antes de que la tormenta cierre el paso.",
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
  const copy = INTRO_COPY[challenge];
  const finish = direction === "closing" ? finishMapOutro : dismissMapIntro;
  const symbolId = `park-map-intro-${challenge}-${direction}`;
  const orientation: MapOrientation =
    typeof window !== "undefined" && window.matchMedia("(max-width: 640px)").matches
      ? "portrait"
      : "landscape";

  useEffect(() => {
    const fallback = window.setTimeout(finish, 3000);
    return () => window.clearTimeout(fallback);
  }, [finish]);

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
      onAnimationEnd={(event) => {
        if (event.target === event.currentTarget) finish();
      }}
    >
      <ParkMapArtworkSymbols id={symbolId} orientation={orientation} />
      <div className="map-intro-table" aria-hidden />
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
