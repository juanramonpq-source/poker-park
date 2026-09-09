import {
  ATTRACTION_DEFS,
  attractionProgress,
  filledCount,
  isAttractionComplete,
} from "@/lib/game/attractions";
import {
  ArrowLeftRight,
  Check,
  CloudLightning,
  Crown,
  FlipHorizontal2,
  Lightbulb,
  LockKeyhole,
  Map as MapIcon,
  MousePointer2,
  X,
} from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";
import { cardName, isRed } from "@/lib/game/deck";
import { isAttractionStormClosed, isAttractionUnlocked, legalExchanges } from "@/lib/game/engine";
import {
  CHALLENGE_BACKGROUNDS,
  CHALLENGE_NAMES,
  hasMirrorRules,
  nextStormAttraction,
  stormClosedAttraction,
} from "@/lib/game/challenges";
import type { AttractionId, Card, GameState, Suit } from "@/lib/game/types";
import { AttractionSheet, ICONS } from "@/components/game/AttractionBoard";
import { RideFinale } from "@/components/game/RideFinale";
import { PlayingCard } from "@/components/game/PlayingCard";
import { ParkMascots } from "@/components/game/ParkMascots";
import { ParkMapArtwork } from "@/components/game/ParkMapArtwork";
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

function Pip({ card, highlighted = false }: { card: Card | null; highlighted?: boolean }) {
  if (card) {
    return (
      <span
        className={cn(
          "map-pip is-filled",
          isRed(card.suit) ? "bg-suit-red" : "bg-suit-ink",
          highlighted && "is-ai-move",
        )}
      />
    );
  }
  return (
    <span className="map-pip" />
  );
}

function MiniShape({
  id,
  slots,
  highlightIndex,
}: {
  id: AttractionId;
  slots: (Card | null)[];
  highlightIndex?: number | null;
}) {
  const pip = (i: number) => (
    <Pip key={i} card={slots[i] ?? null} highlighted={highlightIndex === i} />
  );
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
  const complete = isAttractionComplete(id, attr.slots, hasMirrorRules(game));
  const locked = !isAttractionUnlocked(game, id);
  const stormClosed = isAttractionStormClosed(game, id);
  const selectedCardId = useGameStore((s) => s.selectedCardId);
  const exchangeMode = useGameStore((s) => s.exchangeMode);
  const openPark = useGameStore((s) => s.openPark);
  const visit = useGameStore((s) => s.visit);
  const { visits } = useLegalForSelected();
  const bloomId = useGameStore((s) => s.bloomId);
  const aiMoveFx = useGameStore((s) => s.aiMoveFx);
  const hot = attractionIsHot(game, id, selectedCardId, exchangeMode);
  const canVisit = visits.includes(id);
  const Icon = ICONS[id];
  const filled = filledCount(attr.slots);
  const celebrating = bloomId === id;
  const showingAiMove = aiMoveFx?.attractionId === id;
  const wide = id === "coaster";
  const unavailable = !locked && Boolean(selectedCardId) && !hot && !canVisit && !complete;

  return (
    <button
      type="button"
      onClick={() => {
        if (locked) return;
        if (canVisit) visit(id);
        else openPark(id);
      }}
      disabled={locked || stormClosed}
      className={cn(
        "park-tile relative flex h-full min-h-0 flex-col overflow-hidden border text-left shadow-soft",
        TILE_THEME[id],
        complete ? "tile-won attraction-lit" : hot ? "tile-hot" : "border-border/80",
        canVisit && "tile-hot",
        unavailable && "tile-unavailable",
        bloomId === id && "attraction-bloom",
        showingAiMove && "tile-ai-move",
        locked && "tile-locked",
        stormClosed && "tile-storm-closed",
        className,
      )}
      aria-label={`${def.name}, ${locked ? "sin suministro" : stormClosed ? "cerrada por lluvia este turno" : complete ? "conseguido" : attractionProgress(id, attr.slots)}${hot || canVisit ? ", disponible para la carta elegida" : ""}`}
      data-attraction-id={id}
      data-card-drop-attraction={id}
    >
      <div className="tile-topline">
        <Icon
          className={cn(
            "tile-icon",
            wide && "is-wide",
            complete && "is-complete",
          )}
          strokeWidth={1.85}
        />
        <span className={cn("tile-progress", complete && "is-complete")}>
          {complete ? <Check aria-hidden /> : `${filled}/${def.slotCount}`}
        </span>
      </div>
      <div className="tile-shape">
        <MiniShape id={id} slots={attr.slots} highlightIndex={showingAiMove ? aiMoveFx.index : null} />
      </div>
      <div className="tile-label">
        <p>{def.name}</p>
        <span className={cn(complete && "text-good", (hot || canVisit) && "text-good")}>
          {locked ? "Sin suministro" : stormClosed ? "Cerrada por lluvia" : complete ? "Revisada" : hot || canVisit ? "Disponible" : "Ver esquema"}
        </span>
      </div>
      {locked ? <span className="tile-lock"><LockKeyhole aria-hidden /><small>Sector cerrado</small></span> : null}
      {stormClosed ? <span className="tile-lock storm-lock"><CloudLightning aria-hidden /><small>Este turno</small></span> : null}
      {celebrating ? <RideFinale id={id} /> : null}
      {complete && !celebrating ? (
        <span className="tile-won-stamp"><span className="tile-won-label">Conseguido</span></span>
      ) : null}
      {attr.visitors.length > 0 ? (
        <span className="absolute right-1.5 top-1.5 z-[2] text-[9px] font-bold text-accent">
          +{attr.visitors.length}
        </span>
      ) : null}
      {showingAiMove ? <span className="ai-move-tile-badge">Jugada CPU</span> : null}
    </button>
  );
}

function EntranceTile({
  game,
  className,
  onOpenAceRack,
}: {
  game: GameState;
  className?: string;
  onOpenAceRack: () => void;
}) {
  const exchange = useGameStore((s) => s.exchange);
  const { exchanges } = useLegalForSelected();
  const swapFx = useGameStore((s) => s.swapFx);

  return (
    <section
      className={cn(
        "park-entrance flex h-full min-h-0 flex-col border border-border/80 shadow-soft",
        className,
      )}
    >
      <div className="entrance-heading">
        <span><ArrowLeftRight aria-hidden /> Entrada</span>
        <small>Intercambio</small>
      </div>
      <div className="entrance-card-stack">
        <div className="entrance-cards-row">
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
        {game.challenge === "night" ? (
          <button
            type="button"
            className="ace-keyring-trigger"
            onClick={onOpenAceRack}
            aria-label={`Abrir Llavero de Ases; quedan ${game.night?.aceRack?.length ?? 0}`}
          >
            <img src="/images/ace-keyring.webp" alt="" />
            <small>Llavero de Ases</small>
            <span>{game.night?.aceRack?.length ?? 0}</span>
          </button>
        ) : null}
      </div>
    </section>
  );
}

const ACE_SUIT_LABELS: Record<Suit, string> = {
  hearts: "Corazones",
  spades: "Picas",
  diamonds: "Diamantes",
  clubs: "Tréboles",
};

const ACE_SUIT_ORDER: Suit[] = ["hearts", "spades", "diamonds", "clubs"];

function AceRackSheet({ game, onClose }: { game: GameState; onClose: () => void }) {
  const exchange = useGameStore((s) => s.exchange);
  const exchangeMode = useGameStore((s) => s.exchangeMode);
  const selectedCardId = useGameStore((s) => s.selectedCardId);
  const { exchanges } = useLegalForSelected();
  const rack = game.night?.aceRack ?? [];
  const selectedCard = game.hands[game.currentPlayer].find((card) => card.id === selectedCardId);
  const rackTargets = exchanges.filter((target) => target.kind === "ace-rack");

  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="ace-rack-layer" role="dialog" aria-modal="true" aria-labelledby="ace-rack-title">
      <button type="button" className="ace-rack-backdrop" onClick={onClose} aria-label="Cerrar Llavero de Ases" />
      <section className="ace-rack-card stagger-in">
        <header>
          <img src="/images/ace-keyring.webp" alt="" />
          <span><small>Equipo de mantenimiento</small><h2 id="ace-rack-title">Llavero de Ases</h2></span>
          <button type="button" onClick={onClose} aria-label="Cerrar"><X aria-hidden /></button>
        </header>
        <p>
          Entrega una jota, reina o rey para tomar un as que pueda colocarse ahora. El cambio consume una maniobra y la figura vuelve al mazo.
        </p>
        <div className="ace-rack-hooks">
          {ACE_SUIT_ORDER.map((suit) => {
            const ace = rack.find((card) => card.suit === suit);
            const canTake = Boolean(ace && rackTargets.some((target) => target.cardId === ace.id));
            return (
              <div key={suit} className={cn("ace-rack-hook", canTake && "is-ready", !ace && "is-empty")}>
                <span className="ace-hook-chain" aria-hidden />
                {ace ? (
                  <PlayingCard
                    card={ace}
                    size="sm"
                    legal={canTake}
                    dimmed={!canTake}
                    onClick={canTake ? () => { exchange({ kind: "ace-rack", cardId: ace.id }); onClose(); } : undefined}
                  />
                ) : <span className="ace-empty-tag">En circulación</span>}
                <small>{ACE_SUIT_LABELS[suit]}</small>
              </div>
            );
          })}
        </div>
        <div className={cn("ace-rack-guide", rackTargets.length > 0 && "is-ready")}>
          {rackTargets.length > 0
            ? `Puedes cambiar ${selectedCard ? cardName(selectedCard) : "la figura elegida"} por ${rackTargets.length === 1 ? "el as iluminado" : "uno de los ases iluminados"}.`
            : exchangeMode && selectedCard
              ? "Ningún as disponible encaja todavía en un sector abierto."
              : "Para usarlo: elige una figura de tu mano y pulsa Cambiar."}
        </div>
      </section>
    </div>,
    document.body,
  );
}

export function Park({ game }: { game: GameState }) {
  const [aceRackOpen, setAceRackOpen] = useState(false);
  const openAttraction = useGameStore((s) => s.openAttraction);
  const aiThinking = useGameStore((s) => s.aiThinking);
  const aiMoveFx = useGameStore((s) => s.aiMoveFx);
  const selectedCardId = useGameStore((s) => s.selectedCardId);
  const exchangeMode = useGameStore((s) => s.exchangeMode);
  const name = game.names[game.currentPlayer];
  const selectedCanExchange = Boolean(
    selectedCardId && !game.swappedCardId && legalExchanges(game, selectedCardId).length,
  );
  const turnLabel =
    game.mode === "ai"
      ? game.currentPlayer === 0
        ? "Tu turno"
        : "Turno del compañero"
      : `Turno de ${name}`;
  const busy = aiThinking || Boolean(aiMoveFx) || game.pendingAdvance;
  const isNight = game.challenge === "night";
  const challenge = game.challenge ?? "classic";
  const stormNow = stormClosedAttraction(game);
  const stormNext = nextStormAttraction(game);
  const step = selectedCardId ? 2 : 1;
  const statusTitle = aiMoveFx
    ? `${game.names[1]} jugó ${cardName(aiMoveFx.card)}`
    : aiThinking
    ? `${game.names[1]} está pensando`
    : game.pendingAdvance
      ? isNight ? "¡Revisión superada!" : "¡Atracción conseguida!"
      : exchangeMode
        ? selectedCardId
          ? "Elige la carta que quieres recibir"
          : "Elige una carta de tu mano"
        : selectedCardId
          ? game.swappedCardId
            ? "Coloca la carta que has recibido"
            : selectedCanExchange
              ? "Colócala o pulsa Cambiar"
              : "Toca una atracción iluminada"
          : isNight ? `${turnLabel} · Guardia nocturna` : turnLabel;
  const statusDetail = aiMoveFx
    ? `${aiMoveFx.kind === "visit" ? "Visitante en" : "Colocada en"} ${ATTRACTION_DEFS[aiMoveFx.attractionId].name}`
    : busy
    ? game.pendingAdvance
      ? isNight ? "Registrando la comprobación" : "Celebrando antes del siguiente turno"
      : "Tu compañero prepara su jugada"
    : selectedCardId
      ? exchangeMode
        ? "Puede estar en la entrada o en una atracción"
        : "Solo se destacan los destinos válidos"
      : exchangeMode
        ? "Será la carta que entregarás"
        : "Después te mostraremos dónde puede colocarse";

  return (
    <div className={cn("park-map-stage relative h-full min-h-0", hasMirrorRules(game) && "mirror-board")}>
      <img
        src={CHALLENGE_BACKGROUNDS[challenge]}
        alt=""
        className={cn("park-cover", isNight && "park-cover-night")}
      />
      <div className="park-vignette" />
      {challenge === "storm" ? <div className="storm-atmosphere" aria-hidden="true" /> : null}
      {challenge === "impossible" ? <div className="void-atmosphere" aria-hidden="true" /> : null}
      <div className="park-map-sheet" data-map-surface={challenge}>
        <ParkMapArtwork challenge={challenge} />
        <div className="park-map-folds" aria-hidden />
        <span className="park-map-signature" aria-hidden>
          <MapIcon /> Plano · {CHALLENGE_NAMES[challenge]}
        </span>
        <div className="park-grid">
          <div className="turn-banner" role="status" aria-live="polite">
            <span className={cn("turn-step", busy && "is-busy")}>
              {busy ? <MousePointer2 aria-hidden /> : step}
            </span>
            <span className="turn-copy"><strong>{statusTitle}</strong><small>{statusDetail}</small></span>
            {challenge === "festival" ? (
              <span className="mode-meter festival-meter"><Lightbulb aria-hidden /><span><small>Meta: 7 · bonus</small><strong>×{game.festival?.combo ?? 0} · {game.festival?.bulbs ?? 0} bombillas</strong></span></span>
            ) : challenge === "mirror" ? (
              <span className="mode-meter mirror-meter"><FlipHorizontal2 aria-hidden /><span><small>Reglas</small><strong>Orden invertido</strong></span></span>
            ) : challenge === "storm" ? (
              <span className="mode-meter storm-meter"><CloudLightning aria-hidden /><span><small>Ahora · después</small><strong>{stormNow ? ATTRACTION_DEFS[stormNow].name : "Despejado"} → {stormNext ? ATTRACTION_DEFS[stormNext].name : "despejado"}</strong></span></span>
            ) : challenge === "impossible" ? (
              <span className="mode-meter impossible-meter"><Crown aria-hidden /><span><small>00:13 · combo ×{game.festival?.combo ?? 0}</small><strong>{stormNow ? ATTRACTION_DEFS[stormNow].name : "Despejado"} → {stormNext ? ATTRACTION_DEFS[stormNext].name : "despejado"}</strong></span></span>
            ) : null}
          </div>
          <MapTile id="coaster" game={game} className="col-span-2" />
          <MapTile id="haunted" game={game} />
          <MapTile id="love" game={game} />
          <MapTile id="forest" game={game} />
          <MapTile id="chairs" game={game} />
          <MapTile id="restaurant" game={game} />
          <MapTile id="restrooms" game={game} />
          <EntranceTile game={game} onOpenAceRack={() => setAceRackOpen(true)} />
        </div>
      </div>
      <ParkMascots />
      {openAttraction ? <AttractionSheet id={openAttraction} game={game} /> : null}
      {aceRackOpen && game.challenge === "night" ? <AceRackSheet game={game} onClose={() => setAceRackOpen(false)} /> : null}
    </div>
  );
}
