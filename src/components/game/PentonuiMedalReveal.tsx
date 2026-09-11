import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PentonuiMedalReveal({ onClose }: { onClose: () => void }) {
  return (
    <div className="pentonui-medal-reveal" role="dialog" aria-modal="true" aria-labelledby="pentonui-medal-title">
      <div className="pentonui-medal-backdrop" aria-hidden />
      <section className="pentonui-medal-card stagger-in">
        <div className="pentonui-medal-burst" aria-hidden><span /><span /><span /></div>
        <div className="pentonui-medal-seal" aria-hidden>
          <img src="/brand/pentonui-games-icon.png" alt="" />
        </div>
        <small>El parque te reconoce</small>
        <h2 id="pentonui-medal-title">Medalla Pentonúi</h2>
        <p>Has reunido las nueve medallas: dominaste los seis retos y te ganaste la amistad de Tuga, Púa y Burbujas.</p>
        <div className="pentonui-medal-legend"><Sparkles aria-hidden /> Ya formas parte de Poker Park</div>
        <Button size="lg" autoFocus onClick={onClose}>Guardar en mi colección</Button>
      </section>
    </div>
  );
}
