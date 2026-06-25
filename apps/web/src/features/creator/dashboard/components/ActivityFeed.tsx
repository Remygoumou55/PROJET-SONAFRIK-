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
      <section className="creator-widget creator-activity">
        <h2 className="creator-widget__title">Activité récente</h2>
        <div className="creator-empty">
          <p className="creator-empty__emoji" aria-hidden="true">✨</p>
          <p className="creator-empty__title">Votre histoire commence ici</p>
          <p className="creator-empty__text">Publiez un morceau pour voir votre feed s&apos;animer.</p>
          <Link href="/creator/catalog/tracks" className="creator-empty__cta">
            Publier maintenant
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="creator-widget creator-activity" aria-label="Activité récente">
      <h2 className="creator-widget__title">Activité récente</h2>
      <ul className="creator-activity__timeline">
        {activities.map((item) => (
          <li
            key={item.id}
            className={`creator-activity__item ${item.isFuture ? "creator-activity__item--future" : ""}`}
          >
            <span
              className="creator-activity__dot"
              style={{ backgroundColor: item.isFuture ? "rgba(255,255,255,0.15)" : item.color }}
              aria-hidden="true"
            >
              {item.icon}
            </span>
            <div className="creator-activity__body">
              <div className="creator-activity__row">
                <p className="creator-activity__title">{item.title}</p>
                {!item.isFuture ? (
                  <time className="creator-activity__time" dateTime={item.occurredAt}>
                    {formatRelative(item.occurredAt)}
                  </time>
                ) : null}
              </div>
              <p className="creator-activity__subtitle">{item.subtitle}</p>
              {item.actionHref && item.actionLabel && !item.isFuture ? (
                <Link href={item.actionHref} className="creator-activity__action">
                  {item.actionLabel}
                </Link>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
