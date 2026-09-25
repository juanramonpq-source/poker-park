import { useEffect, useState } from "react";
import { playLifetimeUnlock } from "@/lib/game/audio";
import {
  loadFinaleProgress,
  markFinaleSeen,
  nextPendingFinale,
  type FinaleKind,
} from "@/lib/game/finale-progress";
import {
  claimPentonuiMedal,
  loadMascotProgress,
  type MascotProgress,
} from "@/lib/game/mascot-progress";
import { loadSecrets } from "@/lib/game/persist";
import { ParkEndingReveal } from "@/components/game/ParkEndingReveal";
import { PentonuiMedalReveal } from "@/components/game/PentonuiMedalReveal";

interface FinaleSequenceProps {
  active: boolean;
  allowAchievementForm?: boolean;
  onAchievementFormClose?: () => void;
  onMascotProgress?: (progress: MascotProgress) => void;
}

export function FinaleSequence({
  active,
  allowAchievementForm = false,
  onAchievementFormClose,
  onMascotProgress,
}: FinaleSequenceProps) {
  const [current, setCurrent] = useState<FinaleKind | null>(null);
  const [reopened, setReopened] = useState(false);

  useEffect(() => {
    if (!active || current) return;
    const secrets = loadSecrets();
    const mascots = loadMascotProgress();
    const pending = nextPendingFinale(secrets, mascots);
    if (pending === "ultimate") {
      const award = claimPentonuiMedal(secrets);
      onMascotProgress?.(award.progress);
      playLifetimeUnlock();
    }
    if (pending) {
      setReopened(false);
      setCurrent(pending);
      return;
    }
    if (allowAchievementForm && mascots.pentonuiMedal) {
      setReopened(true);
      setCurrent("ultimate");
    }
  });

  if (!active) return null;

  if (current === "park") {
    return <ParkEndingReveal onClose={() => {
      markFinaleSeen("park");
      setCurrent(null);
    }} />;
  }

  if (current === "ultimate") {
    const close = () => {
      markFinaleSeen("ultimate");
      setCurrent(null);
      if (reopened) onAchievementFormClose?.();
    };
    return (
      <PentonuiMedalReveal
        alreadySubmitted={Boolean(loadFinaleProgress().achievementSubmittedAt)}
        onClose={close}
        onShare={close}
      />
    );
  }

  return null;
}
