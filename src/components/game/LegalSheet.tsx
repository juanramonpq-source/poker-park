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
            <div><h3>Sin cuentas ni publicidad</h3><p>No necesitas dar tu nombre real. En online usas un apodo y compartes la partida con la persona que entra en tu sala.</p></div>
          </section>
          <section>
            <HardDrive aria-hidden />
            <div><h3>Progreso en tu dispositivo</h3><p>Las copias de partidas, preferencias y recompensas se guardan en el navegador. En online también se comparte el estado con el otro jugador. Puedes borrar los datos del sitio para eliminar el progreso local.</p></div>
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

        <p className="mt-4 text-sm">En online, juega con personas de confianza: la conexión directa puede revelar tu dirección IP al otro jugador. <a className="underline" href="/privacidad.html" target="_blank" rel="noopener noreferrer">Leer la política completa</a>.</p>

        <Button size="lg" className="mt-4 w-full" onClick={onClose}>Entendido</Button>
      </section>
    </div>
  );
}
