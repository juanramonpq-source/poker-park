import { useEffect, useRef } from "react";
import { FerrisWheel, MoonStar } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ParkEndingReveal({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialog.current?.showModal();
    return () => dialog.current?.close();
  }, []);

  return (
    <dialog
      ref={dialog}
      className="park-ending-reveal"
      aria-labelledby="park-ending-title"
      onCancel={event => event.preventDefault()}
    >
      <section className="park-ending-card stagger-in">
        <div className="park-ending-sky" aria-hidden><MoonStar /><span /><span /><span /></div>
        <div className="park-ending-wheel" aria-hidden><FerrisWheel /></div>
        <small>Has recorrido todo Poker Park</small>
        <h2 id="park-ending-title">Todo día en el parque llega a su fin</h2>
        <p>Has completado sus seis retos y conocido todas las formas que puede tomar una jornada. Las luces se apagan, las puertas se cierran y el parque guarda lo vivido.</p>
        <p className="park-ending-hint">Tuga, Púa y Burbujas aún pueden reservarte una última despedida.</p>
        <Button size="lg" autoFocus onClick={onClose}>Cerrar las puertas por hoy</Button>
      </section>
    </dialog>
  );
}
