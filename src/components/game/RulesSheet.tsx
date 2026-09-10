import { ArrowLeftRight, ChevronDown, MousePointer2, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { loadSecrets, masterTrialsComplete, type Secrets } from "@/lib/game/persist";
import { useGameStore } from "@/store/game-store";

const SECTIONS: Array<{
  title: string;
  body: string;
  visible?: (secrets: Secrets) => boolean;
}> = [
  {
    title: "Objetivo",
    body: "Montar en todas las atracciones posibles, en pareja, con un compañero automático o en solitario, guiados por la baraja francesa. No hay rival: solo el parque que seáis capaces de recorrer.",
  },
  {
    title: "Modo solitario",
    body: "Puedes jugar así en cualquier modo. Usas una sola mano y empiezas con 5 cartas en vez de 3; al abrir el turno robas una más. Después de cada colocación vuelves a jugar tú y conservas el límite de cambios del reto elegido. Un bloqueo cierra la jornada con una confirmación, salvo en Tormenta y 00:13: allí se esperan dos turnos bloqueados para dar tiempo a que cambie el frente.",
  },
  {
    title: "Turno",
    body: "Robas una carta y colocas. Puedes tocar la carta y después su destino, o arrastrarla directamente hasta una atracción o un hueco iluminado; ambos controles hacen exactamente lo mismo. Un intercambio no gasta el turno: cambias una carta, ves el intercambio y luego puedes colocar la carta nueva. Podéis hablar con libertad.",
  },
  {
    title: "Intercambios y aforo",
    body: "Los intercambios son compartidos: 3 en Clásico, 4 en Fácil y Festival, 5 en Noche, Espejo y Tormenta, y 6 en 00:13. Puedes pulsar Cambiar y elegir tu carta, o elegir primero la carta y después pulsar Cambiar. Luego escoge qué carta recibes de la entrada o de una atracción, si se mantiene la estructura. Tras el cambio sigues tú y debes colocar la carta nueva. La primera entrada se cierra al quedar una maniobra; la segunda, al agotar el límite.",
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
    body: "Se desbloquea al completar las siete atracciones. El personal de mantenimiento empieza con dos sectores encendidos y dispone de 5 cambios en Clásico o 6 en Fácil. Los cuatro ases siguen dentro del mazo y salen con normalidad. Si el as que necesitas continúa oculto, el Llavero de Ases permite recuperarlo entregando una figura, siempre que pueda colocarse inmediatamente. Cada atracción revisada permite dar corriente a otra. Si no puedes colocar ninguna carta, puedes probar un intercambio o registrar una incidencia para abrir un sector con el generador. Puede jugarse en pareja, con compañero o en solitario.",
    visible: (secrets) => secrets.perfect,
  },
  {
    title: "Poker Park 00:13",
    body: "La jornada final junta espejo, tormenta y luces y concede 6 cambios en Clásico o 7 en Fácil. No hay límite de tiempo: la tormenta solo cierra una atracción durante ese turno. Para que una mala rotación no cierre una partida recuperable, el bloqueo espera dos rondas completas: dos turnos sin jugada en solitario o cuatro pases en los modos de dos jugadores.",
    visible: (secrets) => masterTrialsComplete(secrets) || secrets.impossiblePerfect,
  },
];

export function RulesSheet() {
  const open = useGameStore((s) => s.rulesOpen);
  const setRulesOpen = useGameStore((s) => s.setRulesOpen);
  if (!open) return null;
  const secrets = loadSecrets();
  const visibleSections = SECTIONS.filter((section) => section.visible?.(secrets) ?? true);

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
          <li><span>1</span><MousePointer2 aria-hidden /><p><strong>Toca o arrastra</strong><small>una carta de tu mano</small></p></li>
          <li><span>2</span><Sparkles aria-hidden /><p><strong>Busca la luz verde</strong><small>marca destinos válidos</small></p></li>
          <li><span>3</span><ArrowLeftRight aria-hidden /><p><strong>Usa los cambios</strong><small>3–6 según el modo</small></p></li>
        </ol>

        <div className="rules-sections">
          {visibleSections.map((section, index) => (
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
