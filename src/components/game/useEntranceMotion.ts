import { useEffect, useState } from "react";

/** Presentation only: never writes to the saved game or unlocks. */
export function useEntranceMotion(name: string) {
  const [pace, setPace] = useState<"pending" | "first" | "repeat" | "reduced">("pending");
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let seen = false;
    try {
      seen = localStorage.getItem(`poker-park.motion.${name}`) === "seen";
      localStorage.setItem(`poker-park.motion.${name}`, "seen");
    } catch { /* Animation remains optional when storage is unavailable. */ }
    const update = () => setPace(media.matches ? "reduced" : seen ? "repeat" : "first");
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [name]);
  return pace;
}
