"use client";

import { memo } from "react";
import type { CreatorCareerOsState } from "@sonafrik/types";
import {
  resolveCareerLevelNumber,
  resolveNextCareerLevel,
} from "@sonafrik/api/creator";

interface CareerLevelCompactProps {
  careerOs: CreatorCareerOsState;
}

function CareerLevelCompactView({ careerOs }: CareerLevelCompactProps) {
  const levelNumber = resolveCareerLevelNumber(careerOs.levels);
  const nextLevel = resolveNextCareerLevel(careerOs.levels);

  return (
    <section className="dash-career-level" aria-label="Niveau de carrière">
      <div className="dash-career-level__header">
        <p className="dash-career-level__kicker">Niveau de carrière</p>
        <span className="dash-career-level__badge">Niveau {levelNumber}</span>
      </div>
      <div className="dash-career-level__body">
        <span className="dash-career-level__icon" aria-hidden="true">
          {careerOs.level.icon}
        </span>
        <p className="dash-career-level__name">{careerOs.level.label}</p>
      </div>
      <div
        className="dash-career-level__track"
        role="progressbar"
        aria-valuenow={careerOs.overallProgressPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progression du parcours"
      >
        <div
          className="dash-career-level__fill"
          style={{ width: `${careerOs.overallProgressPercent}%` }}
        />
      </div>
      <p className="dash-career-level__meta">
        {careerOs.overallProgressPercent} % du parcours complété
      </p>
      <p className="dash-career-level__next">
        <span aria-hidden="true">🔒</span>{" "}
        {nextLevel
          ? `Prochain niveau : ${nextLevel.label}`
          : "Niveau maximum atteint"}
      </p>
    </section>
  );
}

export const CareerLevelCompact = memo(CareerLevelCompactView);
