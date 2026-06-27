"use client";

import { memo } from "react";
import type { CreatorCareerLevel } from "@sonafrik/types";

interface CareerLevelProps {
  level: CreatorCareerLevel;
  overallProgressPercent: number;
}

function CareerLevelView({ level, overallProgressPercent }: CareerLevelProps) {
  return (
    <div className="career-os__level" aria-label={`Niveau de carrière : ${level.label}`}>
      <div className="career-os__level-badge">
        <span className="career-os__level-icon" aria-hidden="true">
          {level.icon}
        </span>
        <span className="career-os__level-label">{level.label}</span>
      </div>
      <div
        className="career-os__level-track"
        role="progressbar"
        aria-valuenow={overallProgressPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progression du parcours Career OS"
      >
        <div className="career-os__level-fill" style={{ width: `${overallProgressPercent}%` }} />
      </div>
      <p className="career-os__level-meta">
        {overallProgressPercent} % du parcours complété
      </p>
    </div>
  );
}

export const CareerLevel = memo(CareerLevelView);
