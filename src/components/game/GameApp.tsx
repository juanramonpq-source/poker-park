import { useEffect } from "react";
import { playMenuClick } from "@/lib/game/audio";
import { BlockedSheet } from "@/components/game/BlockedSheet";
import { EndScreen } from "@/components/game/EndScreen";
import { FxLayer } from "@/components/game/FxLayer";
import { Hand } from "@/components/game/Hand";
import { Hud } from "@/components/game/Hud";
import { Park } from "@/components/game/Park";
import { ParkMapIntro } from "@/components/game/ParkMapIntro";
import { NightUnlockSheet } from "@/components/game/NightUnlockSheet";
import { PassScreen } from "@/components/game/PassScreen";
import { RulesSheet } from "@/components/game/RulesSheet";
import { TitleScreen } from "@/components/game/TitleScreen";
import { useGameStore } from "@/store/game-store";
import { challengeClass } from "@/lib/game/challenges";
import { OnlineGameProvider } from "@/lib/multiplayer/online-game";
import { OnlineStatusPill } from "@/components/game/OnlineStatusPill";
import { PlacementCaution } from "@/components/game/PlacementCaution";

function PlayingTable() {
  const game = useGameStore((s) => s.game);
  const mapIntroOpen = useGameStore((s) => s.mapIntroOpen);
  const mapOutroOpen = useGameStore((s) => s.mapOutroOpen);
  if (!game) return null;
  return (
    <div className="playing-table relative flex h-dvh flex-col overflow-hidden bg-bg">
      <Hud />
      <div className="relative min-h-0 flex-1 overflow-hidden">
        {mapIntroOpen ? <div className="h-full bg-bg" aria-hidden="true" /> : <Park game={game} />}
      </div>
      <Hand />
      <OnlineStatusPill />
      <NightUnlockSheet />
      <BlockedSheet />
      <PlacementCaution />
      {mapIntroOpen ? <ParkMapIntro game={game} /> : null}
      {mapOutroOpen ? <ParkMapIntro game={game} direction="closing" /> : null}
    </div>
  );
}

export function GameApp() {
  return <OnlineGameProvider><GameAppContent /></OnlineGameProvider>;
}

function GameAppContent() {
  const screen = useGameStore((s) => s.screen);
  const hydrate = useGameStore((s) => s.hydrate);
  const game = useGameStore((s) => s.game);
  const nightTheme = useGameStore((s) => s.nightTheme);
  const machineRoomUnlocked = useGameStore((s) => s.machineRoomUnlocked);
  const showcaseTheme = useGameStore((s) => s.showcaseTheme);
  const cardBack = useGameStore((s) => s.cardBack);
  const activeChallenge = screen === "title" ? showcaseTheme : game?.challenge;

  useEffect(() => {
    if (screen === "title") hydrate();
  }, [hydrate, screen]);

  return (
    <div
      onClickCapture={event => {
        if (screen !== "title" || !(event.target instanceof Element)) return;
        const button = event.target.closest('button, [role="button"]');
        if (!button || button.matches(':disabled, [aria-disabled="true"]')) return;
        playMenuClick();
      }}
      className={`${(screen !== "title" && game?.challenge === "night") || nightTheme || (screen === "title" && showcaseTheme !== "classic") ? "night-theme" : ""} ${challengeClass(activeChallenge)} card-back-${cardBack} ${machineRoomUnlocked ? "machine-room-unlocked" : ""}`}
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
