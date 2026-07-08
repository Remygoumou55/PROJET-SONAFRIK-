import Link from "next/link";
import type {
  CreatorDashboardActivity,
  CreatorDashboardAssistantTip,
  CreatorDashboardGoal,
} from "@sonafrik/types";
import { DashboardPanel } from "./DashboardPanel";
import { DashboardProgressBar } from "./DashboardProgressBar";
import { formatActivityDate } from "./dashboardFormat";

const TIP_GOAL_MAP: Record<string, CreatorDashboardGoal["id"]> = {
  profile: "complete_profile",
  publish: "publish_track",
  payment: "configure_payment",
  verify: "verify_identity",
};

function resolveCoachState(
  tips: CreatorDashboardAssistantTip[],
  goals: CreatorDashboardGoal[],
): {
  objective: string;
  progress: number;
  actionHref?: string;
  actionLabel?: string;
  actionIcon?: string;
  reward: string;
} | null {
  const tip = tips[0];
  if (!tip) {
    const nextGoal = goals.find((g) => !g.completed);
    if (!nextGoal) return null;
    return {
      objective: nextGoal.label,
      progress: nextGoal.progressPercent,
      actionHref: nextGoal.href,
      actionLabel: "Continuer",
      actionIcon: "🚀",
      reward: nextGoal.rewardLabel,
    };
  }

  const mappedId = TIP_GOAL_MAP[tip.id];
  const goal =
    (mappedId ? goals.find((g) => g.id === mappedId) : undefined) ??
    goals.find((g) => !g.completed);

  return {
    objective: goal?.label ?? tip.title,
    progress: goal?.progressPercent ?? 0,
    actionHref: tip.actionHref ?? goal?.href,
    actionLabel: tip.actionLabel ?? "Commencer",
    actionIcon: tip.icon,
    reward: goal?.rewardLabel ?? "Progression carrière",
  };
}

interface DashboardCoachCardProps {
  tips: CreatorDashboardAssistantTip[];
  goals: CreatorDashboardGoal[];
  careerLevelLabel?: string;
  careerLevelIcon?: string;
}

/** Coach SONAFRIK — objectif, progression, action et récompense en moins de 3 secondes. */
export function DashboardCoachCard({
  tips,
  goals,
  careerLevelLabel,
  careerLevelIcon,
}: DashboardCoachCardProps) {
  const state = resolveCoachState(tips, goals);
  if (!state) return null;

  return (
    <DashboardPanel className="dashboard-panel--coach" ariaLabel="Coach SONAFRIK">
      <div className="dash-coach__head">
        <h2 className="dash-section-title" style={{ margin: 0 }}>
          Coach SONAFRIK
        </h2>
        {careerLevelLabel ? (
          <span className="dash-coach__level-pill">
            {careerLevelIcon ? <span aria-hidden="true">{careerLevelIcon}</span> : null}
            {careerLevelLabel}
          </span>
        ) : null}
      </div>

      <div className="dash-coach__objective">
        <span className="dash-coach__objective-icon" aria-hidden="true">
          🎯
        </span>
        <p className="dash-coach__objective-label">Objectif actuel</p>
        <p className="dash-coach__objective-title">{state.objective}</p>
      </div>

      <DashboardProgressBar
        value={state.progress}
        label="Progression"
        tone="gold"
        showValue
      />

      <div className="dash-coach__action-row">
        <div className="dash-coach__action">
          <span className="dash-coach__action-icon" aria-hidden="true">
            🚀
          </span>
          <div className="dash-coach__action-copy">
            <p className="dash-coach__action-label">Prochaine action</p>
            {state.actionHref && state.actionLabel ? (
              <Link href={state.actionHref} className="dash-coach__action-cta">
                {state.actionIcon ? (
                  <span aria-hidden="true">{state.actionIcon} </span>
                ) : null}
                {state.actionLabel} →
              </Link>
            ) : (
              <p className="dash-coach__action-muted">Tout est à jour</p>
            )}
          </div>
        </div>

        <div className="dash-coach__reward" aria-label={`Récompense : ${state.reward}`}>
          <span className="dash-coach__reward-icon" aria-hidden="true">
            🎁
          </span>
          <p className="dash-coach__reward-label">Récompense</p>
          <span className="dash-coach__reward-badge">{state.reward}</span>
        </div>
      </div>
    </DashboardPanel>
  );
}

interface DashboardActivityCardProps {
  activities: CreatorDashboardActivity[];
  limit?: number;
}

/** Activité récente — timeline compacte, hors coach. */
export function DashboardActivityCard({ activities, limit = 4 }: DashboardActivityCardProps) {
  const items = activities.filter((a) => !a.isFuture).slice(0, limit);
  if (items.length === 0) return null;

  return (
    <DashboardPanel ariaLabel="Activité récente">
      <div className="dash-activity__head">
        <h2 className="dash-section-title" style={{ margin: 0 }}>
          Activité récente
        </h2>
        <Link href="/creator/analytics" className="dash-activity__link">
          Voir tout →
        </Link>
      </div>
      <ul className="dash-activity__list">
        {items.map((item) => (
          <li key={item.id} className="dash-activity__item">
            <span
              className="dash-activity__icon"
              style={{ color: item.color }}
              aria-hidden="true"
            >
              {item.icon}
            </span>
            <div className="dash-activity__body">
              <p className="dash-activity__title">{item.title}</p>
              <p className="dash-activity__sub">{item.subtitle}</p>
            </div>
            <time className="dash-activity__time" dateTime={item.occurredAt}>
              {formatActivityDate(item.occurredAt)}
            </time>
          </li>
        ))}
      </ul>
    </DashboardPanel>
  );
}
