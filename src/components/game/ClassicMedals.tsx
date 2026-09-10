import { CloudLightning, Crown, FerrisWheel, FlipHorizontal2, Lightbulb, MoonStar } from "lucide-react";
import type { GameChallenge } from "@/lib/game/types";

const MEDALS = [
  { id: "classic", name: "Parque de día", icon: FerrisWheel },
  { id: "night", name: "La Noche de Guardia", icon: MoonStar },
  { id: "festival", name: "Festival de las Luces", icon: Lightbulb },
  { id: "mirror", name: "Parque Espejo", icon: FlipHorizontal2 },
  { id: "storm", name: "Día de Tormenta", icon: CloudLightning },
  { id: "impossible", name: "Poker Park 00:13", icon: Crown },
] satisfies { id: GameChallenge; name: string; icon: typeof FerrisWheel }[];

export function ClassicMedals({ earned }: { earned: GameChallenge[] }) {
  const visible = MEDALS.filter((medal) => earned.includes(medal.id));
  if (visible.length === 0) return null;

  return (
    <div className="title-classic-medals" aria-label="Medallas conseguidas en dificultad Clásico">
      {visible.map(({ id, name, icon: Icon }) => (
        <span key={id} className={`title-classic-medal medal-${id}`} title={`${name} · Clásico perfecto`} aria-label={`${name}: medalla clásica conseguida`}>
          <Icon aria-hidden />
        </span>
      ))}
    </div>
  );
}
