import { X } from "lucide-react";
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
    body: "Solo 3 intercambios en toda la partida, compartidos. Cambias una carta de tu mano por otra ya colocada, si se mantiene la estructura. Tras el cambio sigues tú: coloca la carta que entra. El segundo cierra la primera carta de la entrada; el tercero cierra la segunda. Aforo completo: no hay más intercambios.",
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
];

export function RulesSheet() {
  const open = useGameStore((s) => s.rulesOpen);
  const setRulesOpen = useGameStore((s) => s.setRulesOpen);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-bg/70"
        aria-label="Cerrar reglas"
        onClick={() => setRulesOpen(false)}
      />
      <div
        role="dialog"
        aria-labelledby="rules-title"
        className="relative max-h-[86dvh] w-full max-w-md overflow-y-auto rounded-t-xl border border-border bg-surface p-5 shadow-soft sm:rounded-xl"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Reglas</p>
            <h2 id="rules-title" className="font-display text-2xl tracking-tight">
              Cómo se juega
            </h2>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="size-10"
            onClick={() => setRulesOpen(false)}
            aria-label="Cerrar"
          >
            <X className="size-4" />
          </Button>
        </div>
        <div className="flex flex-col gap-4 pb-4">
          {SECTIONS.map((section) => (
            <section key={section.title}>
              <h3 className="text-sm font-medium text-fg">{section.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted">{section.body}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
