import { Archive, ArrowDown, ArrowDownToLine, ArrowLeftRight, ArrowRight, Check, Clock3, CloudLightning, FerrisWheel, FlipHorizontal2, Ghost, Heart, KeyRound, Lightbulb, RollerCoaster, Trees, Users, UtensilsCrossed } from "lucide-react";
import type { ReactNode } from "react";
import type { GameChallenge } from "@/lib/game/types";

type MasterMode = Exclude<GameChallenge, "classic" | "night">;

function GuideCard({ value, red = false }: { value: string; red?: boolean }) {
  return <span className={`guide-card${red ? " is-red" : ""}${value.length > 2 ? " is-wide" : ""}`}>{value}</span>;
}

function Arrow() {
  return <ArrowRight className="guide-arrow" aria-hidden />;
}

function MirrorStep({ icon, title, children, result }: { icon: ReactNode; title: string; children: ReactNode; result: string }) {
  return <div className="guide-mirror-step">
    <span className="guide-ride-label">{icon}{title}</span>
    <div className="guide-step-cards">{children}</div>
    <ArrowDown className="guide-arrow" aria-hidden />
    <p>{result}</p>
  </div>;
}

export function MasterModeGuide({ mode }: { mode: MasterMode }) {
  return <section className={`master-guide guide-${mode}`} aria-label="Guía visual del reto">
    <p className="guide-goal"><FerrisWheel aria-hidden /><strong>Tu meta: completar las 7 atracciones</strong><Check aria-hidden /></p>
    {mode === "festival" ? <>
      <p className="guide-caption">Cambia de atracción y enciende la cadena</p>
      <div className="guide-flow guide-festival-chain" aria-label="Montaña Rusa: combo uno. Amor: combo dos. Bosque: combo tres.">
        <div className="guide-stop"><RollerCoaster aria-hidden /><b>×1</b><small>Montaña</small></div><Arrow />
        <div className="guide-stop"><Heart aria-hidden /><b>×2</b><small>Amor</small></div><Arrow />
        <div className="guide-stop"><Trees aria-hidden /><b>×3</b><small>Bosque</small></div>
      </div>
      <p className="guide-note"><Lightbulb aria-hidden />Repetir dos veces seguidas → parque cerrado y reto fallido.</p>
      <p className="guide-note">Última atracción en rojo. Coloca en otra para poder volver.</p>
    </> : null}
    {mode === "mirror" ? <>
      <p className="guide-caption">Empieza por el otro extremo</p>
      <div className="guide-coaster">
        <span className="guide-ride-label"><RollerCoaster aria-hidden />Montaña Rusa · desde la salida</span>
        <div className="guide-flow"><GuideCard value="10" /><span>o</span><GuideCard value="9" /><Arrow /><span className="guide-minus">−1</span><Arrow /><span className="guide-minus">−1</span><span>…</span></div>
      </div>
      <div className="guide-mirror-grid">
        <MirrorStep icon={<Ghost aria-hidden />} title="Terror" result="Tejado → casa"><GuideCard value="A♠" /></MirrorStep>
        <MirrorStep icon={<Heart aria-hidden />} title="Amor" result="Cumbre → ambos lados"><GuideCard value="A♥" red /></MirrorStep>
        <MirrorStep icon={<UtensilsCrossed aria-hidden />} title="Restaurante" result="Centro → números"><GuideCard value="A♣" /></MirrorStep>
        <MirrorStep icon={<Trees aria-hidden />} title="Bosque" result="2 columnas → claro"><GuideCard value="♦" red /><GuideCard value="♦" red /></MirrorStep>
        <MirrorStep icon={<FerrisWheel aria-hidden />} title="Sillas" result="Luego, la torre"><GuideCard value="J/Q/K" /><span className="guide-count">×4</span></MirrorStep>
        <MirrorStep icon={<Users aria-hidden />} title="Aseos" result="La reina primero"><GuideCard value="Q" /><Arrow /><GuideCard value="K" /></MirrorStep>
      </div>
    </> : null}
    {mode === "storm" ? <>
      <p className="guide-caption">La lluvia cambia de sector en cada turno</p>
      <div className="guide-flow guide-weather-flow">
        <div className="guide-stop is-raining"><CloudLightning aria-hidden /><b>Cerrado</b><small>Juega en otro</small></div><Arrow />
        <div className="guide-stop"><ArrowDownToLine aria-hidden /><b>Coloca</b><small>Avanza el turno</small></div><Arrow />
        <div className="guide-stop is-raining"><CloudLightning aria-hidden /><b>Siguiente</b><small>Mira el pronóstico</small></div>
      </div>
      <p className="guide-note"><Check aria-hidden />Las cartas colocadas permanecen a salvo.</p>
      <p className="guide-note"><Clock3 aria-hidden />Bloqueo por lluvia: 2 turnos solo · 4 pases en pareja.</p>
    </> : null}
    {mode === "impossible" ? <>
      <p className="guide-caption">Los tres retos actúan a la vez</p>
      <div className="guide-combined">
        <div className="guide-stop"><FlipHorizontal2 aria-hidden /><b>Espejo</b><small>Construye al revés</small></div>
        <span className="guide-plus" aria-hidden>+</span>
        <div className="guide-stop is-raining"><CloudLightning aria-hidden /><b>Tormenta</b><small>Un sector cerrado</small></div>
        <span className="guide-plus" aria-hidden>+</span>
        <div className="guide-stop"><Lightbulb aria-hidden /><b>Festival</b><small>Repetir seguido cierra</small></div>
      </div>
      <p className="guide-note"><Clock3 aria-hidden /><strong>00:13 no es una cuenta atrás.</strong></p>
      <p className="guide-note">6 cambios en Clásico · 7 en Fácil.</p>
    </> : null}
    {mode === "festival" || mode === "impossible" ? <p className="guide-note">Planifica el final: reserva huecos en al menos dos atracciones para poder alternar hasta la última carta. Los cambios y pases no borran el rojo; los visitantes opcionales no rompen la cadena.</p> : null}
    {mode !== "festival" ? <div className="guide-support" aria-label="Ayudas del reto">
      <div className="guide-support-row">
        <span className="guide-support-title"><Archive aria-hidden />Caseta de Jotas <small>Solo en solitario</small></span>
        <div className="guide-flow"><GuideCard value="J" /><Arrow /><span className="guide-destination">Caseta</span><Arrow /><span className="guide-destination">Sillas</span></div>
        <p>Al guardarla, robas reemplazo si queda mazo.</p>
        <p><ArrowLeftRight aria-hidden />Caseta ↔ Entrada · gasta 1 cambio.</p>
      </div>
      {mode !== "storm" ? <div className="guide-support-row">
        <span className="guide-support-title"><KeyRound aria-hidden />Llavero de Ases <small>Solo y en pareja</small></span>
        <div className="guide-flow"><span className="guide-labelled-card"><GuideCard value="J/Q/K" /><small>Tu mano</small></span><ArrowLeftRight className="guide-arrow" aria-hidden /><KeyRound className="guide-tool" aria-hidden /><Arrow /><span className="guide-labelled-card"><GuideCard value="A" /><small>Del mazo</small></span></div>
        <p>As que puedas colocar ahora · gasta 1 cambio.</p>
      </div> : null}
    </div> : null}
  </section>;
}
