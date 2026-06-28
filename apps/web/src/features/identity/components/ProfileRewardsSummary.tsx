import type { RewardEngineViewModel } from "../lib/profileRewards";

interface ProfileRewardsSummaryProps {
  engine: RewardEngineViewModel;
}

export function ProfileRewardsSummary({ engine }: ProfileRewardsSummaryProps) {
  return (
    <div className="identity-rewards-summary" aria-labelledby="rewards-summary-title">
      <div className="identity-rewards-summary__header">
        <div className="identity-rewards-summary__percent-wrap">
          <span className="identity-rewards-summary__percent" aria-hidden="true">
            {engine.percent}%
          </span>
          <p id="rewards-summary-title" className="identity-rewards-summary__label">
            Collection débloquée
          </p>
        </div>
        <div className="identity-rewards-summary__stats">
          <span className="identity-rewards-summary__stat identity-rewards-summary__stat--unlocked">
            <strong>{engine.unlockedCount}</strong> obtenue{engine.unlockedCount > 1 ? "s" : ""}
          </span>
          {engine.inProgressCount > 0 ? (
            <span className="identity-rewards-summary__stat identity-rewards-summary__stat--progress">
              <strong>{engine.inProgressCount}</strong> en cours
            </span>
          ) : null}
          <span className="identity-rewards-summary__stat identity-rewards-summary__stat--upcoming">
            <strong>{engine.upcomingCount}</strong> à venir
          </span>
        </div>
      </div>

      <div
        className="identity-rewards-summary__track"
        role="progressbar"
        aria-valuenow={engine.percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${engine.percent} pour cent des récompenses débloquées`}
      >
        <div
          className="identity-rewards-summary__fill"
          style={{ width: `${engine.percent}%` }}
        />
      </div>

      <p className="identity-rewards-summary__headline">{engine.headlineMessage}</p>
    </div>
  );
}
