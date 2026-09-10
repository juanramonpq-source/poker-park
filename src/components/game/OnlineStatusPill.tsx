import { Signal, SignalLow } from "lucide-react";
import { useOnlineGame } from "@/lib/multiplayer/online-game";
import { useGameStore } from "@/store/game-store";

export function OnlineStatusPill() {
  const game = useGameStore((state) => state.game);
  const online = useOnlineGame();
  if (game?.mode !== "online") return null;
  const connected = online.status === "connected";
  return (
    <div
      className={`online-status-pill ${connected ? "is-connected" : "is-reconnecting"}`}
      role="status"
      aria-live="polite"
    >
      {connected ? <Signal aria-hidden /> : <SignalLow aria-hidden />}
      <span>{connected ? `Con ${online.peer?.name || "tu compañero"}` : "Reconectando…"}</span>
    </div>
  );
}
