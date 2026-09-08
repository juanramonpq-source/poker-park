import { Check, Code2, RotateCcw, Sparkles, UnlockKeyhole, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function DeveloperMenu({
  onClose,
  onUnlockAll,
  onReset,
}: {
  onClose: () => void;
  onUnlockAll: () => void;
  onReset: () => void;
}) {
  const [unlocked, setUnlocked] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const unlock = () => {
    onUnlockAll();
    setUnlocked(true);
  };

  return (
    <div className="developer-layer" role="dialog" aria-modal="true" aria-labelledby="developer-title">
      <button type="button" className="developer-backdrop" onClick={onClose} aria-label="Cerrar menú de desarrollador" />
      <section className="developer-card">
        <header><span><Code2 /></span><div><small>Herramientas internas</small><h2 id="developer-title">Menú de desarrollador</h2></div><Button size="icon" variant="ghost" onClick={onClose} aria-label="Cerrar"><X /></Button></header>
        <p>Permite probar toda la progresión sin alterar las reglas de las partidas.</p>
        <div className="developer-actions">
          <button type="button" onClick={unlock}>
            <span><UnlockKeyhole /></span>
            <span><strong>Desbloquear todo</strong><small>Activa Noche, Pase Maestro, 00:13 y todas las recompensas.</small></span>
            {unlocked ? <Check /> : <Sparkles />}
          </button>
          <button type="button" className="is-danger" onClick={() => setConfirmReset(true)}>
            <span><RotateCcw /></span>
            <span><strong>Resetear Poker Park</strong><small>Borra la partida, tutorial, secretos e insignias de este dispositivo.</small></span>
          </button>
        </div>
        {confirmReset ? (
          <div className="developer-confirm">
            <p>¿Volver al juego completamente nuevo?</p>
            <div><Button variant="secondary" onClick={() => setConfirmReset(false)}>Cancelar</Button><Button onClick={onReset}>Sí, resetear</Button></div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
