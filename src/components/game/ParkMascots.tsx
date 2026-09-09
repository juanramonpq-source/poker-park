import { useEffect, useRef, useState, type CSSProperties } from "react";
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
  style,
  alwaysVisible = false,
  onGreet,
}: {
  id: MascotId;
  className?: string;
  style?: CSSProperties;
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
      style={style}
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

export function MenuMascots() {
  const [active, setActive] = useState<MascotId | null>(null);
  const [anchor, setAnchor] = useState<{ x: number; y: number } | null>(null);
  const last = useRef<MascotId | null>(null);
  const target = useRef<HTMLElement | null>(null);
  const perchRatio = useRef(0.5);
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

  useEffect(() => {
    if (!active) {
      target.current = null;
      setAnchor(null);
      return;
    }

    const visible = (element: Element) => {
      const rect = element.getBoundingClientRect();
      return rect.width >= 44 && rect.height >= 36 && rect.bottom > 36 && rect.top < window.innerHeight - 16;
    };

    const updateAnchor = (forceTarget = false) => {
      const dialogs = Array.from(document.querySelectorAll<HTMLElement>('[role="dialog"]')).filter(visible);
      const root = dialogs.at(-1) ?? document.querySelector<HTMLElement>(".title-panel");
      if (!root) return setAnchor(null);
      const candidates = Array.from(root.querySelectorAll<HTMLElement>("button:not(:disabled)"))
        .filter((button) => {
          const label = button.getAttribute("aria-label")?.toLocaleLowerCase("es") ?? "";
          return visible(button) && !label.startsWith("cerrar") && !button.matches(".mascot-button, [class*='backdrop'], .title-studio-badge");
        });
      if (forceTarget || !target.current || !candidates.includes(target.current)) {
        target.current = candidates[Math.floor(Math.random() * candidates.length)] ?? null;
        perchRatio.current = 0.32 + Math.random() * 0.36;
      }
      if (!target.current) return setAnchor(null);
      const rect = target.current.getBoundingClientRect();
      setAnchor({
        x: Math.min(window.innerWidth - 26, Math.max(26, rect.left + rect.width * perchRatio.current)),
        y: Math.min(window.innerHeight - 34, Math.max(32, rect.top + 2)),
      });
    };

    const frame = window.requestAnimationFrame(() => updateAnchor(true));
    const observer = new MutationObserver(() => updateAnchor());
    const reposition = () => updateAnchor();
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [active]);

  if (!active || !anchor) return null;

  return (
    <div className="menu-mascot-layer" aria-live="polite">
      <MascotButton
        id={active}
        className={cn("menu-mascot-perch", `menu-mascot-${active}`)}
        style={{ left: anchor.x, top: anchor.y }}
        onGreet={() => {
          window.clearTimeout(greetTimer.current);
          greetTimer.current = window.setTimeout(() => setActive(null), 1050);
        }}
      />
    </div>
  );
}

export function MascotParade({ place, celebration = false }: { place: "tally" | "credits"; celebration?: boolean }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrent((value) => (value + 1) % MASCOTS.length);
    }, 3600);
    return () => window.clearInterval(timer);
  }, []);

  const mascot = MASCOTS[current]!;

  return (
    <section className={cn("mascot-parade", `mascot-parade-${place}`)} aria-label="Mascotas de Poker Park">
      {celebration ? (
        <div className="mascot-perfect-party">
          {MASCOTS.map(({ id }) => <MascotButton key={id} id={id} className="mascot-party-member" alwaysVisible />)}
        </div>
      ) : (
        <div className="mascot-parade-stage">
          <MascotButton key={mascot.id} id={mascot.id} className="mascot-parade-current" alwaysVisible />
        </div>
      )}
      <p>{celebration ? <strong>¡Las tres celebran el parque perfecto!</strong> : <><strong>{mascot.name}</strong> · Mascota de Poker Park</>}</p>
    </section>
  );
}
