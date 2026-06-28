import { memo } from "react";
import { formatDate } from "@/lib/formatters";
import type { RewardViewModel } from "../lib/profileRewards";

interface ProfileRewardCardProps {
  reward: RewardViewModel;
}

export const ProfileRewardCard = memo(function ProfileRewardCard({
  reward,
}: ProfileRewardCardProps) {
  const isUnlocked = reward.status === "unlocked";
  const isInProgress = reward.status === "in_progress";

  return (
    <article
      className={`identity-reward-card identity-reward-card--${reward.status} identity-reward-card--${reward.rarity}`}
      aria-label={reward.ariaLabel}
      data-reward-id={reward.id}
    >
      <div className="identity-reward-card__visual" aria-hidden="true">
        <span
          className={`identity-reward-card__icon${isUnlocked ? " identity-reward-card__icon--unlocked" : ""}`}
        >
          {isUnlocked ? reward.icon : isInProgress ? reward.icon : "🔒"}
        </span>
        {isUnlocked ? (
          <span className="identity-reward-card__shine" aria-hidden="true" />
        ) : null}
      </div>

      <div className="identity-reward-card__body">
        <div className="identity-reward-card__meta">
          <span className="identity-reward-card__category">{reward.categoryLabel}</span>
          <span className="identity-reward-card__rarity">{reward.rarityLabel}</span>
        </div>

        <h4 className="identity-reward-card__title">{reward.title}</h4>
        <p className="identity-reward-card__description">{reward.description}</p>

        {isUnlocked ? (
          <>
            <p className="identity-reward-card__unlock-msg">{reward.unlockMessage}</p>
            {reward.unlockedAt ? (
              <time className="identity-reward-card__date" dateTime={reward.unlockedAt}>
                Débloquée le {formatDate(reward.unlockedAt)}
              </time>
            ) : null}
          </>
        ) : isInProgress ? (
          <p className="identity-reward-card__hint identity-reward-card__hint--progress">
            {reward.progressHint ?? "En cours — continuez sur cette lancée."}
          </p>
        ) : (
          <p className="identity-reward-card__hint">
            {reward.progressHint ?? "Continuez votre parcours pour débloquer cette récompense."}
          </p>
        )}
      </div>
    </article>
  );
});
