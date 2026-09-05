import { useId } from "react";
import {
  Droplets,
  Fan,
  Ghost,
  Heart,
  Moon,
  Sparkles,
  Trees,
  UtensilsCrossed,
  Waves,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { AttractionId } from "@/lib/game/types";

function IconBits({
  icons,
  className,
}: {
  icons: LucideIcon[];
  className: string;
}) {
  return icons.map((Icon, i) => (
    <span
      key={`finale-icon-${i}`}
      className={className}
      style={{
        left: `${8 + ((i * 17) % 84)}%`,
        animationDelay: `${i * 90}ms`,
      }}
    >
      <Icon className="finale-icon" strokeWidth={1.7} />
    </span>
  ));
}

export function RideFinale({ id }: { id: AttractionId }) {
  const pathId = `coaster-${useId().replace(/:/g, "")}`;
  return (
    <div className={`finale finale-${id}`} aria-hidden>
      {id === "coaster" ? (
        <svg className="finale-rail" viewBox="0 0 240 90">
          <path
            id={pathId}
            d="M6 74 C 36 74 48 18 78 22 S 112 78 142 42 S 176 8 232 74"
            fill="none"
            stroke="#d6453d"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <text fontSize="22" textAnchor="middle" dominantBaseline="middle">
            <animateMotion dur="1.85s" rotate="auto" fill="freeze" begin="0s">
              <mpath href={`#${pathId}`} />
            </animateMotion>
            {"🚃"}
          </text>
        </svg>
      ) : null}
      {id === "haunted" ? (
        <IconBits icons={[Ghost, Moon, Sparkles, Ghost, Moon, Sparkles]} className="finale-bit finale-float" />
      ) : null}
      {id === "love" ? (
        <>
          <Heart className="finale-heart finale-heart-l" fill="currentColor" />
          <Heart className="finale-heart finale-heart-r" fill="currentColor" />
          <IconBits icons={[Heart, Sparkles, Heart, Sparkles, Heart, Sparkles]} className="finale-bit finale-rise" />
        </>
      ) : null}
      {id === "forest" ? (
        <IconBits icons={[Trees, Sparkles, Trees, Sparkles, Trees, Sparkles]} className="finale-bit finale-swirl" />
      ) : null}
      {id === "chairs" ? (
        <div className="finale-wheel">
          <Fan />
          <Fan />
          <Fan />
          <Fan />
        </div>
      ) : null}
      {id === "restaurant" ? (
        <IconBits icons={[UtensilsCrossed, Sparkles, UtensilsCrossed, Sparkles, UtensilsCrossed]} className="finale-bit finale-pop" />
      ) : null}
      {id === "restrooms" ? (
        <IconBits icons={[Droplets, Sparkles, Waves, Droplets, Sparkles, Waves]} className="finale-bit finale-bubble" />
      ) : null}
    </div>
  );
}
