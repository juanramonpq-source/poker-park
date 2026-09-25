import { useEffect, useRef } from "react";
import { Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PentonuiMedalReveal({
  onClose,
  onShare,
  alreadySubmitted = false,
}: {
  onClose: () => void;
  onShare: () => void;
  alreadySubmitted?: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    dialog.current?.showModal();
    return () => dialog.current?.close();
  }, []);

  return (
    <dialog ref={dialog} className="pentonui-medal-reveal" aria-labelledby="pentonui-medal-title" onCancel={event => event.preventDefault()}>
      <div className="pentonui-medal-backdrop" aria-hidden />
      <section className="pentonui-medal-card stagger-in">
        <div className="pentonui-medal-burst" aria-hidden><span /><span /><span /></div>
        <div className="pentonui-medal-seal" aria-hidden>
          <img src="/brand/pentonui-games-icon.png" alt="" />
        </div>
        <small>Final definitivo · Medalla Pentonúi</small>
        <h2 id="pentonui-medal-title">Has llegado al último secreto del parque</h2>
        <p>Gracias por recorrer los seis retos y ganarte la amistad de Tuga, Púa y Burbujas. Muy pocas personas llegan hasta aquí.</p>
        <div className="pentonui-medal-legend"><Sparkles aria-hidden /> Ya formas parte de la historia de Poker Park</div>
        <div className="pentonui-medal-actions">
          <Button size="lg" autoFocus onClick={onShare} disabled={alreadySubmitted}><Send aria-hidden /> {alreadySubmitted ? "Hazaña ya enviada" : "Compartir mi hazaña"}</Button>
          <Button size="lg" variant="secondary" onClick={onClose}>Ahora no</Button>
        </div>
      </section>
    </dialog>
  );
}
