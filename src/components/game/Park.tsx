import {
  ATTRACTION_DEFS,
  attractionProgress,
  filledCount,
  isAttractionComplete,
} from "@/lib/game/attractions";
import { isRed } from "@/lib/game/deck";
import type { AttractionId, Card, GameState } from "@/lib/game/types";
import { AttractionSheet, ICONS } from "@/components/game/AttractionBoard";
import { RideFinale } from "@/components/game/RideFinale";
import { PlayingCard } from "@/components/game/PlayingCard";
import { cn } from "@/lib/utils";
import { attractionIsHot, useGameStore, useLegalForSelected } from "@/store/game-store";

const TILE_THEME: Record<AttractionId, string> = {
  coaster: "park-tile-coaster",
  haunted: "park-tile-haunted",
  love: "park-tile-love",
  forest: "park-tile-forest",
  chairs: "park-tile-chairs",
  restaurant: "park-tile-restaurant",
  restrooms: "park-tile-restrooms",
};

function Pip({ card }: { card: Card | null }) {
  if (card) {
    return (
      <span
        className={cn(
          "block size-3 rounded-[3px] shadow-[0_0_0_1px_rgb(239_210_168/0.55)]",
          isRed(card.suit) ? "bg-suit-red" : "bg-suit-ink",
        )}
      />
    );
  }
  return (
    <span className="block size-3 rounded-[3px] bg-[#f3e0c4]/70 shadow-[0_0_0_1px_rgb(239_210_168/0.4)]" />
  );
}

function MiniShape({ id, slots }: { id: AttractionId; slots: (Card | null)[] }) {
  const pip = (i: number) => <Pip key={i} card={slots[i] ?? null} />;
  switch (id) {
    case "coaster":
      return (
        <div className="grid grid-cols-5 grid-rows-4 items-center justify-items-center gap-x-1 gap-y-0.5">
          <span className="col-start-3 row-start-1">{pip(4)}</span>
          <span className="col-start-2 row-start-2">{pip(2)}</span>
          <span className="col-start-3 row-start-2">{pip(3)}</span>
          <span className="col-start-4 row-start-2">{pip(5)}</span>
          <span className="col-start-1 row-start-3">{pip(1)}</span>
          <span className="col-start-4 row-start-3">{pip(6)}</span>
          <span className="col-start-1 row-start-4">{pip(0)}</span>
          <span className="col-start-5 row-start-4">{pip(7)}</span>
        </div>
      );
    case "haunted":
      return (
        <div className="flex flex-col items-center gap-1">
          {pip(4)}
          <div className="grid grid-cols-2 gap-1">
            {pip(0)}
            {pip(1)}
            {pip(2)}
            {pip(3)}
          </div>
        </div>
      );
    case "love":
      return (
        <div className="grid grid-cols-7 grid-rows-4 items-center justify-items-center gap-y-0.5">
          <span className="col-start-4 row-start-1">{pip(3)}</span>
          <span className="col-start-3 row-start-2">{pip(2)}</span>
          <span className="col-start-5 row-start-2">{pip(4)}</span>
          <span className="col-start-2 row-start-3">{pip(1)}</span>
          <span className="col-start-6 row-start-3">{pip(5)}</span>
          <span className="col-start-1 row-start-4">{pip(0)}</span>
          <span className="col-start-7 row-start-4">{pip(6)}</span>
        </div>
      );
    case "forest":
      return (
        <div className="flex flex-col items-center gap-1">
          <div className="grid grid-cols-3 gap-1">
            {pip(0)}
            {pip(1)}
            {pip(2)}
            {pip(3)}
            {pip(4)}
            {pip(5)}
            {pip(6)}
            {pip(7)}
            {pip(8)}
          </div>
          <div className="grid grid-cols-3 gap-1">
            {pip(9)}
            <span />
            {pip(10)}
          </div>
        </div>
      );
    case "chairs":
      return (
        <div className="grid grid-cols-5 grid-rows-5 items-center justify-items-center gap-y-0.5">
          <span className="col-start-1 row-start-1">{pip(0)}</span>
          <span className="col-start-5 row-start-1">{pip(1)}</span>
          <span className="col-start-2 row-start-2">{pip(2)}</span>
          <span className="col-start-4 row-start-2">{pip(3)}</span>
          <span className="col-start-3 row-start-3">{pip(4)}</span>
          <span className="col-start-3 row-start-4">{pip(5)}</span>
          <span className="col-start-3 row-start-5">{pip(6)}</span>
        </div>
      );
    case "restaurant":
      return <div className="grid grid-cols-3 gap-1">{slots.map((_, i) => pip(i))}</div>;
    case "restrooms":
      return (
        <div className="flex gap-1.5">
          {pip(0)}
          {pip(1)}
        </div>
      );
  }
}

function MapTile({
  id,
  game,
  className,
}: {
  id: AttractionId;
  game: GameState;
  className?: string;
}) {
  const def = ATTRACTION_DEFS[id];
  const attr = game.attractions[id];
  const complete = isAttractionComplete(id, attr.slots);
  const selectedCardId = useGameStore((s) => s.selectedCardId);
  const exchangeMode = useGameStore((s) => s.exchangeMode);
  const openPark = useGameStore((s) => s.openPark);
  const visit = useGameStore((s) => s.visit);
  const { visits } = useLegalForSelected();
  const bloomId = useGameStore((s) => s.bloomId);
  const hot = attractionIsHot(game, id, selectedCardId, exchangeMode);
  const canVisit = visits.includes(id);
  const Icon = ICONS[id];
  const filled = filledCount(attr.slots);
  const celebrating = bloomId === id;
  const wide = id === "coaster";

  return (
    <button
      type="button"
      onClick={() => {
        if (canVisit) visit(id);
        else openPark(id);
      }}
      className={cn(
        "park-tile relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border px-2 py-2 text-center shadow-soft transition-[transform,box-shadow,border-color] duration-150",
        TILE_THEME[id],
        complete ? "tile-won attraction-lit" : hot ? "tile-hot" : "border-border/80",
        canVisit && "tile-hot",
        bloomId === id && "attraction-bloom",
        className,
      )}
      aria-label={`${def.name}, ${complete ? "conseguido" : attractionProgress(id, attr.slots)}`}
    >
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-1.5">
        <Icon
          className={cn(
            "shrink-0",
            wide ? "size-10" : "size-8",
            complete ? "text-good" : "text-accent",
          )}
          strokeWidth={1.85}
        />
        <MiniShape id={id} slots={attr.slots} />
      </div>
      <div className="mt-1 shrink-0 leading-tight">
        <p className="font-display text-[12px] font-medium tracking-tight text-fg sm:text-[13px]">
          {def.name}
        </p>
        <p
          className={cn(
            "text-[10px] font-semibold tabular-nums",
            complete ? "text-good" : "text-muted",
          )}
        >
          {complete ? "Conseguido" : `${filled}/${def.slotCount}`}
        </p>
      </div>
      {celebrating ? <RideFinale id={id} /> : null}
      {complete && !celebrating ? (
        <span className="tile-won-stamp"><span className="tile-won-label">Conseguido</span></span>
      ) : null}
      {attr.visitors.length > 0 ? (
        <span className="absolute right-1.5 top-1.5 z-[2] text-[9px] font-bold text-accent">
          +{attr.visitors.length}
        </span>
      ) : null}
    </button>
  );
}

function EntranceTile({ game, className }: { game: GameState; className?: string }) {
  const exchange = useGameStore((s) => s.exchange);
  const { exchanges } = useLegalForSelected();
  const swapFx = useGameStore((s) => s.swapFx);

  return (
    <section
      className={cn(
        "park-entrance flex h-full min-h-0 flex-col rounded-2xl border border-border/80 px-2 py-2 shadow-soft",
        className,
      )}
    >
      <div className="flex min-h-0 flex-1 items-center justify-center gap-2">
        {game.entrance.map((card, i) => {
          const index = i as 0 | 1;
          const down = game.entranceFaceDown[index];
          const canSwap = exchanges.some((t) => t.kind === "entrance" && t.index === index);
          if (down) {
            return <PlayingCard key={`${card.id}-down`} faceDown size="sm" />;
          }
          return (
            <PlayingCard
              key={card.id}
              card={card}
              size="sm"
              legal={canSwap}
              className={swapFx?.outgoing.id === card.id ? "card-swap-in" : undefined}
              onClick={canSwap ? () => exchange({ kind: "entrance", index }) : undefined}
            />
          );
        })}
      </div>
      <p className="mt-1 shrink-0 text-center font-display text-[12px] font-medium leading-tight tracking-tight text-fg sm:text-[13px]">
        Entrada
      </p>
    </section>
  );
}

export function Park({ game }: { game: GameState }) {
  const openAttraction = useGameStore((s) => s.openAttraction);
  const aiThinking = useGameStore((s) => s.aiThinking);
  const name = game.names[game.currentPlayer];

  return (
    <div className="relative h-full min-h-0">
      <img
        src="/images/park-cover.png"
        alt=""
        className="park-cover"
      />
      <div className="park-vignette" />
      <div className="relative grid h-full min-h-0 grid-cols-3 grid-rows-[auto_1fr_1fr_1fr] gap-1.5 p-2">
        <p className="turn-banner col-span-3 truncate px-3 py-1 text-center text-[11px] text-muted">
          <span className="font-semibold text-fg">
            {aiThinking ? `${game.names[1]} piensa` : game.pendingAdvance ? "¡Atracción conseguida!" : `Turno de ${name}`}
          </span>
          <span className="mx-1.5 text-faint">·</span>
          <span className="tabular-nums">Mazo {game.deck.length}</span>
          {game.lastMessage ? (
            <>
              <span className="mx-1.5 text-faint">·</span>
              {game.lastMessage}
            </>
          ) : null}
        </p>
        <MapTile id="coaster" game={game} className="col-span-2" />
        <MapTile id="haunted" game={game} />
        <MapTile id="love" game={game} />
        <MapTile id="forest" game={game} />
        <MapTile id="chairs" game={game} />
        <MapTile id="restaurant" game={game} />
        <MapTile id="restrooms" game={game} />
        <EntranceTile game={game} />
      </div>
      {openAttraction ? <AttractionSheet id={openAttraction} game={game} /> : null}
    </div>
  );
}
