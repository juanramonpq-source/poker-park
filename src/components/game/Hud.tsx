import { ArrowLeftRight, BookOpen, Flag, LogOut, MoreHorizontal, UserRound, Volume2, VolumeX, Wrench } from "lucide-react";
import { useState } from "react";
import { exchangeLimit, legalExchanges } from "@/lib/game/engine";
import { cn } from "@/lib/utils";
import { useGameStore } from "@/store/game-store";
import { Button } from "@/components/ui/button";

export function Hud() {
  const game = useGameStore((s) => s.game);
  const muted = useGameStore((s) => s.muted);
  const toggleMute = useGameStore((s) => s.toggleMute);
  const setRulesOpen = useGameStore((s) => s.setRulesOpen);
  const goTitle = useGameStore((s) => s.goTitle);
  const closePark = useGameStore((s) => s.closePark);
  const exchangeMode = useGameStore((s) => s.exchangeMode);
  const selectedCardId = useGameStore((s) => s.selectedCardId);
  const toggleExchange = useGameStore((s) => s.toggleExchange);
  const aiThinking = useGameStore((s) => s.aiThinking);
  const aiMoveFx = useGameStore((s) => s.aiMoveFx);
  const [menuOpen, setMenuOpen] = useState(false);
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);

  if (!game) return null;
  const locked = aiThinking || Boolean(aiMoveFx) || game.pendingAdvance;
  const remaining = exchangeLimit(game) - game.exchangesUsed;
  const aforo = remaining <= 0;
  const selectedCanExchange = selectedCardId
    ? legalExchanges(game, selectedCardId).length > 0
    : true;
  const mustPlaceSwap = Boolean(game.swappedCardId);
  const exchangeDisabled = aforo || locked || mustPlaceSwap || !selectedCanExchange;
  const exchangeReady = Boolean(selectedCardId) && selectedCanExchange && !exchangeMode;
  const currentName = (game.mode === "ai" && game.currentPlayer === 0) || game.mode === "solo"
    ? "Tu turno"
    : game.names[game.currentPlayer];
  const isNight = game.challenge === "night";

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

  const requestClose = () => {
    setMenuOpen(false);
    setCloseConfirmOpen(true);
  };

  const confirmClose = () => {
    setCloseConfirmOpen(false);
    closePark();
  };

  return (
    <header className="game-hud">
      <div className="hud-bar">
        <div className="player-chip" aria-live="polite">
          <span className="player-avatar" aria-hidden>{isNight ? <Wrench /> : <UserRound />}</span>
          <span className="player-copy">
            <small>{aiMoveFx ? "Última revisión" : aiThinking ? "Comprobando" : (game.mode === "ai" && game.currentPlayer === 0) || game.mode === "solo" ? "Ahora" : isNight ? "Guardia" : "Turno"}</small>
            <strong>{aiMoveFx ? game.names[1] : currentName}</strong>
          </span>
        </div>

        <div className="hud-actions">
          <div className="deck-chip" aria-label={`${game.deck.length} cartas en el mazo`}>
            <span className="deck-stack" aria-hidden />
            <span><small>{isNight ? "Parte" : "Mazo"}</small><strong>{game.deck.length}</strong></span>
          </div>
          <button
            type="button"
            className={cn(
              "exchange-action",
              exchangeMode && "is-active",
              exchangeReady && "is-ready",
            )}
            disabled={exchangeDisabled}
            onClick={toggleExchange}
            aria-pressed={exchangeMode}
            aria-label={
              aforo
                ? "Intercambios agotados"
                : mustPlaceSwap
                  ? "Coloca primero la carta recibida"
                  : !selectedCanExchange
                    ? "La carta seleccionada no se puede intercambiar"
                    : exchangeMode
                      ? "Cancelar intercambio"
                      : selectedCardId
                        ? `Intercambiar la carta seleccionada; quedan ${remaining}`
                        : `${remaining} intercambios disponibles`
            }
          >
            <ArrowLeftRight aria-hidden />
            <span>{aforo ? "Sin cambios" : mustPlaceSwap ? "Colócala" : exchangeMode ? "Cancelar" : "Cambiar"}</span>
            {!aforo ? <strong>{remaining}</strong> : null}
          </button>
          <button
            type="button"
            className="close-park-action"
            onClick={requestClose}
            aria-label={isNight ? "Cerrar el turno y ver el recuento" : "Cerrar el parque y ver el recuento"}
          >
            <Flag aria-hidden />
            <span>Cerrar</span>
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
            <button type="button" role="menuitem" onClick={requestClose}>
              <Flag aria-hidden />
              <span><strong>{isNight ? "Cerrar el turno" : "Cerrar el parque"}</strong><small>Terminar y ver el recuento</small></span>
            </button>
            <button type="button" role="menuitem" onClick={exitGame}>
              <LogOut aria-hidden />
              <span><strong>Volver al inicio</strong><small>La partida queda guardada</small></span>
            </button>
          </div>
        </>
      ) : null}
      {closeConfirmOpen ? (
        <div className="close-park-dialog-layer" role="dialog" aria-modal="true" aria-labelledby="close-park-title">
          <div className="close-park-dialog">
            <span className="close-park-emblem" aria-hidden><Flag /></span>
            <p>{isNight ? "Fin de la guardia" : "Última llamada"}</p>
            <h2 id="close-park-title">{isNight ? "¿Cerrar el turno ahora?" : "¿Cerrar el parque ahora?"}</h2>
            <small>Pasarás al recuento con las atracciones completadas hasta este momento.</small>
            <div>
              <Button variant="secondary" onClick={() => setCloseConfirmOpen(false)}>Seguir jugando</Button>
              <Button onClick={confirmClose}>{isNight ? "Cerrar turno" : "Cerrar parque"}</Button>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
