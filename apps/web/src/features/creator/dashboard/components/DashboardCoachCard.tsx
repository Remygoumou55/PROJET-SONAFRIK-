import Link from "next/link";
import type { CreatorDashboardActivity, CreatorDashboardAssistantTip } from "@sonafrik/types";
import { DashboardPanel, DashboardProgressBar } from "@/features/shared/dashboard";

interface Props {
  tips: CreatorDashboardAssistantTip[];
  activities: CreatorDashboardActivity[];
  profilePercent: number;
  careerLevelLabel?: string;
  careerLevelIcon?: string;
}

export function DashboardCoachCard({
  tips,
  activities,
  profilePercent,
  careerLevelLabel,
  careerLevelIcon,
}: Props) {
  const mission = tips[0] ?? null;
  const visibleActivities = activities.slice(0, 3);

  return (
    <DashboardPanel className="dashboard-panel--coach" ariaLabel="Coach SONAFRIK">
      <div className="dash-coach__head">
        <h2 className="dash-section-title" style={{ margin: 0 }}>Coach SONAFRIK</h2>
        {careerLevelLabel ? (
          <span className="dash-coach__level-pill">
            {careerLevelIcon ? <span aria-hidden="true">{careerLevelIcon}</span> : null}
            {careerLevelLabel}
          </span>
        ) : null}
      </div>

      {profilePercent < 100 ? (
        <DashboardProgressBar
          value={profilePercent}
          label="Profil artiste"
          tone="gold"
        />
      ) : null}

      {mission ? (
        <div className="dash-coach__mission">
          <div className="dash-coach__mission-head">
            <p className="dash-coach__mission-title">
              <span aria-hidden="true">{mission.icon} </span>
              {mission.title}
            </p>
            <span className="dash-coach__mission-time">{mission.time}</span>
          </div>
          {mission.actionHref && mission.actionLabel ? (
            <Link href={mission.actionHref} className="dash-coach__mission-cta">
              {mission.actionLabel} →
            </Link>
          ) : null}
        </div>
      ) : null}

      {visibleActivities.length > 0 ? (
        <ul className="dash-coach__steps" aria-label="Activité récente">
          {visibleActivities.map((item) => (
            <li
              key={item.id}
              className={`dash-coach__step${item.isFuture ? " dash-coach__step--future" : ""}`}
            >
              <span className="dash-coach__step-dot" aria-hidden="true">
                {item.isFuture ? "○" : "✔"}
              </span>
              <p className="dash-coach__step-label">{item.title}</p>
            </li>
          ))}
        </ul>
      ) : null}

      <Link href="/creator/analytics" className="dash-coach__footer-link">
        Voir tout →
      </Link>
    </DashboardPanel>
  );
}
