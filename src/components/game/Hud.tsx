import { ArrowLeftRight, BookOpen, LogOut, Volume2, VolumeX } from "lucide-react";
import { MAX_EXCHANGES } from "@/lib/game/types";
import { cn } from "@/lib/utils";
import { useGameStore } from "@/store/game-store";
import { Button } from "@/components/ui/button";

export function Hud() {
  const game = useGameStore((s) => s.game);
  const muted = useGameStore((s) => s.muted);
  const toggleMute = useGameStore((s) => s.toggleMute);
  const setRulesOpen = useGameStore((s) => s.setRulesOpen);
  const goTitle = useGameStore((s) => s.goTitle);
  const exchangeMode = useGameStore((s) => s.exchangeMode);
  const toggleExchange = useGameStore((s) => s.toggleExchange);
  const aiThinking = useGameStore((s) => s.aiThinking);

  if (!game) return null;
  const locked = aiThinking || game.pendingAdvance;
  const remaining = MAX_EXCHANGES - game.exchangesUsed;
  const aforo = game.exchangesUsed >= 3;

  return (
    <header className="shrink-0 border-b border-border bg-bg/90 pt-[env(safe-area-inset-top)] backdrop-blur-md">
      <div className="flex items-center justify-end gap-1 px-2 py-1.5">
        <div
          className="deck-chip mr-1 flex h-12 shrink-0 items-center gap-2 rounded-xl border border-border bg-surface px-2.5"
          aria-label={`${game.deck.length} cartas en el mazo`}
        >
          <span className="deck-stack" aria-hidden />
          <span className="leading-none">
            <span className="block text-[9px] font-bold uppercase tracking-wider text-muted">
              Mazo
            </span>
            <span className="block text-lg font-black tabular-nums text-fg">
              {game.deck.length}
            </span>
          </span>
        </div>
        <button
          type="button"
          className={cn(
            "cambio-btn mr-1 inline-flex h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-base font-extrabold tracking-wide text-accent-fg shadow-soft transition-[transform,box-shadow,background-color] duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70",
            "active:not-disabled:scale-[0.97]",
            aforo || locked
              ? "cursor-not-allowed bg-muted/70 opacity-55"
              : exchangeMode
                ? "bg-accent ring-4 ring-accent/35 ring-offset-2 ring-offset-bg"
                : "bg-accent hover:bg-accent/90",
          )}
          disabled={aforo || locked}
          onClick={toggleExchange}
          aria-pressed={exchangeMode}
          aria-label={aforo ? "Aforo completo" : "Intercambiar"}
        >
          <ArrowLeftRight className="size-5 shrink-0" strokeWidth={2.75} />
          <span>{aforo ? "Aforo" : exchangeMode ? "Cambiando" : "Cambio"}</span>
          <span
            className={cn(
              "grid size-6 place-items-center rounded-full text-xs font-black tabular-nums",
              aforo ? "bg-white/20" : "bg-white/30 text-accent-fg",
            )}
          >
            {aforo ? "0" : remaining}
          </span>
        </button>
        <Button
          size="icon"
          variant="ghost"
          className="size-10 text-muted"
          onClick={() => setRulesOpen(true)}
          aria-label="Reglas"
        >
          <BookOpen className="size-4" strokeWidth={1.75} />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="size-10 text-muted"
          onClick={toggleMute}
          aria-label={muted ? "Activar sonido" : "Silenciar"}
        >
          {muted ? (
            <VolumeX className="size-4" strokeWidth={1.75} />
          ) : (
            <Volume2 className="size-4" strokeWidth={1.75} />
          )}
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="size-10 text-muted"
          onClick={goTitle}
          aria-label="Salir"
        >
          <LogOut className="size-4" strokeWidth={1.75} />
        </Button>
      </div>
    </header>
  );
}
