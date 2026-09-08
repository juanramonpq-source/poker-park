import { BatteryCharging, LockKeyhole, MoonStar, Wrench } from "lucide-react";
import { ATTRACTION_DEFS } from "@/lib/game/attractions";
import { nightEmergencyAvailable, nightUnlockChoices } from "@/lib/game/engine";
import { useGameStore } from "@/store/game-store";

export function NightUnlockSheet() {
  const game = useGameStore((state) => state.game);
  const unlock = useGameStore((state) => state.unlockNightSector);
  if (!game?.night || game.ended || game.pendingAdvance) return null;

  const emergency = nightEmergencyAvailable(game);
  if (!game.night.pendingUnlock && !emergency) return null;
  const choices = nightUnlockChoices(game);
  if (choices.length === 0) return null;

  return (
    <div className="night-unlock-layer" role="dialog" aria-modal="true" aria-labelledby="night-unlock-title">
      <div className="night-unlock-sky" aria-hidden>
        <span /><span /><span /><span /><span />
      </div>
      <section className="night-unlock-card stagger-in">
        <div className="night-unlock-emblem" aria-hidden>
          {emergency ? <BatteryCharging /> : <MoonStar />}
        </div>
        <p className="night-unlock-kicker">
          {emergency ? "Generador de emergencia" : "Cuadro eléctrico"}
        </p>
        <h2 id="night-unlock-title">
          {emergency ? "Hace falta dar corriente a otro sector" : "Una revisión superada"}
        </h2>
        <p className="night-unlock-copy">
          {emergency
            ? `${game.names[game.currentPlayer]} se ha quedado sin maniobras. Elegid un sector y continuad el mismo turno.`
            : "Como personal de mantenimiento, elegid qué atracción comprobaréis a continuación."}
        </p>
        <div className="night-sector-options">
          {choices.map((id) => (
            <button key={id} type="button" onClick={() => unlock(id)}>
              <span className="night-sector-icon"><LockKeyhole aria-hidden /></span>
              <span>
                <strong>{ATTRACTION_DEFS[id].name}</strong>
                <small>{ATTRACTION_DEFS[id].tagline}</small>
              </span>
              <Wrench aria-hidden />
            </button>
          ))}
        </div>
        <p className="night-incident-note">
          {emergency
            ? `Incidencia ${game.night.emergencyUses + 1}: quedará anotada en el parte final.`
            : `${game.night.unlocked.length} de 7 sectores con suministro.`}
        </p>
      </section>
    </div>
  );
}
