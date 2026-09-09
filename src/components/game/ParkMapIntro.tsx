import { useEffect } from "react";
import {
  ArrowLeftRight,
  Compass,
  Fan,
  FerrisWheel,
  Ghost,
  Heart,
  Map as MapIcon,
  RollerCoaster,
  Trees,
  UserRound,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { CHALLENGE_NAMES } from "@/lib/game/challenges";
import type { GameChallenge, GameState } from "@/lib/game/types";
import { useGameStore } from "@/store/game-store";

const INTRO_COPY: Record<
  GameChallenge,
  { eyebrow: string; title: string; detail: string }
> = {
  classic: {
    eyebrow: "Plano oficial del parque",
    title: "Elegid vuestra ruta",
    detail: "La baraja francesa os guiará de atracción en atracción.",
  },
  night: {
    eyebrow: "Plano de mantenimiento",
    title: "Comienza la inspección",
    detail: "Revisad los sectores encendidos y devolved la corriente al parque.",
  },
  festival: {
    eyebrow: "Plano de iluminación",
    title: "Encended la ruta",
    detail: "Alternad atracciones para que el brillo recorra todo el parque.",
  },
  mirror: {
    eyebrow: "Plano reflejado",
    title: "Leed el mapa al revés",
    detail: "Las rutas conocidas empiezan ahora desde el otro lado.",
  },
  storm: {
    eyebrow: "Plano impermeable",
    title: "Seguid el pronóstico",
    detail: "Elegid la siguiente parada antes de que la tormenta cierre el paso.",
  },
  impossible: {
    eyebrow: "Expediente reservado · 00:13",
    title: "El último plano",
    detail: "Espejo, tormenta y luces comparten una única ruta imposible.",
  },
};

const LEFT_STOPS: Array<{ label: string; Icon: LucideIcon }> = [
  { label: "Montaña Rusa", Icon: RollerCoaster },
  { label: "Túnel del Amor", Icon: Heart },
  { label: "Restaurante", Icon: UtensilsCrossed },
];

const RIGHT_STOPS: Array<{ label: string; Icon: LucideIcon }> = [
  { label: "Casa del Terror", Icon: Ghost },
  { label: "Sillas Voladoras", Icon: Fan },
  { label: "Aseos", Icon: UserRound },
];

function MapStop({ label, Icon }: { label: string; Icon: LucideIcon }) {
  return (
    <span className="map-intro-stop">
      <span className="map-intro-stop-icon"><Icon aria-hidden /></span>
      <strong>{label}</strong>
    </span>
  );
}

export function ParkMapIntro({ game }: { game: GameState }) {
  const dismissMapIntro = useGameStore((state) => state.dismissMapIntro);
  const challenge = game.challenge ?? "classic";
  const copy = INTRO_COPY[challenge];

  useEffect(() => {
    const fallback = window.setTimeout(dismissMapIntro, 3000);
    return () => window.clearTimeout(fallback);
  }, [dismissMapIntro]);

  return (
    <div
      className="park-map-intro"
      role="status"
      aria-live="polite"
      aria-label={`Desplegando el plano de ${CHALLENGE_NAMES[challenge]}`}
      data-map-intro="visible"
      data-map-challenge={challenge}
      onAnimationEnd={(event) => {
        if (event.target === event.currentTarget) dismissMapIntro();
      }}
    >
      <div className="map-intro-table" aria-hidden />
      <section className="park-map-intro-sheet" aria-hidden>
        <div className="park-map-intro-fold map-intro-fold-left">
          <span className="map-intro-route-mark" />
          {LEFT_STOPS.map((stop) => <MapStop key={stop.label} {...stop} />)}
        </div>
        <div className="park-map-intro-fold map-intro-fold-center">
          <header className="map-intro-heading">
            <MapIcon aria-hidden />
            <span>{copy.eyebrow}</span>
            <strong>{copy.title}</strong>
            <small>{copy.detail}</small>
          </header>
          <MapStop label="Bosque" Icon={Trees} />
          <span className="map-intro-entrance"><ArrowLeftRight aria-hidden /> Entrada</span>
          <Compass className="map-intro-compass" aria-hidden />
          <FerrisWheel className="map-intro-watermark" aria-hidden />
        </div>
        <div className="park-map-intro-fold map-intro-fold-right">
          <span className="map-intro-route-mark" />
          {RIGHT_STOPS.map((stop) => <MapStop key={stop.label} {...stop} />)}
        </div>
      </section>
      <button className="map-intro-skip" type="button" onClick={dismissMapIntro}>
        Abrir el plano ahora
      </button>
    </div>
  );
}
