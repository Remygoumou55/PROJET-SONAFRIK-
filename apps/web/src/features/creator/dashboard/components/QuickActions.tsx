import type { CreatorDashboardQuickAction } from "@sonafrik/types";
import Link from "next/link";

const REVENUE_FALLBACK: CreatorDashboardQuickAction = {
  id: "revenue",
  label: "Mes revenus",
  description: "Configurer vos paiements",
  href: "/wallet",
  icon: "💰",
  variant: "outline",
};

const PROFILE_FALLBACK: CreatorDashboardQuickAction = {
  id: "profile",
  label: "Compléter le profil",
  description: "Optimisez votre vitrine",
  href: "/creator/identity",
  icon: "✨",
  variant: "outline",
};

function selectPrimaryQuickActions(
  actions: CreatorDashboardQuickAction[],
): CreatorDashboardQuickAction[] {
  const byId = new Map(actions.map((action) => [action.id, action]));

  const primary =
    byId.get("publish") ??
    byId.get("stats") ??
    ({
      id: "publish",
      label: "Publier un morceau",
      description: "Lancez votre présence musicale",
      href: "/creator/catalog/tracks",
      icon: "🎵",
      variant: "primary",
    } satisfies CreatorDashboardQuickAction);

  const profile = byId.get("profile") ?? PROFILE_FALLBACK;
  const catalog = byId.get("catalog") ?? {
    id: "catalog",
    label: "Mon catalogue",
    description: "Gérer titres et albums",
    href: "/creator/catalog",
    icon: "📀",
    variant: "outline",
  } satisfies CreatorDashboardQuickAction;

  const revenue =
    byId.get("payment") ?? byId.get("withdraw") ?? REVENUE_FALLBACK;

  return [primary, profile, catalog, revenue];
}

export function QuickActions({
  actions,
  pulsePrimary = false,
}: {
  actions: CreatorDashboardQuickAction[];
  pulsePrimary?: boolean;
}) {
  const primaryActions = selectPrimaryQuickActions(actions);

  return (
    <section className="creator-quick-actions" aria-label="Actions rapides">
      <h2 className="creator-widget__title">Actions rapides</h2>
      <div className="creator-quick-actions__grid">
        {primaryActions.map((action) => (
          <Link
            key={action.id}
            href={action.href}
            className={`creator-quick-action creator-quick-action--${action.variant}${
              pulsePrimary && action.variant === "primary" ? " creator-quick-action--pulse" : ""
            }`}
            aria-label={`${action.label} — ${action.description}`}
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
