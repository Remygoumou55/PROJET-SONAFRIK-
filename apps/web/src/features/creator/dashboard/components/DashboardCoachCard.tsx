import Link from "next/link";
import type { CreatorDashboardActivity, CreatorDashboardAssistantTip } from "@sonafrik/types";
import { OVERLAY } from "@/lib/design/overlayTokens";

interface Props {
  tips: CreatorDashboardAssistantTip[];
  activities: CreatorDashboardActivity[];
}

export function DashboardCoachCard({ tips, activities }: Props) {
  const tip = tips[0] ?? null;
  const visibleActivities = activities.slice(0, 3);

  return (
    <section className="dash-coach" aria-label="Coach SONAFRIK">
      <h2 className="dash-section-title">Coach SONAFRIK</h2>
      {tip && (
        <div className="dash-coach__tip">
          <span className="dash-coach__tip-icon" aria-hidden="true">{tip.icon}</span>
          <div className="dash-coach__tip-body">
            <p className="dash-coach__tip-label">Aujourd&apos;hui</p>
            <p className="dash-coach__tip-text">{tip.message}</p>
          </div>
        </div>
      )}

      {visibleActivities.length > 0 && (
        <ul className="dash-coach__activities" aria-label="Activité récente">
          {visibleActivities.map((item) => (
            <li
              key={item.id}
              className={`dash-coach__activity${item.isFuture ? " dash-coach__activity--future" : ""}`}
            >
              <span
                className="dash-coach__dot"
                style={{ color: item.isFuture ? OVERLAY.blanc30 : item.color }}
                aria-hidden="true"
              >
                {item.isFuture ? "○" : "✔"}
              </span>
              <p className="dash-coach__activity-title">{item.title}</p>
            </li>
          ))}
        </ul>
      )}

      <Link href="/creator/analytics" className="dash-coach__see-all">
        Voir tout →
      </Link>
    </section>
  );
}
