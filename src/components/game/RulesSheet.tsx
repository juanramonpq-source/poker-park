import { ArrowLeftRight, ChevronDown, MousePointer2, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGameStore } from "@/store/game-store";

const SECTIONS = [
  {
    title: "Objetivo",
    body: "Montar en todas las atracciones posibles durante una jornada en pareja. No hay ganador: solo el parque que seáis capaces de crear juntos.",
  },
  {
    title: "Turno",
    body: "Robas una carta y colocas. Un intercambio no gasta el turno: cambias una carta, ves el intercambio y luego puedes colocar la carta nueva. Podéis hablar con libertad.",
  },
  {
    title: "Intercambios y aforo",
    body: "Solo 3 intercambios en toda la partida, compartidos. Puedes pulsar Cambiar y elegir tu carta, o elegir primero la carta de tu mano y después pulsar Cambiar. Luego escoge qué carta recibes de la entrada o de una atracción, si se mantiene la estructura. Tras el cambio sigues tú: coloca la carta que entra. El segundo cierra la primera carta de la entrada; el tercero cierra la segunda. Aforo completo: no hay más intercambios.",
  },
  {
    title: "Atracciones",
    body: "Montaña Rusa: números de menor a mayor, sin saltos, empezando por un 2 o un 3; recorre subidas, un looping y la bajada. Casa del Terror: 4 picas de número y el as de picas de tejado. Túnel del Amor: arco de 7 corazones de número, as en la cumbre. Bosque Encantado: 3×3 de tréboles y diamantes de número, as de diamantes al centro, y debajo dos columnas de diamantes en la entrada. Sillas Voladoras: primero las 3 picas de la torre; las 4 figuras solo cuando la base está lista. Restaurante: números con el as de tréboles al centro. Aseos: un rey y una reina juntos.",
  },
  {
    title: "Figuras",
    body: "Jotas, reinas y reyes no son palos ni números: no rellenan la montaña rusa, el túnel, el bosque, la casa ni el restaurante. Van a las Sillas Voladoras (cuando ya está la torre), a los Aseos (rey y reina) o se quedan en la mano hasta los visitantes. Si se te acumulan, un intercambio puede salvar el día.",
  },
  {
    title: "Visitantes",
    body: "Cuando ya no se puedan completar más atracciones, las figuras que queden pueden sentarse en las que estén abiertas. No es obligatorio.",
  },
  {
    title: "El día",
    body: "1–2 atracciones, día improvisado. 3–5, día divertido. 6–7, día inolvidable. El parque queda tal como esté.",
  },
  {
    title: "La Noche de Guardia",
    body: "Se desbloquea al completar las siete atracciones. Sois el personal de mantenimiento y empezáis con dos sectores encendidos. Cada atracción revisada permite dar corriente a otra. Si no existe ninguna maniobra obligatoria, el generador abre un sector y el mismo turno continúa. El informe final cuenta revisiones e incidencias.",
  },
];

export function RulesSheet() {
  const open = useGameStore((s) => s.rulesOpen);
  const setRulesOpen = useGameStore((s) => s.setRulesOpen);
  if (!open) return null;

  return (
    <div className="rules-overlay">
      <button
        type="button"
        className="rules-backdrop"
        aria-label="Cerrar reglas"
        onClick={() => setRulesOpen(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="rules-title"
        className="rules-sheet"
      >
        <div className="rules-heading">
          <div>
            <p>Guía de juego</p>
            <h2 id="rules-title">Cómo recorrer el parque</h2>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="rules-close"
            onClick={() => setRulesOpen(false)}
            aria-label="Cerrar"
          >
            <X aria-hidden />
          </Button>
        </div>

        <ol className="rules-quickstart" aria-label="Resumen en tres pasos">
          <li><span>1</span><MousePointer2 aria-hidden /><p><strong>Elige una carta</strong><small>de tu propia mano</small></p></li>
          <li><span>2</span><Sparkles aria-hidden /><p><strong>Busca la luz verde</strong><small>marca destinos válidos</small></p></li>
          <li><span>3</span><ArrowLeftRight aria-hidden /><p><strong>Usa los cambios</strong><small>solo hay tres</small></p></li>
        </ol>

        <div className="rules-sections">
          {SECTIONS.map((section, index) => (
            <details key={section.title} open={index === 0}>
              <summary>
                <span>{section.title}</span>
                <ChevronDown aria-hidden />
              </summary>
              <p>{section.body}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
