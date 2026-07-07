import Link from "next/link";
import type {
  CreatorDashboardActivity,
  CreatorDashboardAssistantTip,
  CreatorDashboardGoal,
  CreatorRevenueStats,
} from "@sonafrik/types";
import { DashboardPanel } from "./DashboardPanel";
import { DashboardProgressBar } from "./DashboardProgressBar";
import { formatActivityDate, formatDashboardGnf } from "./dashboardFormat";

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

interface DashboardWalletCardProps {
  revenueStats: CreatorRevenueStats;
  paymentConfigured: boolean;
  activities: CreatorDashboardActivity[];
}

function resolveLastTransaction(
  activities: CreatorDashboardActivity[],
): CreatorDashboardActivity | null {
  const financial = activities.find(
    (a) => a.id === "royalties" || a.icon === "💰" || a.title.toLowerCase().includes("revenu"),
  );
  if (financial && !financial.isFuture) return financial;
  const past = activities.find((a) => !a.isFuture && a.id !== "account_created");
  return past ?? null;
}

/** Carte portefeuille — solde, revenus, retrait et état paiement. */
export function DashboardWalletCard({
  revenueStats,
  paymentConfigured,
  activities,
}: DashboardWalletCardProps) {
  const lastTx = resolveLastTransaction(activities);
  const retirable = revenueStats.wallet_balance_gnf;
  const payoutPending = revenueStats.pending_royalties_gnf;

  return (
    <DashboardPanel className="dashboard-panel--wallet" ariaLabel="Portefeuille">
      <div className="dash-wallet__head">
        <h2 className="dash-section-title" style={{ margin: 0 }}>
          Portefeuille
        </h2>
        <Link href="/wallet" className="dash-wallet__link">
          Gérer →
        </Link>
      </div>

      <div className="dash-wallet__balance-block">
        <span className="dash-wallet__balance-icon" aria-hidden="true">
          💰
        </span>
        <p className="dash-wallet__balance-label">Solde</p>
        <p className="dash-wallet__balance-value">{formatDashboardGnf(revenueStats.wallet_balance_gnf)}</p>
      </div>

      <div className="dash-wallet__grid">
        <div className="dash-wallet__cell">
          <p className="dash-wallet__cell-label">Revenus du mois</p>
          <p className="dash-wallet__cell-value">
            {formatDashboardGnf(revenueStats.estimated_monthly_gnf)}
          </p>
        </div>
        <div className="dash-wallet__cell">
          <p className="dash-wallet__cell-label">Montant retirable</p>
          <p className="dash-wallet__cell-value dash-wallet__cell-value--accent">
            {formatDashboardGnf(retirable)}
          </p>
        </div>
        <div className="dash-wallet__cell dash-wallet__cell--wide">
          <p className="dash-wallet__cell-label">Dernière transaction</p>
          {lastTx ? (
            <p className="dash-wallet__cell-value dash-wallet__cell-value--sm">
              <span aria-hidden="true">{lastTx.icon} </span>
              {lastTx.subtitle || lastTx.title}
              <span className="dash-wallet__cell-meta">
                {" "}
                · {formatActivityDate(lastTx.occurredAt)}
              </span>
            </p>
          ) : (
            <p className="dash-wallet__cell-muted">Aucune transaction pour le moment</p>
          )}
        </div>
        <div className="dash-wallet__cell">
          <p className="dash-wallet__cell-label">Prochain versement</p>
          <p className="dash-wallet__cell-value dash-wallet__cell-value--sm">
            {payoutPending > 0 ? formatDashboardGnf(payoutPending) : "Cycle mensuel"}
          </p>
        </div>
        <div className="dash-wallet__cell">
          <p className="dash-wallet__cell-label">État du paiement</p>
          <span
            className={`dash-wallet__status dash-wallet__status--${paymentConfigured ? "ok" : "pending"}`}
          >
            {paymentConfigured ? "✓ Configuré" : "À configurer"}
          </span>
        </div>
      </div>

      {retirable > 0 ? (
        <Link href="/wallet/payout" className="dash-wallet__cta">
          Retirer mes gains
        </Link>
      ) : !paymentConfigured ? (
        <Link href="/wallet/payout" className="dash-wallet__cta dash-wallet__cta--outline">
          Configurer mes paiements
        </Link>
      ) : null}
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
