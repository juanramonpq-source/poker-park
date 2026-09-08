import { useEffect } from "react";
import { BlockedSheet } from "@/components/game/BlockedSheet";
import { EndScreen } from "@/components/game/EndScreen";
import { FxLayer } from "@/components/game/FxLayer";
import { Hand } from "@/components/game/Hand";
import { Hud } from "@/components/game/Hud";
import { Park } from "@/components/game/Park";
import { NightUnlockSheet } from "@/components/game/NightUnlockSheet";
import { PassScreen } from "@/components/game/PassScreen";
import { RulesSheet } from "@/components/game/RulesSheet";
import { TitleScreen } from "@/components/game/TitleScreen";
import { useGameStore } from "@/store/game-store";

function PlayingTable() {
  const game = useGameStore((s) => s.game);
  if (!game) return null;
  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-bg">
      <Hud />
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <Park game={game} />
      </div>
      <Hand />
      <NightUnlockSheet />
      <BlockedSheet />
    </div>
  );
}

export function GameApp() {
  const screen = useGameStore((s) => s.screen);
  const hydrate = useGameStore((s) => s.hydrate);
  const game = useGameStore((s) => s.game);
  const nightTheme = useGameStore((s) => s.nightTheme);
  const machineRoomUnlocked = useGameStore((s) => s.machineRoomUnlocked);

  useEffect(() => {
    if (screen === "title") hydrate();
  }, [hydrate, screen]);

  return (
    <div
      className={`${game?.challenge === "night" || nightTheme ? "night-theme" : ""} ${machineRoomUnlocked ? "machine-room-unlocked" : ""}`}
    >
      <div id="park-stage">
        {screen === "title" ? <TitleScreen /> : null}
        {screen === "playing" ? <PlayingTable /> : null}
        {screen === "pass" ? <PassScreen /> : null}
        {screen === "end" ? <EndScreen /> : null}
      </div>
      <FxLayer />
      <RulesSheet />
    </div>
  );
}
