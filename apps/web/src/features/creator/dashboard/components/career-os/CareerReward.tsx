"use client";

import { memo, useEffect, useState } from "react";

interface CareerRewardProps {
  levelId: string;
  missionId: string | null;
  rewardBadge: string | null;
}

const STORAGE_KEY = "sonafrik-career-os-seen";

type SeenState = {
  levelId: string;
  missionId: string | null;
};

function readSeen(): SeenState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SeenState) : null;
  } catch {
    return null;
  }
}

function writeSeen(state: SeenState): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore quota */
  }
}

function CareerRewardView({ levelId, missionId, rewardBadge }: CareerRewardProps) {
  const [visible, setVisible] = useState(false);
  const [kind, setKind] = useState<"level" | "mission" | null>(null);

  useEffect(() => {
    const seen = readSeen();
    if (!seen) {
      writeSeen({ levelId, missionId });
      return;
    }

    const missionChanged = Boolean(missionId && seen.missionId !== missionId);
    const levelChanged = seen.levelId !== levelId;

    if (levelChanged) {
      setKind("level");
      setVisible(true);
    } else if (missionChanged && rewardBadge) {
      setKind("mission");
      setVisible(true);
    }

    writeSeen({ levelId, missionId });
  }, [levelId, missionId, rewardBadge]);

  useEffect(() => {
    if (!visible) return;
    const timer = window.setTimeout(() => setVisible(false), 4000);
    return () => window.clearTimeout(timer);
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className="career-os__reward"
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <span className="career-os__reward-spark" aria-hidden="true">
        ✦
      </span>
      <p className="career-os__reward-text">
        {kind === "level"
          ? "Bravo ! Vous venez de débloquer un nouveau niveau."
          : `Félicitations — badge « ${rewardBadge} » débloqué.`}
      </p>
    </div>
  );
}

export const CareerReward = memo(CareerRewardView);
