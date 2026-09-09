import type { Card, Rank, Suit } from "@/lib/game/types";
import type { PointerEventHandler } from "react";
import { cardName, isRed, rankLabel } from "@/lib/game/deck";
import { AceArt, FaceArt } from "@/components/game/CardArt";
import { cn } from "@/lib/utils";

function Pip({ suit, className }: { suit: Suit; className?: string }) {
  const common = cn("fill-current", className);
  switch (suit) {
    case "hearts":
      return (
        <svg viewBox="0 0 24 24" className={common} aria-hidden>
          <path d="M12 21s-6.8-4.6-9.3-8.3C.6 9.8 1.4 6 4.6 5.2 6.6 4.7 8.5 5.6 12 8.6c3.5-3 5.4-3.9 7.4-3.4 3.2.8 4 4.6 1.9 7.5C18.8 16.4 12 21 12 21z" />
        </svg>
      );
    case "diamonds":
      return (
        <svg viewBox="0 0 24 24" className={common} aria-hidden>
          <path d="M12 2.5 21 12 12 21.5 3 12z" />
        </svg>
      );
    case "spades":
      return (
        <svg viewBox="0 0 24 24" className={common} aria-hidden>
          <path d="M12 2C8 7 3.5 10.4 3.5 14.2 3.5 17 5.6 19 8.2 19c1.2 0 2.2-.4 3-.1-.3.7-.8 1.6-1.6 2.6h4.8c-.8-1-1.3-1.9-1.6-2.6.8-.3 1.8.1 3 .1 2.6 0 4.7-2 4.7-4.8C20.5 10.4 16 7 12 2z" />
        </svg>
      );
    case "clubs":
      return (
        <svg viewBox="0 0 24 24" className={common} aria-hidden>
          <path d="M12 3.2a3.6 3.6 0 0 0-1.7 6.8A3.7 3.7 0 0 0 6 13.6 3.6 3.6 0 0 0 9.8 17c.7 0 1.3-.2 1.8-.5-.2.7-.7 1.7-1.5 2.9h4c-.8-1.2-1.3-2.2-1.6-2.9.5.3 1.1.5 1.8.5A3.6 3.6 0 0 0 18 13.6a3.7 3.7 0 0 0-4.3-3.6A3.6 3.6 0 0 0 12 3.2z" />
        </svg>
      );
  }
}

type Spot = { x: number; y: number; flip?: boolean };

const NUMBER_PIPS: Record<number, Spot[]> = {
  1: [{ x: 50, y: 50 }],
  2: [
    { x: 50, y: 16 },
    { x: 50, y: 84, flip: true },
  ],
  3: [
    { x: 50, y: 16 },
    { x: 50, y: 50 },
    { x: 50, y: 84, flip: true },
  ],
  4: [
    { x: 26, y: 18 },
    { x: 74, y: 18 },
    { x: 26, y: 82, flip: true },
    { x: 74, y: 82, flip: true },
  ],
  5: [
    { x: 26, y: 18 },
    { x: 74, y: 18 },
    { x: 50, y: 50 },
    { x: 26, y: 82, flip: true },
    { x: 74, y: 82, flip: true },
  ],
  6: [
    { x: 26, y: 16 },
    { x: 74, y: 16 },
    { x: 26, y: 50 },
    { x: 74, y: 50 },
    { x: 26, y: 84, flip: true },
    { x: 74, y: 84, flip: true },
  ],
  7: [
    { x: 26, y: 14 },
    { x: 74, y: 14 },
    { x: 50, y: 32 },
    { x: 26, y: 50 },
    { x: 74, y: 50 },
    { x: 26, y: 86, flip: true },
    { x: 74, y: 86, flip: true },
  ],
  8: [
    { x: 26, y: 14 },
    { x: 74, y: 14 },
    { x: 50, y: 32 },
    { x: 26, y: 50 },
    { x: 74, y: 50 },
    { x: 50, y: 68, flip: true },
    { x: 26, y: 86, flip: true },
    { x: 74, y: 86, flip: true },
  ],
  9: [
    { x: 26, y: 12 },
    { x: 74, y: 12 },
    { x: 26, y: 34 },
    { x: 74, y: 34 },
    { x: 50, y: 50 },
    { x: 26, y: 66, flip: true },
    { x: 74, y: 66, flip: true },
    { x: 26, y: 88, flip: true },
    { x: 74, y: 88, flip: true },
  ],
  10: [
    { x: 26, y: 12 },
    { x: 74, y: 12 },
    { x: 50, y: 24 },
    { x: 26, y: 36 },
    { x: 74, y: 36 },
    { x: 26, y: 64, flip: true },
    { x: 74, y: 64, flip: true },
    { x: 50, y: 76, flip: true },
    { x: 26, y: 88, flip: true },
    { x: 74, y: 88, flip: true },
  ],
};

const sizeMap = {
  xs: "w-8 h-11 text-[8px] rounded-[5px]",
  sm: "w-11 h-16 text-[10px] rounded-[7px]",
  md: "w-[4.25rem] h-[6.1rem] text-[11px] rounded-[8px]",
  lg: "w-24 h-36 text-sm rounded-[10px]",
};

const indexPip = {
  xs: "size-2",
  sm: "size-2.5",
  md: "size-3",
  lg: "size-3.5",
} as const;

const fieldPip = {
  xs: "w-[34%]",
  sm: "w-[32%]",
  md: "w-[30%]",
  lg: "w-[28%]",
} as const;

type Size = keyof typeof sizeMap;

function Index({
  rank,
  suit,
  size,
}: {
  rank: Rank;
  suit: Suit;
  size: Size;
}) {
  return (
    <div className="flex w-[1.1em] flex-col items-center leading-[0.85]">
      <span className="font-display font-bold">{rankLabel(rank)}</span>
      <Pip suit={suit} className={indexPip[size]} />
    </div>
  );
}

function PipField({ rank, suit, size }: { rank: Rank; suit: Suit; size: Size }) {
  if (rank === 1) {
    return (
      <div className="absolute inset-[10%_14%]">
        <AceArt suit={suit} />
      </div>
    );
  }
  if (rank >= 11) {
    return (
      <div className="absolute inset-[8%_12%]">
        <FaceArt rank={rank} suit={suit} />
      </div>
    );
  }

  const spots = NUMBER_PIPS[rank] ?? NUMBER_PIPS[2]!;
  const pipW = fieldPip[size];

  return (
    <div className="absolute inset-[12%_18%]">
      {spots.map((spot, i) => (
        <span
          key={i}
          className={cn("absolute", pipW)}
          style={{
            left: `${spot.x}%`,
            top: `${spot.y}%`,
            transform: `translate(-50%, -50%)${spot.flip ? " rotate(180deg)" : ""}`,
          }}
        >
          <Pip suit={suit} className="size-full" />
        </span>
      ))}
    </div>
  );
}

export function PlayingCard({
  card,
  faceDown = false,
  selected = false,
  dimmed = false,
  legal = false,
  size = "md",
  onClick,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  className,
}: {
  card?: Card | null;
  faceDown?: boolean;
  selected?: boolean;
  dimmed?: boolean;
  legal?: boolean;
  size?: Size;
  onClick?: () => void;
  onPointerDown?: PointerEventHandler<HTMLButtonElement>;
  onPointerMove?: PointerEventHandler<HTMLButtonElement>;
  onPointerUp?: PointerEventHandler<HTMLButtonElement>;
  onPointerCancel?: PointerEventHandler<HTMLButtonElement>;
  className?: string;
}) {
  const clickable = Boolean(onClick);
  const red = card ? isRed(card.suit) : false;
  const hidden = faceDown || !card;
  const classes = cn(
    "playing-card relative shrink-0 overflow-hidden border shadow-soft select-none",
    sizeMap[size],
    hidden ? "card-back border-border" : "bg-card-face border-suit-ink/10",
    selected && "card-picked z-10",
    legal && "ring-2 ring-good",
    dimmed && "opacity-60",
    clickable && "transition-[transform,box-shadow,filter] duration-200 ease-out active:scale-[0.97]",
    className,
  );
  const style = hidden
    ? {
        backgroundImage: "url(/images/card-back.jpg)",
        backgroundSize: "cover" as const,
        backgroundPosition: "center",
      }
    : undefined;
  const label = hidden
    ? "Carta boca abajo"
    : card
      ? cardName(card)
      : "Hueco";
  const inner =
    !hidden && card ? (
      <div className={cn("relative h-full", red ? "text-suit-red" : "text-suit-ink")}>
        <div className="absolute left-[4%] top-[3%]">
          <Index rank={card.rank} suit={card.suit} size={size} />
        </div>
        <PipField rank={card.rank} suit={card.suit} size={size} />
        <div className="absolute bottom-[3%] right-[4%] rotate-180">
          <Index rank={card.rank} suit={card.suit} size={size} />
        </div>
      </div>
    ) : null;

  if (clickable) {
    return (
      <button
        type="button"
        draggable={false}
        onClick={onClick}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        className={classes}
        style={style}
        aria-label={label}
        aria-pressed={selected}
      >
        {inner}
      </button>
    );
  }

  return (
    <div className={classes} style={style} aria-label={label}>
      {inner}
    </div>
  );
}

export function EmptySlot({
  active,
  label,
  onClick,
  size = "sm",
  dropAttractionId,
  dropIndex,
}: {
  active?: boolean;
  label?: string;
  onClick?: () => void;
  size?: Size;
  dropAttractionId?: string;
  dropIndex?: number;
}) {
  const reserved = Boolean(label && (label.includes("♥") || label.includes("♦") || label.includes("♠") || label.includes("♣") || label.includes("K")));
  const aceRed = Boolean(label && (label.includes("♥") || label.includes("♦")));
  const classes = cn(
    "grid place-items-center border border-dashed shrink-0",
    sizeMap[size],
    active
      ? "border-good/70 bg-good/10 text-good slot-pulse"
      : reserved
        ? aceRed
          ? "border-suit-red/25 bg-transparent text-suit-red/40"
          : "border-suit-ink/20 bg-transparent text-suit-ink/35"
        : "border-border bg-bg/25 text-faint/70",
    onClick && "transition-transform duration-150 active:scale-[0.96]",
  );
  const inner = label ? (
    <span className="px-0.5 text-center text-[9px] font-semibold leading-tight tracking-tight opacity-70">
      {label}
    </span>
  ) : (
    <span className="size-1 rounded-full bg-current opacity-50" />
  );
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={classes}
        aria-label={label ?? "Hueco vacío"}
        data-card-drop-slot={dropAttractionId ? "true" : undefined}
        data-drop-attraction={dropAttractionId}
        data-drop-index={dropIndex}
      >
        {inner}
      </button>
    );
  }
  return (
    <div className={classes} aria-label={label ?? "Hueco vacío"}>
      {inner}
    </div>
  );
}
