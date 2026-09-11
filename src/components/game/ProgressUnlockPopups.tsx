import { useEffect, useRef, useState } from "react";
import { Crown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { hasMasterPass, loadSecrets, masterTrialsComplete, type Secrets } from "@/lib/game/persist";

type UnlockPopup = "master-pass" | "ultimate" | null;

export function ProgressUnlockPopups({ active }: { active: boolean }) {
  const previousSecrets = useRef<Secrets | null>(null);
  const [popup, setPopup] = useState<UnlockPopup>(null);

  useEffect(() => {
    if (!active) {
      previousSecrets.current = null;
      setPopup(null);
      return;
    }

    previousSecrets.current = loadSecrets();
    const timer = window.setInterval(() => {
      const previous = previousSecrets.current;
      const next = loadSecrets();
      if (!previous) {
        previousSecrets.current = next;
        return;
      }

      if (!hasMasterPass(previous) && hasMasterPass(next)) {
        setPopup((current) => current ?? "master-pass");
      } else if (!masterTrialsComplete(previous) && masterTrialsComplete(next)) {
        setPopup((current) => current ?? "ultimate");
      }
      previousSecrets.current = next;
    }, 180);

    return () => window.clearInterval(timer);
  }, [active]);

  if (!active || !popup) return null;

  const isMasterPass = popup === "master-pass";
  return (
    <div className="tutorial-overlay progression-unlock-overlay" role="dialog" aria-modal="true" aria-labelledby="progression-unlock-title">
      <button className="tutorial-backdrop" type="button" aria-label="Cerrar desbloqueo" onClick={() => setPopup(null)} />
      <section className="tutorial-card progression-unlock-card text-center">
        <div className="mx-auto mb-4 grid size-14 place-items-center rounded-full border border-accent/40 bg-accent/10 text-accent">
          {isMasterPass ? <Crown aria-hidden /> : <Sparkles aria-hidden />}
        </div>
        <p className="tutorial-kicker">{isMasterPass ? "Nuevo mapa secreto" : "La última puerta"}</p>
        <h2 id="progression-unlock-title">{isMasterPass ? "Pase Maestro desbloqueado" : "El reto definitivo ha aparecido"}</h2>
        <p className="tutorial-choice-copy">
          {isMasterPass
            ? "Has demostrado que puedes cuidar Poker Park incluso de noche. El parque te abre ahora su mapa secreto: nuevos retos, nuevas reglas y nuevas sorpresas te esperan."
            : "Has superado los tres retos del Pase Maestro. El parque ya no tiene nada más que enseñarte… salvo aquello que nunca debió abrirse."}
        </p>
        {!isMasterPass ? <p className="mt-3 font-display text-xl text-accent">Poker Park 00:13 está disponible.</p> : null}
        <Button size="lg" className="mt-5 w-full" onClick={() => setPopup(null)}>
          {isMasterPass ? "Abrir el mapa" : "Aceptar el reto"}
        </Button>
      </section>
    </div>
  );
}
