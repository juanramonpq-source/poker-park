import { Copyright, HardDrive, ShieldCheck, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LegalSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <div className="tutorial-overlay legal-overlay" role="dialog" aria-modal="true" aria-labelledby="legal-title">
      <button type="button" className="tutorial-backdrop" aria-label="Cerrar información legal" onClick={onClose} />
      <section className="tutorial-card legal-card">
        <header className="tutorial-heading">
          <div>
            <p className="tutorial-kicker">Poker Park · Versión 1.0</p>
            <h2 id="legal-title">Privacidad y créditos</h2>
          </div>
          <Button size="icon" variant="ghost" onClick={onClose} aria-label="Cerrar información legal">
            <X aria-hidden />
          </Button>
        </header>

        <div className="legal-sections">
          <section>
            <ShieldCheck aria-hidden />
            <div><h3>Juego privado por diseño</h3><p>No crea cuentas, no incluye publicidad ni seguimiento propio y no solicita información personal.</p></div>
          </section>
          <section>
            <HardDrive aria-hidden />
            <div><h3>Progreso en tu dispositivo</h3><p>Las partidas, preferencias y recompensas se guardan únicamente en el almacenamiento local del navegador. Puedes eliminarlas desde el menú de desarrollador o borrando los datos del sitio.</p></div>
          </section>
          <section>
            <Sparkles aria-hidden />
            <div><h3>Una producción original</h3><p>Diseño, música procedural, efectos y recursos del juego han sido creados específicamente para Poker Park. No contiene pistas musicales de terceros.</p></div>
          </section>
          <section>
            <Copyright aria-hidden />
            <div><h3>Pentonúi Games</h3><p>© 2026 Pentonúi Games. Todos los derechos reservados. El alojamiento puede conservar registros técnicos básicos por seguridad y funcionamiento.</p></div>
          </section>
        </div>

        <Button size="lg" className="mt-4 w-full" onClick={onClose}>Entendido</Button>
      </section>
    </div>
  );
}
