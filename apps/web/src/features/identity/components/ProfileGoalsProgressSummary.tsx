import { memo } from "react";
import type { SmartGoalsEngineViewModel } from "../lib/profileGoals";

interface ProfileGoalsProgressSummaryProps {
  engine: SmartGoalsEngineViewModel;
}

export const ProfileGoalsProgressSummary = memo(function ProfileGoalsProgressSummary({
  engine,
}: ProfileGoalsProgressSummaryProps) {
  return (
    <div className="identity-goals-summary" aria-label="Résumé des objectifs">
      <div className="identity-goals-summary__header">
        <div className="identity-goals-summary__percent-block">
          <span className="identity-goals-summary__percent">{engine.overallProgressPercent} %</span>
          <span className="identity-goals-summary__label">Objectifs atteints</span>
        </div>
        <div className="identity-goals-summary__stats">
          <span className="identity-goals-summary__stat identity-goals-summary__stat--done">
            <strong>{engine.completedCount}</strong> atteint{engine.completedCount > 1 ? "s" : ""}
          </span>
          <span className="identity-goals-summary__stat identity-goals-summary__stat--active">
            <strong>{engine.activeCount}</strong> actif{engine.activeCount > 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <div
        className="identity-goals-summary__track"
        role="progressbar"
        aria-valuenow={engine.overallProgressPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progression globale des objectifs"
      >
        <div
          className="identity-goals-summary__fill"
          style={{ width: `${engine.overallProgressPercent}%` }}
        />
        <div className="identity-goals-summary__glow" aria-hidden="true" />
      </div>

      <p className="identity-goals-summary__headline">{engine.headlineMessage}</p>
      <p className="identity-goals-summary__next">{engine.nextStepMessage}</p>
    </div>
  );
});
