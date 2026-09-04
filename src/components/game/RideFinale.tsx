import { useId } from "react";
import type { AttractionId } from "@/lib/game/types";

function Bits({
  glyphs,
  className,
}: {
  glyphs: string[];
  className: string;
}) {
  return glyphs.map((glyph, i) => (
    <span
      key={`${glyph}-${i}`}
      className={className}
      style={{
        left: `${8 + ((i * 17) % 84)}%`,
        animationDelay: `${i * 90}ms`,
        fontSize: `${1.1 + (i % 3) * 0.25}rem`,
      }}
    >
      {glyph}
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
        <Bits glyphs={["👻", "🌙", "🦇", "👻", "✨", "👻"]} className="finale-bit finale-float" />
      ) : null}
      {id === "love" ? (
        <>
          <span className="finale-heart finale-heart-l">♥</span>
          <span className="finale-heart finale-heart-r">♥</span>
          <Bits glyphs={["💕", "💗", "💖", "💞", "💘", "💕"]} className="finale-bit finale-rise" />
        </>
      ) : null}
      {id === "forest" ? (
        <Bits glyphs={["🍃", "✨", "🦋", "🌿", "🍃", "🌼", "✨"]} className="finale-bit finale-swirl" />
      ) : null}
      {id === "chairs" ? (
        <div className="finale-wheel">
          <span>💺</span>
          <span>💺</span>
          <span>💺</span>
          <span>💺</span>
        </div>
      ) : null}
      {id === "restaurant" ? (
        <Bits glyphs={["🍽️", "✨", "🍰", "🍴", "⭐", "🥂"]} className="finale-bit finale-pop" />
      ) : null}
      {id === "restrooms" ? (
        <Bits glyphs={["🫧", "✨", "🫧", "💧", "🫧", "✨"]} className="finale-bit finale-bubble" />
      ) : null}
    </div>
  );
}
