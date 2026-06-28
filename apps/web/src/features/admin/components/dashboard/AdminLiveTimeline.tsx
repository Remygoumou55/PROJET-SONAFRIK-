import Link from "next/link";
import type { AdminPriorityItem, AdminTimelineItem } from "../../lib/buildAdminDashboardView";

function formatTimelineTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (isToday) {
    return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function AdminLiveTimeline({ items }: { items: AdminTimelineItem[] }) {
  return (
    <section className="admin-human-timeline" aria-labelledby="admin-timeline-title">
      <h2 id="admin-timeline-title" className="admin-human-section-title">
        Activité en direct
      </h2>
      <p className="admin-human-section-sub">Ce qui se passe sur SONAFRIK en ce moment</p>
      {items.length === 0 ? (
        <p className="admin-human-empty">Le plateau est calme — la musique continue de tourner.</p>
      ) : (
        <ol className="admin-human-timeline__list">
          {items.map((item) => (
            <li key={item.id} className={`admin-human-timeline__item admin-human-timeline__item--${item.tone}`}>
              <span className="admin-human-timeline__dot" aria-hidden="true" />
              <div className="admin-human-timeline__body">
                <p className="admin-human-timeline__label">{item.label}</p>
                <time className="admin-human-timeline__time" dateTime={item.time}>
                  {formatTimelineTime(item.time)}
                </time>
              </div>
            </li>
          ))}
        </ol>
      )}
      <Link href="/admin/audit" className="admin-human-link">
        Voir tout le journal →
      </Link>
    </section>
  );
}

export function AdminPriorityCenter({ items }: { items: AdminPriorityItem[] }) {
  return (
    <section className="admin-human-priorities" aria-labelledby="admin-priorities-title">
      <h2 id="admin-priorities-title" className="admin-human-section-title">
        Aujourd&apos;hui, votre attention est requise
      </h2>
      {items.length === 0 ? (
        <p className="admin-human-empty admin-human-empty--success">
          Rien d&apos;urgent. Vous pouvez vous concentrer sur la croissance et l&apos;accompagnement des artistes.
        </p>
      ) : (
        <ul className="admin-human-priorities__list">
          {items.map((item) => (
            <li key={item.id} className={`admin-human-priority admin-human-priority--${item.urgency}`}>
              <div>
                <p className="admin-human-priority__label">{item.label}</p>
                <p className="admin-human-priority__count">{item.count} en attente</p>
              </div>
              <Link href={item.href} className="admin-human-priority__action">
                {item.actionLabel} →
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
