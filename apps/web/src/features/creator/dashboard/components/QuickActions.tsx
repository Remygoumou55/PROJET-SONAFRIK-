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

  const publish =
    byId.get("publish") ??
    ({
      id: "publish",
      label: "Publier un morceau",
      description: "Lancez votre présence musicale",
      href: "/creator/catalog/tracks",
      icon: "🎵",
      variant: "primary",
    } satisfies CreatorDashboardQuickAction);

  const profile = byId.get("profile") ?? PROFILE_FALLBACK;
  const catalog =
    byId.get("catalog") ??
    ({
      id: "catalog",
      label: "Mon catalogue",
      description: "Gérer titres et albums",
      href: "/creator/catalog",
      icon: "📀",
      variant: "outline",
    } satisfies CreatorDashboardQuickAction);

  const revenue = byId.get("payment") ?? byId.get("withdraw") ?? REVENUE_FALLBACK;

  return [publish, profile, catalog, revenue];
}

export function QuickActions({
  actions,
  pulsePrimary = false,
  sectionId = "creator-quick-actions",
}: {
  actions: CreatorDashboardQuickAction[];
  pulsePrimary?: boolean;
  sectionId?: string;
}) {
  const primaryActions = selectPrimaryQuickActions(actions);

  return (
    <section
      id={sectionId}
      className="dash-quick-actions"
      aria-label="Actions rapides"
    >
      <h2 className="dash-section-title">Actions rapides</h2>
      <div className="dash-quick-actions__grid">
        {primaryActions.map((action) => (
          <Link
            key={action.id}
            href={action.href}
            className={`dash-quick-actions__card dash-quick-actions__card--${action.variant}${
              pulsePrimary && action.variant === "primary"
                ? " dash-quick-actions__card--pulse"
                : ""
            }`}
            aria-label={`${action.label} — ${action.description}`}
          >
            <span className="dash-quick-actions__icon" aria-hidden="true">
              {action.icon}
            </span>
            <span className="dash-quick-actions__label">{action.label}</span>
            <span className="dash-quick-actions__desc">{action.description}</span>
            <span className="dash-quick-actions__arrow" aria-hidden="true">
              →
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
