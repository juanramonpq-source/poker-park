import { useId, type ReactNode } from "react";
import type { Rank, Suit } from "@/lib/game/types";

const PIP_PATH: Record<Suit, string> = {
  hearts:
    "M12 21s-6.8-4.6-9.3-8.3C.6 9.8 1.4 6 4.6 5.2 6.6 4.7 8.5 5.6 12 8.6c3.5-3 5.4-3.9 7.4-3.4 3.2.8 4 4.6 1.9 7.5C18.8 16.4 12 21 12 21z",
  diamonds: "M12 2.5 21 12 12 21.5 3 12z",
  spades:
    "M12 2C8 7 3.5 10.4 3.5 14.2 3.5 17 5.6 19 8.2 19c1.2 0 2.2-.4 3-.1-.3.7-.8 1.6-1.6 2.6h4.8c-.8-1-1.3-1.9-1.6-2.6.8-.3 1.8.1 3 .1 2.6 0 4.7-2 4.7-4.8C20.5 10.4 16 7 12 2z",
  clubs:
    "M12 3.2a3.6 3.6 0 0 0-1.7 6.8A3.7 3.7 0 0 0 6 13.6 3.6 3.6 0 0 0 9.8 17c.7 0 1.3-.2 1.8-.5-.2.7-.7 1.7-1.5 2.9h4c-.8-1.2-1.3-2.2-1.6-2.9.5.3 1.1.5 1.8.5A3.6 3.6 0 0 0 18 13.6a3.7 3.7 0 0 0-4.3-3.6A3.6 3.6 0 0 0 12 3.2z",
};

function MiniPip({
  suit,
  x,
  y,
  s = 8,
}: {
  suit: Suit;
  x: number;
  y: number;
  s?: number;
}) {
  return (
    <g transform={`translate(${x - s / 2} ${y - s / 2}) scale(${s / 24})`}>
      <path d={PIP_PATH[suit]} fill="currentColor" />
    </g>
  );
}

function Flourish() {
  return (
    <g fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.55">
      <path d="M10 22c8 6 8 18 0 24" />
      <path d="M70 22c-8 6-8 18 0 24" />
      <path d="M10 90c8-6 8-18 0-24" />
      <path d="M70 90c-8-6-8-18 0-24" />
    </g>
  );
}

export function AceArt({ suit }: { suit: Suit }) {
  const ornate = suit === "spades";
  return (
    <svg viewBox="0 0 80 112" className="size-full" aria-hidden>
      <Flourish />
      {ornate ? (
        <g>
          <path
            d="M28 22 L28 14 L36 18 L40 10 L44 18 L52 14 L52 22 Z"
            fill="#E8C04A"
            stroke="#C4922A"
            strokeWidth="0.8"
          />
          <circle cx="40" cy="12" r="2" fill="#D6453D" />
        </g>
      ) : null}
      <g transform={`translate(16 ${ornate ? 28 : 24}) scale(${ornate ? 2 : 2.15})`}>
        <path d={PIP_PATH[suit]} fill="currentColor" />
      </g>
      {ornate ? (
        <path
          d="M24 86h32"
          stroke="#E8C04A"
          strokeWidth="1.6"
          strokeLinecap="round"
          opacity="0.9"
        />
      ) : null}
    </svg>
  );
}

function KingHalf({ suit }: { suit: Suit }) {
  return (
    <g>
      <path
        d="M24 18 L24 9 L33 15 L40 6 L47 15 L56 9 L56 18 Z"
        fill="#E8C04A"
        stroke="#C4922A"
        strokeWidth="0.9"
      />
      <circle cx="40" cy="8" r="2.1" fill="#D6453D" />
      <circle cx="28" cy="13" r="1.3" fill="#F4A261" />
      <circle cx="52" cy="13" r="1.3" fill="#F4A261" />
      <path d="M23 20 Q40 14 57 20 L55 30 Q40 26 25 30 Z" fill="#4A2C1A" />
      <ellipse cx="40" cy="32" rx="13" ry="12" fill="#F3C9A0" />
      <circle cx="34.5" cy="31" r="1.5" fill="#1C1A17" />
      <circle cx="45.5" cy="31" r="1.5" fill="#1C1A17" />
      <path d="M32 37 Q40 41 48 37" fill="none" stroke="#4A2C1A" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M29 39 Q40 52 51 39 Q40 46 29 39" fill="#4A2C1A" />
      <path d="M20 50 L40 56 L60 50 L72 56 H8 Z" fill="currentColor" />
      <MiniPip suit={suit} x={40} y={50} s={9} />
    </g>
  );
}

function QueenHalf({ suit }: { suit: Suit }) {
  return (
    <g>
      <path
        d="M22 16 L26 8 L32 14 L40 5 L48 14 L54 8 L58 16 Z"
        fill="#E8C04A"
        stroke="#C4922A"
        strokeWidth="0.9"
      />
      <circle cx="40" cy="7" r="2" fill="#D6453D" />
      <path d="M20 20 Q40 10 60 20 L58 36 Q40 42 22 36 Z" fill="#A35428" />
      <ellipse cx="40" cy="30" rx="12.5" ry="12" fill="#F3C9A0" />
      <circle cx="34.5" cy="29" r="1.5" fill="#1C1A17" />
      <circle cx="45.5" cy="29" r="1.5" fill="#1C1A17" />
      <path d="M35 35 Q40 38 45 35" fill="none" stroke="#C45C4A" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="26" cy="32" r="1.6" fill="#E8C04A" />
      <circle cx="54" cy="32" r="1.6" fill="#E8C04A" />
      <path d="M32 42 Q40 46 48 42" fill="none" stroke="#E8C04A" strokeWidth="1.6" />
      <path d="M18 50 L40 56 L62 50 L72 56 H8 Z" fill="currentColor" />
      <MiniPip suit={suit} x={40} y={50} s={9} />
    </g>
  );
}

function JackHalf({ suit }: { suit: Suit }) {
  return (
    <g>
      <path d="M24 18 Q40 6 56 18 L54 24 Q40 16 26 24 Z" fill="#D6453D" />
      <path d="M50 10 Q62 4 66 16" fill="none" stroke="#E8C04A" strokeWidth="2" strokeLinecap="round" />
      <path d="M24 20 Q40 14 56 20 L54 30 Q40 26 26 30 Z" fill="#5C3A22" />
      <ellipse cx="40" cy="32" rx="12.5" ry="11.5" fill="#F3C9A0" />
      <circle cx="34.5" cy="31" r="1.5" fill="#1C1A17" />
      <circle cx="45.5" cy="31" r="1.5" fill="#1C1A17" />
      <path d="M35 37 Q40 39.5 45 37" fill="none" stroke="#C45C4A" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M20 50 L40 56 L60 50 L72 56 H8 Z" fill="currentColor" />
      <MiniPip suit={suit} x={40} y={50} s={9} />
    </g>
  );
}

function Court({
  suit,
  Half,
}: {
  suit: Suit;
  Half: (props: { suit: Suit }) => ReactNode;
}) {
  const uid = useId();
  const id = `${uid}-h`;
  return (
    <svg viewBox="0 0 80 112" className="size-full" aria-hidden>
      <defs>
        <g id={id}>
          <Half suit={suit} />
        </g>
      </defs>
      <rect x="8" y="6" width="64" height="100" rx="6" fill="#fff8ec" fillOpacity="0.35" />
      <use href={`#${id}`} />
      <use href={`#${id}`} transform="rotate(180 40 56)" />
      <line x1="14" y1="56" x2="66" y2="56" stroke="#E8C04A" strokeWidth="1.2" />
    </svg>
  );
}

export function FaceArt({ rank, suit }: { rank: Rank; suit: Suit }) {
  if (rank === 13) return <Court suit={suit} Half={KingHalf} />;
  if (rank === 12) return <Court suit={suit} Half={QueenHalf} />;
  return <Court suit={suit} Half={JackHalf} />;
}
