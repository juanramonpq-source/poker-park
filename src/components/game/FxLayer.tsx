import { useEffect, useRef, useState } from "react";
import { PlayingCard } from "@/components/game/PlayingCard";
import { useGameStore, type FxEvent } from "@/store/game-store";

interface Spark {
  id: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  size: number;
  delay: number;
  duration: number;
  hue: string;
}

let sparkSeq = 0;

function reducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

interface Confetti {
  id: number;
  left: number;
  delay: number;
  duration: number;
  rot: number;
  dx: number;
  w: number;
  h: number;
  color: string;
}

function spawnConfetti(): Confetti[] {
  const colors = ["#d6453d", "#2f9e5f", "#ffe14a", "#6ec8f0", "#ff8fb7", "#fff8ec"];
  return Array.from({ length: 64 }, (_, i) => ({
    id: ++sparkSeq,
    left: Math.random() * 100,
    delay: Math.random() * 280,
    duration: 1800 + Math.random() * 1400,
    rot: 180 + Math.random() * 520,
    dx: (Math.random() - 0.5) * 120,
    w: 6 + Math.random() * 8,
    h: 10 + Math.random() * 12,
    color: colors[i % colors.length]!,
  }));
}

function spawn(kind: FxEvent["kind"]): Spark[] {
  const n = kind === "complete" || kind === "end" ? 36 : kind === "deal" ? 18 : 14;
  const out: Spark[] = [];
  const cx = 40 + Math.random() * 20;
  const cy = kind === "end" ? 36 : 46 + Math.random() * 14;
  const hues =
    kind === "complete"
      ? ["var(--color-accent)", "var(--color-good)", "#ffe7a0"]
      : kind === "exchange"
        ? ["var(--color-accent)", "var(--color-sky)"]
        : ["var(--color-accent)", "#ffe7a0"];
  for (let i = 0; i < n; i++) {
    const a = (Math.PI * 2 * i) / n + Math.random() * 0.45;
    const dist = kind === "place" ? 32 + Math.random() * 40 : 56 + Math.random() * 80;
    out.push({
      id: ++sparkSeq,
      x: cx + (Math.random() - 0.5) * 14,
      y: cy + (Math.random() - 0.5) * 12,
      dx: Math.cos(a) * dist,
      dy: Math.sin(a) * dist - 16,
      size: kind === "complete" ? 3 + Math.random() * 4 : 2 + Math.random() * 2.4,
      delay: Math.random() * 90,
      duration: 560 + Math.random() * 480,
      hue: hues[i % hues.length]!,
    });
  }
  return out;
}

export function FxLayer() {
  const fx = useGameStore((s) => s.fx);
  const swapFx = useGameStore((s) => s.swapFx);
  const [sparks, setSparks] = useState<Spark[]>([]);
  const [confetti, setConfetti] = useState<Confetti[]>([]);
  const [flash, setFlash] = useState<"off" | "soft" | "hard">("off");
  const [ring, setRing] = useState(false);
  const lastTime = useRef(0);
  const trauma = useRef(0);
  const raf = useRef(0);

  useEffect(() => {
    const tick = (t: number) => {
      const dt = lastTime.current ? Math.min(0.05, (t - lastTime.current) / 1000) : 0.016;
      lastTime.current = t;
      trauma.current = Math.max(0, trauma.current - dt * 2.4);
      const el = document.getElementById("park-stage");
      if (el) {
        if (reducedMotion() || trauma.current <= 0.002) {
          el.style.transform = "";
        } else {
          const s = trauma.current * trauma.current;
          el.style.transform = `translate(${Math.sin(t * 0.053) * s * 7}px, ${Math.cos(t * 0.041) * s * 5}px)`;
        }
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, []);

  useEffect(() => {
    if (!fx) return;
    if (reducedMotion()) {
      if (fx.kind === "complete" || fx.kind === "end") setFlash("soft");
      return;
    }
    setSparks(spawn(fx.kind));
    if (fx.kind === "complete") setConfetti(spawnConfetti());
    const add =
      fx.kind === "complete" ? 0.48 : fx.kind === "end" ? 0.32 : fx.kind === "exchange" ? 0.22 : 0.16;
    trauma.current = Math.min(1, trauma.current + add);
    if (fx.kind === "complete" || fx.kind === "end") {
      setFlash("hard");
      setRing(true);
    } else if (fx.kind === "place") {
      setFlash("soft");
    }
    const clear = window.setTimeout(() => {
      setSparks([]);
      setConfetti([]);
    }, fx.kind === "complete" ? 3200 : 1200);
    return () => window.clearTimeout(clear);
  }, [fx]);

  useEffect(() => {
    if (flash === "off") return;
    const id = window.setTimeout(() => setFlash("off"), flash === "hard" ? 340 : 180);
    return () => window.clearTimeout(id);
  }, [flash]);

  useEffect(() => {
    if (!ring) return;
    const id = window.setTimeout(() => setRing(false), 700);
    return () => window.clearTimeout(id);
  }, [ring]);

  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden" aria-hidden>
      {flash !== "off" ? <div className={flash === "hard" ? "fx-flash" : "fx-flash-soft"} /> : null}
      {ring ? <div className="fx-ring" /> : null}
      {swapFx ? (
        <div key={swapFx.n} className="swap-stage">
          <div className="swap-card swap-from">
            <PlayingCard card={swapFx.outgoing} size="md" />
          </div>
          <div className="swap-card swap-to">
            <PlayingCard card={swapFx.incoming} size="md" />
          </div>
        </div>
      ) : null}
      {confetti.map((bit) => (
        <span
          key={bit.id}
          className="fx-confetti"
          style={{
            left: `${bit.left}%`,
            width: bit.w,
            height: bit.h,
            background: bit.color,
            animationDelay: `${bit.delay}ms`,
            animationDuration: `${bit.duration}ms`,
            ["--dx" as string]: `${bit.dx}px`,
            ["--rot" as string]: `${bit.rot}deg`,
          }}
        />
      ))}
      {sparks.map((spark) => (
        <span
          key={spark.id}
          className="fx-spark"
          style={{
            left: `${spark.x}%`,
            top: `${spark.y}%`,
            width: spark.size,
            height: spark.size,
            background: spark.hue,
            animationDelay: `${spark.delay}ms`,
            animationDuration: `${spark.duration}ms`,
            ["--dx" as string]: `${spark.dx}px`,
            ["--dy" as string]: `${spark.dy}px`,
          }}
        />
      ))}
    </div>
  );
}
