import { useEffect, useState } from "react";

export const OPENING_SEEN_KEY = "poker-park.opening-seen.v1";
export type OpeningStage = "loading" | "studio" | "ticket" | "tearing" | "validated" | "flying" | "sun" | "title" | "landing" | "ready";
let visitedMenu = false;

export function useOpeningSequence() {
  const [stage, setStage] = useState<OpeningStage>("loading");
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    let seen = false;
    try { seen = localStorage.getItem(OPENING_SEEN_KEY) === "seen"; } catch { /* Private browsing still works. */ }
    setStage(visitedMenu || new URL(location.href).searchParams.has("sala") ? "ready" : seen ? "sun" : "studio");
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const next: Partial<Record<OpeningStage, [OpeningStage, number]>> = {
      tearing: ["validated", reduced ? 80 : 560],
      flying: ["sun", reduced ? 180 : 1850],
      sun: ["title", reduced ? 200 : 2700],
      landing: ["ready", reduced ? 80 : 850],
    };
    const transition = next[stage];
    if (!transition) return;
    const timer = window.setTimeout(() => {
      if (transition[0] === "ready") remember();
      setStage(transition[0]);
    }, transition[1]);
    return () => clearTimeout(timer);
  }, [stage, reduced]);

  function remember() {
    visitedMenu = true;
    try { localStorage.setItem(OPENING_SEEN_KEY, "seen"); } catch { /* Optional preference only. */ }
  }
  const skip = () => { remember(); setStage("ready"); };
  return { stage, setStage, reduced, skip, replay: () => setStage("studio") };
}
