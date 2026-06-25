import type { CreatorDashboardQuickAction } from "@sonafrik/types";
import Link from "next/link";

export function QuickActions({
  actions,
  pulsePrimary = false,
}: {
  actions: CreatorDashboardQuickAction[];
  pulsePrimary?: boolean;
}) {
  return (
    <section className="creator-quick-actions" aria-label="Actions rapides">
      <h2 className="creator-widget__title">Actions rapides</h2>
      <div className="creator-quick-actions__grid">
        {actions.map((action) => (
          <Link
            key={action.id}
            href={action.href}
            className={`creator-quick-action creator-quick-action--${action.variant}${
              pulsePrimary && action.variant === "primary" ? " creator-quick-action--pulse" : ""
            }`}
          >
            <span className="creator-quick-action__icon" aria-hidden="true">
              {action.icon}
            </span>
            <span className="creator-quick-action__label">{action.label}</span>
            <span className="creator-quick-action__desc">{action.description}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
