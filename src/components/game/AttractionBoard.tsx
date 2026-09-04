import type { ReactNode } from "react";
import {
  RollerCoaster,
  Ghost,
  Heart,
  Trees,
  Fan,
  UtensilsCrossed,
  UserRound,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  ATTRACTION_DEFS,
  attractionProgress,
  isAttractionComplete,
  slotHint,
} from "@/lib/game/attractions";
import type { AttractionId, Card, GameState } from "@/lib/game/types";
import { EmptySlot, PlayingCard } from "@/components/game/PlayingCard";
import { cn } from "@/lib/utils";
import { attractionIsHot, useGameStore, useLegalForSelected } from "@/store/game-store";
import { RideFinale } from "@/components/game/RideFinale";

export const ICONS: Record<AttractionId, LucideIcon> = {
  coaster: RollerCoaster,
  haunted: Ghost,
  love: Heart,
  forest: Trees,
  chairs: Fan,
  restaurant: UtensilsCrossed,
  restrooms: UserRound,
};

type CardSize = "xs" | "sm" | "md";

function SlotCell({
  attractionId,
  index,
  card,
  slots,
  size = "sm",
}: {
  attractionId: AttractionId;
  index: number;
  card: Card | null;
  slots: (Card | null)[];
  size?: CardSize;
}) {
  const selectedCardId = useGameStore((s) => s.selectedCardId);
  const exchangeMode = useGameStore((s) => s.exchangeMode);
  const place = useGameStore((s) => s.place);
  const exchange = useGameStore((s) => s.exchange);
  const swapFx = useGameStore((s) => s.swapFx);
  const { places, exchanges } = useLegalForSelected();
  const canPlace = places.some((p) => p.attractionId === attractionId && p.index === index);
  const canSwap = exchanges.some(
    (t) => t.kind === "slot" && t.attractionId === attractionId && t.index === index,
  );
  const hint = slotHint(attractionId, slots, index);

  if (card) {
    return (
      <PlayingCard
        card={card}
        size={size}
        className={cn("settle", swapFx?.outgoing.id === card.id && "card-swap-in")}
        legal={canSwap}
        selected={canSwap && Boolean(selectedCardId)}
        onClick={
          exchangeMode && canSwap
            ? () => exchange({ kind: "slot", attractionId, index })
            : undefined
        }
      />
    );
  }

  return (
    <EmptySlot
      size={size}
      active={canPlace}
      label={hint}
      onClick={canPlace ? () => place(attractionId, index) : undefined}
    />
  );
}

function GridWrap({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("gap-1", className)}>{children}</div>;
}

export function AttractionLayout({
  id,
  slots,
  size = "sm",
}: {
  id: AttractionId;
  slots: (Card | null)[];
  size?: CardSize;
}) {
  const cell = (index: number) => (
    <SlotCell
      key={index}
      attractionId={id}
      index={index}
      card={slots[index] ?? null}
      slots={slots}
      size={size}
    />
  );

  switch (id) {
    case "coaster":
      return (
        <div className="relative w-full max-w-[18.5rem]">
          <svg
            viewBox="0 0 200 168"
            className="pointer-events-none absolute inset-0 size-full"
            aria-hidden
          >
            <path
              d="M22 150 V108 L58 62 C72 42 88 28 108 24 C138 18 162 40 166 62 C170 88 158 108 146 112 L178 150"
              fill="none"
              stroke="#efd2a8"
              strokeWidth="10"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M22 150 V108 L58 62 C72 42 88 28 108 24 C138 18 162 40 166 62 C170 88 158 108 146 112 L178 150"
              fill="none"
              stroke="#d6453d"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="6 7"
            />
          </svg>
          <div className="relative grid grid-cols-5 grid-rows-4 items-center justify-items-center gap-x-1 gap-y-1">
            <div className="col-start-3 row-start-1">{cell(4)}</div>
            <div className="col-start-2 row-start-2">{cell(2)}</div>
            <div className="col-start-3 row-start-2">{cell(3)}</div>
            <div className="col-start-4 row-start-2">{cell(5)}</div>
            <div className="col-start-1 row-start-3">{cell(1)}</div>
            <div className="col-start-4 row-start-3">{cell(6)}</div>
            <div className="col-start-1 row-start-4">{cell(0)}</div>
            <div className="col-start-5 row-start-4">{cell(7)}</div>
          </div>
        </div>
      );
    case "haunted":
      return (
        <div className="flex flex-col items-center gap-1">
          {cell(4)}
          <div className="grid grid-cols-2 gap-1">
            {cell(0)}
            {cell(1)}
            {cell(2)}
            {cell(3)}
          </div>
        </div>
      );
    case "love":
      return (
        <div className="relative w-[min(100%,17.5rem)]">
          <svg
            viewBox="0 0 220 168"
            className="pointer-events-none absolute inset-0 size-full"
            aria-hidden
          >
            <path
              d="M18 150 C18 78 70 22 110 22 C150 22 202 78 202 150"
              fill="none"
              stroke="#efd2a8"
              strokeWidth="10"
              strokeLinecap="round"
            />
            <path
              d="M18 150 C18 78 70 22 110 22 C150 22 202 78 202 150"
              fill="none"
              stroke="#d6453d"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="6 7"
            />
          </svg>
          <div className="relative grid grid-cols-7 grid-rows-4 items-center justify-items-center gap-y-1">
            <div className="col-start-4 row-start-1">{cell(3)}</div>
            <div className="col-start-3 row-start-2">{cell(2)}</div>
            <div className="col-start-5 row-start-2">{cell(4)}</div>
            <div className="col-start-2 row-start-3">{cell(1)}</div>
            <div className="col-start-6 row-start-3">{cell(5)}</div>
            <div className="col-start-1 row-start-4">{cell(0)}</div>
            <div className="col-start-7 row-start-4">{cell(6)}</div>
          </div>
        </div>
      );
    case "forest":
      return (
        <div className="flex flex-col items-center gap-1">
          <div className="grid grid-cols-3 justify-items-center gap-1">
            {cell(0)}
            {cell(1)}
            {cell(2)}
            {cell(3)}
            {cell(4)}
            {cell(5)}
            {cell(6)}
            {cell(7)}
            {cell(8)}
          </div>
          <div className="grid w-full grid-cols-3 justify-items-center gap-1">
            {cell(9)}
            <span />
            {cell(10)}
          </div>
        </div>
      );
    case "chairs":
      return (
        <div className="relative w-[min(100%,16rem)]">
          <svg
            viewBox="0 0 200 200"
            className="pointer-events-none absolute inset-0 size-full"
            aria-hidden
          >
            <line x1="100" y1="78" x2="100" y2="188" stroke="#efd2a8" strokeWidth="10" strokeLinecap="round" />
            <line x1="100" y1="78" x2="100" y2="188" stroke="#d6453d" strokeWidth="3" strokeDasharray="5 6" strokeLinecap="round" />
            <path d="M100 86 L28 28" fill="none" stroke="#efd2a8" strokeWidth="8" strokeLinecap="round" />
            <path d="M100 86 L172 28" fill="none" stroke="#efd2a8" strokeWidth="8" strokeLinecap="round" />
            <path d="M100 86 L52 58" fill="none" stroke="#efd2a8" strokeWidth="8" strokeLinecap="round" />
            <path d="M100 86 L148 58" fill="none" stroke="#efd2a8" strokeWidth="8" strokeLinecap="round" />
            <path d="M100 86 L28 28" fill="none" stroke="#d6453d" strokeWidth="2.5" strokeDasharray="5 6" strokeLinecap="round" />
            <path d="M100 86 L172 28" fill="none" stroke="#d6453d" strokeWidth="2.5" strokeDasharray="5 6" strokeLinecap="round" />
            <path d="M100 86 L52 58" fill="none" stroke="#d6453d" strokeWidth="2.5" strokeDasharray="5 6" strokeLinecap="round" />
            <path d="M100 86 L148 58" fill="none" stroke="#d6453d" strokeWidth="2.5" strokeDasharray="5 6" strokeLinecap="round" />
          </svg>
          <div className="relative grid grid-cols-5 grid-rows-5 items-center justify-items-center gap-y-1">
            <div className="col-start-1 row-start-1">{cell(0)}</div>
            <div className="col-start-5 row-start-1">{cell(1)}</div>
            <div className="col-start-2 row-start-2">{cell(2)}</div>
            <div className="col-start-4 row-start-2">{cell(3)}</div>
            <div className="col-start-3 row-start-3">{cell(4)}</div>
            <div className="col-start-3 row-start-4">{cell(5)}</div>
            <div className="col-start-3 row-start-5">{cell(6)}</div>
          </div>
        </div>
      );
    case "restaurant":
      return (
        <div className="grid grid-cols-3 justify-items-center gap-1">
          {slots.map((_, i) => cell(i))}
        </div>
      );
    case "restrooms":
      return (
        <div className="flex justify-center gap-2">
          {cell(0)}
          {cell(1)}
        </div>
      );
  }
}

export function AttractionSheet({
  id,
  game,
}: {
  id: AttractionId;
  game: GameState;
}) {
  const def = ATTRACTION_DEFS[id];
  const attr = game.attractions[id];
  const complete = isAttractionComplete(id, attr.slots);
  const visit = useGameStore((s) => s.visit);
  const openPark = useGameStore((s) => s.openPark);
  const { visits } = useLegalForSelected();
  const canVisit = visits.includes(id);
  const bloomId = useGameStore((s) => s.bloomId);
  const celebrating = bloomId === id;
  const Icon = ICONS[id];

  return (
    <div className="absolute inset-0 z-30 flex items-stretch p-2">
      <button
        type="button"
        className="absolute inset-0 bg-fg/25 backdrop-blur-[2px]"
        aria-label="Cerrar atracción"
        onClick={() => openPark(null)}
      />
      <section
        className={cn(
          "relative z-10 flex min-h-0 w-full flex-col rounded-2xl border bg-surface p-3 shadow-soft sheet-enter",
          complete ? "tile-won attraction-lit" : "border-border",
        )}
      >
        <header className="mb-2 flex shrink-0 items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <Icon className="size-5 shrink-0 text-accent" strokeWidth={1.6} />
            <div className="min-w-0">
              <h2 className="font-display text-lg font-medium tracking-tight text-fg">
                {def.name}
              </h2>
              <p className="text-[11px] leading-snug text-muted">{def.tagline}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span
              className={cn(
                "text-[11px] font-medium tabular-nums",
                complete ? "text-good" : "text-faint",
              )}
            >
              {complete ? "Conseguido" : attractionProgress(id, attr.slots)}
            </span>
            <button
              type="button"
              className="grid size-9 place-items-center rounded-md text-muted"
              onClick={() => openPark(null)}
              aria-label="Cerrar"
            >
              <X className="size-4" />
            </button>
          </div>
        </header>

        <p className="mb-2 shrink-0 rounded-lg bg-bg/80 px-2.5 py-1.5 text-[11px] leading-snug text-fg/80">
          {def.rules}
        </p>

        <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-visible py-2">
          <div
            key={`${id}-scheme`}
            className={cn(!complete && "scheme-show")}
          >
            <AttractionLayout id={id} slots={attr.slots} size="sm" />
          </div>
          {celebrating ? <RideFinale id={id} /> : null}
          {complete && !celebrating ? (
            <span className="tile-won-stamp tile-won-stamp-lg">
              <span className="tile-won-label">Conseguido</span>
            </span>
          ) : null}
        </div>

        {attr.visitors.length > 0 ? (
          <div className="mt-2 flex shrink-0 flex-wrap justify-center gap-1">
            {attr.visitors.map((card) => (
              <PlayingCard key={card.id} card={card} size="xs" />
            ))}
          </div>
        ) : null}

        {canVisit ? (
          <button
            type="button"
            onClick={() => visit(id)}
            className="mt-2 w-full shrink-0 rounded-md border border-accent/40 bg-accent/10 py-2.5 text-sm font-semibold text-accent"
          >
            Dejar visitante
          </button>
        ) : null}
      </section>
    </div>
  );
}

export function AttractionBoard({
  id,
  game,
}: {
  id: AttractionId;
  game: GameState;
}) {
  const def = ATTRACTION_DEFS[id];
  const attr = game.attractions[id];
  const complete = isAttractionComplete(id, attr.slots);
  const selectedCardId = useGameStore((s) => s.selectedCardId);
  const exchangeMode = useGameStore((s) => s.exchangeMode);
  const visit = useGameStore((s) => s.visit);
  const { visits } = useLegalForSelected();
  const hot = attractionIsHot(game, id, selectedCardId, exchangeMode);
  const canVisit = visits.includes(id);
  const bloomId = useGameStore((s) => s.bloomId);
  const Icon = ICONS[id];

  return (
    <section
      className={cn(
        "rounded-xl border bg-surface p-4 shadow-soft transition-[border-color,background-color,box-shadow] duration-200",
        complete ? "border-good/50 attraction-lit" : hot ? "tile-hot" : "border-border",
        bloomId === id && "attraction-bloom",
      )}
    >
      <header className="mb-3 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Icon className="size-4 shrink-0 text-accent" strokeWidth={1.6} />
          <div className="min-w-0">
            <h2 className="font-display text-[15px] font-medium tracking-tight text-fg">
              {def.name}
            </h2>
            <p className="text-[11px] text-muted">{def.tagline}</p>
          </div>
        </div>
        <span
          className={cn(
            "text-[11px] font-medium tabular-nums",
            complete ? "text-good" : "text-faint",
          )}
        >
          {complete ? "Conseguido" : attractionProgress(id, attr.slots)}
        </span>
      </header>

      <AttractionLayout id={id} slots={attr.slots} />

      {attr.visitors.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1">
          {attr.visitors.map((card) => (
            <PlayingCard key={card.id} card={card} size="xs" />
          ))}
        </div>
      ) : null}

      {canVisit ? (
        <button
          type="button"
          onClick={() => visit(id)}
          className="mt-3 w-full rounded-sm border border-accent/40 bg-accent/10 py-2 text-xs font-medium text-accent"
        >
          Dejar visitante
        </button>
      ) : null}
    </section>
  );
}
