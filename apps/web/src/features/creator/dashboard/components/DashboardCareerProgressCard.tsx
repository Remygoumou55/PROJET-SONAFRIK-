import { memo } from "react";
import type { CreatorCareerOsState } from "@sonafrik/types";
import {
  resolveCareerLevelNumber,
  resolveNextCareerLevel,
} from "@sonafrik/api/creator/presentation";

interface Props {
  careerOs: CreatorCareerOsState;
}

function CircularProgress({ percent }: { percent: number }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;

  return (
    <svg
      className="dash-career-circle__svg"
      viewBox="0 0 72 72"
      aria-hidden="true"
    >
      <circle
        className="dash-career-circle__track"
        cx="36"
        cy="36"
        r={r}
        fill="none"
        strokeWidth="6"
      />
      <circle
        className="dash-career-circle__fill"
        cx="36"
        cy="36"
        r={r}
        fill="none"
        strokeWidth="6"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 36 36)"
      />
      <text
        x="36"
        y="36"
        className="dash-career-circle__pct"
        dominantBaseline="central"
        textAnchor="middle"
      >
        {percent}%
      </text>
    </svg>
  );
}

function DashboardCareerProgressCardView({ careerOs }: Props) {
  const levelNumber = resolveCareerLevelNumber(careerOs.levels);
  const nextLevel = resolveNextCareerLevel(careerOs.levels);
  const mission = careerOs.currentMission;

  const streamsRemaining =
    mission && mission.target > mission.current
      ? mission.target - mission.current
      : null;

  return (
    <section className="dash-career-progress" aria-label="Progression carrière">
      <h2 className="dash-section-title">Progression carrière</h2>

      <div className="dash-career-progress__body">
        <div className="dash-career-circle">
          <CircularProgress percent={careerOs.overallProgressPercent} />
          <p
            className="dash-career-circle__label"
            role="progressbar"
            aria-valuenow={careerOs.overallProgressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Progression du parcours carrière"
          >
            {careerOs.level.icon} {careerOs.level.label}
          </p>
        </div>

        <div className="dash-career-progress__info">
          <p className="dash-career-progress__level">
            Niveau {levelNumber}
          </p>
          {streamsRemaining !== null && (
            <p className="dash-career-progress__streams">
              <span className="dash-career-progress__streams-val">
                {streamsRemaining.toLocaleString("fr-FR")}
              </span>{" "}
              streams restants
            </p>
          )}
          <p className="dash-career-progress__next">
            {nextLevel
              ? `Prochain : ${nextLevel.label}`
              : "Niveau maximum atteint"}
          </p>
        </div>
      </div>
    </section>
  );
}

export const DashboardCareerProgressCard = memo(DashboardCareerProgressCardView);
