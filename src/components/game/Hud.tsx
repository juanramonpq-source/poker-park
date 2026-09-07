import { ArrowLeftRight, BookOpen, LogOut, MoreHorizontal, UserRound, Volume2, VolumeX } from "lucide-react";
import { useState } from "react";
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
  const [menuOpen, setMenuOpen] = useState(false);

  if (!game) return null;
  const locked = aiThinking || game.pendingAdvance;
  const remaining = MAX_EXCHANGES - game.exchangesUsed;
  const aforo = remaining <= 0;
  const currentName = game.names[game.currentPlayer];

  const openRules = () => {
    setMenuOpen(false);
    setRulesOpen(true);
  };

  const toggleSound = () => {
    toggleMute();
    setMenuOpen(false);
  };

  const exitGame = () => {
    setMenuOpen(false);
    goTitle();
  };

  return (
    <header className="game-hud">
      <div className="hud-bar">
        <div className="player-chip" aria-live="polite">
          <span className="player-avatar" aria-hidden><UserRound /></span>
          <span className="player-copy">
            <small>{aiThinking ? "Pensando" : "Turno"}</small>
            <strong>{currentName}</strong>
          </span>
        </div>

        <div className="hud-actions">
          <div className="deck-chip" aria-label={`${game.deck.length} cartas en el mazo`}>
            <span className="deck-stack" aria-hidden />
            <span><small>Mazo</small><strong>{game.deck.length}</strong></span>
          </div>
          <button
            type="button"
            className={cn("exchange-action", exchangeMode && "is-active")}
            disabled={aforo || locked}
            onClick={toggleExchange}
            aria-pressed={exchangeMode}
            aria-label={aforo ? "Intercambios agotados" : `${remaining} intercambios disponibles`}
          >
            <ArrowLeftRight aria-hidden />
            <span>{aforo ? "Sin cambios" : exchangeMode ? "Cancelar" : "Cambiar"}</span>
            {!aforo ? <strong>{remaining}</strong> : null}
          </button>
          <Button
            size="icon"
            variant="ghost"
            className="hud-menu-trigger"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Abrir opciones"
            aria-expanded={menuOpen}
          >
            <MoreHorizontal aria-hidden />
          </Button>
        </div>
      </div>

      {menuOpen ? (
        <>
          <button type="button" className="hud-menu-backdrop" onClick={() => setMenuOpen(false)} aria-label="Cerrar opciones" />
          <div className="hud-menu-panel" role="menu" aria-label="Opciones de la partida">
            <button type="button" role="menuitem" onClick={openRules}>
              <BookOpen aria-hidden />
              <span><strong>Cómo se juega</strong><small>Consulta las reglas</small></span>
            </button>
            <button type="button" role="menuitem" onClick={toggleSound}>
              {muted ? <VolumeX aria-hidden /> : <Volume2 aria-hidden />}
              <span><strong>{muted ? "Activar sonido" : "Silenciar"}</strong><small>Música y efectos</small></span>
            </button>
            <button type="button" role="menuitem" onClick={exitGame}>
              <LogOut aria-hidden />
              <span><strong>Volver al inicio</strong><small>La partida queda guardada</small></span>
            </button>
          </div>
        </>
      ) : null}
    </header>
  );
}
