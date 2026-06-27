import Link from "next/link";
import type { CreatorDashboardActivity } from "@sonafrik/types";

function formatRelative(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "aujourd'hui";
    if (days === 1) return "il y a 1 jour";
    if (days < 7) return `il y a ${days} jours`;
    return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(new Date(iso));
  } catch {
    return "";
  }
}

export function ActivityFeed({ activities }: { activities: CreatorDashboardActivity[] }) {
  if (activities.length === 0) {
    return (
      <section className="dash-activity" aria-label="Activité récente">
        <h2 className="dash-section-title">Activité récente</h2>
        <div className="dash-activity__empty">
          <p className="dash-activity__empty-title">Votre histoire commence ici</p>
          <p className="dash-activity__empty-text">
            Vos actions récentes apparaîtront ici au fil de votre progression.
          </p>
        </div>
        <Link href="/creator/analytics" className="dash-activity__footer-link">
          Voir toute l&apos;activité →
        </Link>
      </section>
    );
  }

  return (
    <section className="dash-activity" aria-label="Activité récente">
      <h2 className="dash-section-title">Activité récente</h2>
      <ul className="dash-activity__timeline">
        {activities.map((item) => (
          <li
            key={item.id}
            className={`dash-activity__item ${item.isFuture ? "dash-activity__item--future" : ""}`}
          >
            <span
              className="dash-activity__dot"
              style={{ backgroundColor: item.isFuture ? "rgba(255,255,255,0.12)" : item.color }}
              aria-hidden="true"
            >
              {item.icon}
            </span>
            <div className="dash-activity__body">
              <div className="dash-activity__row">
                <p className="dash-activity__title">{item.title}</p>
                {!item.isFuture ? (
                  <time className="dash-activity__time" dateTime={item.occurredAt}>
                    {formatRelative(item.occurredAt)}
                  </time>
                ) : (
                  <span className="dash-activity__time">À venir...</span>
                )}
              </div>
              {!item.isFuture && item.subtitle ? (
                <p className="dash-activity__subtitle">{item.subtitle}</p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
      <Link href="/creator/analytics" className="dash-activity__footer-link">
        Voir toute l&apos;activité →
      </Link>
    </section>
  );
}
