import type { RewardEngineViewModel } from "../lib/profileRewards";
import { ProfileRewardCard } from "./ProfileRewardCard";

interface ProfileRewardsGridProps {
  title: string;
  rewards: RewardEngineViewModel["unlocked"];
  emptyMessage: string;
  listId: string;
}

export function ProfileRewardsGrid({
  title,
  rewards,
  emptyMessage,
  listId,
}: ProfileRewardsGridProps) {
  return (
    <div className="identity-rewards-grid" aria-labelledby={listId}>
      <h3 id={listId} className="identity-rewards-grid__title">
        {title}
        <span className="identity-rewards-grid__count" aria-label={`${rewards.length} récompenses`}>
          {rewards.length}
        </span>
      </h3>

      {rewards.length === 0 ? (
        <p className="identity-rewards-grid__empty">{emptyMessage}</p>
      ) : (
        <div className="identity-rewards-grid__list" role="list">
          {rewards.map((reward) => (
            <div key={reward.id} role="listitem" className="identity-rewards-grid__cell">
              <ProfileRewardCard reward={reward} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
