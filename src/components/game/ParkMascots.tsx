import { useEffect, useRef, useState } from "react";
import { playMascot } from "@/lib/game/audio";
import { cn } from "@/lib/utils";

export type MascotId = "turtle" | "hedgehog" | "fish";

const MASCOTS: { id: MascotId; name: string; animal: string }[] = [
  { id: "turtle", name: "Tuga", animal: "la tortuga" },
  { id: "hedgehog", name: "Púa", animal: "el erizo" },
  { id: "fish", name: "Burbujas", animal: "el pez flotante" },
];

const MASCOT_IDS = MASCOTS.map(({ id }) => id);

function MascotButton({
  id,
  className,
  alwaysVisible = false,
  onGreet,
}: {
  id: MascotId;
  className?: string;
  alwaysVisible?: boolean;
  onGreet?: () => void;
}) {
  const mascot = MASCOTS.find((item) => item.id === id)!;
  const [reaction, setReaction] = useState(0);
  const reactionTimer = useRef(0);

  useEffect(() => () => window.clearTimeout(reactionTimer.current), []);

  const greet = () => {
    window.clearTimeout(reactionTimer.current);
    playMascot(id);
    setReaction((value) => value + 1);
    onGreet?.();
    reactionTimer.current = window.setTimeout(() => setReaction(0), 900);
  };

  return (
    <button
      type="button"
      className={cn("mascot-button", alwaysVisible && "is-always-visible", className)}
      onClick={greet}
      aria-label={`Saludar a ${mascot.name}, ${mascot.animal}`}
      title={`Saluda a ${mascot.name}`}
    >
      <span
        key={`${id}-${reaction}`}
        className={cn("mascot-sprite", `mascot-sprite-${id}`, reaction > 0 && "is-reacting")}
        aria-hidden="true"
      />
      {reaction > 0 ? (
        <span key={`fx-${reaction}`} className={cn("mascot-click-fx", `mascot-click-fx-${id}`)} aria-hidden="true">
          <i /><i /><i />
        </span>
      ) : null}
    </button>
  );
}

export function ParkMascots() {
  const [active, setActive] = useState<MascotId | null>(null);
  const last = useRef<MascotId | null>(null);
  const showTimer = useRef(0);
  const hideTimer = useRef(0);
  const greetTimer = useRef(0);

  useEffect(() => {
    let mounted = true;
    const queue = (first = false) => {
      const delay = first ? 4600 + Math.random() * 2600 : 15000 + Math.random() * 14000;
      showTimer.current = window.setTimeout(() => {
        if (!mounted) return;
        const candidates = MASCOT_IDS.filter((id) => id !== last.current);
        const next = candidates[Math.floor(Math.random() * candidates.length)]!;
        last.current = next;
        setActive(next);
        hideTimer.current = window.setTimeout(() => {
          if (!mounted) return;
          setActive(null);
          queue();
        }, 6500);
      }, delay);
    };
    queue(true);
    return () => {
      mounted = false;
      window.clearTimeout(showTimer.current);
      window.clearTimeout(hideTimer.current);
      window.clearTimeout(greetTimer.current);
    };
  }, []);

  if (!active) return null;

  return (
    <div className="park-mascot-layer">
      <MascotButton
        id={active}
        className={cn("park-mascot", `park-mascot-${active}`)}
        onGreet={() => {
          window.clearTimeout(greetTimer.current);
          greetTimer.current = window.setTimeout(() => setActive(null), 1050);
        }}
      />
    </div>
  );
}

export function MascotParade({ place }: { place: "tally" | "credits" }) {
  return (
    <section className={cn("mascot-parade", `mascot-parade-${place}`)} aria-label="Mascotas de Poker Park">
      <div>
        {MASCOTS.map(({ id }) => <MascotButton key={id} id={id} alwaysVisible />)}
      </div>
      <p>{place === "credits" ? "Tuga · Púa · Burbujas" : "La pandilla acompaña el recuento"}</p>
    </section>
  );
}
