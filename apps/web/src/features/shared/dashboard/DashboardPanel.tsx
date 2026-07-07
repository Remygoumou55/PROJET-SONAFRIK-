import type { ReactNode } from "react";
import { EnterpriseCard } from "@/features/shared/design-system/EnterpriseCard";

interface DashboardPanelProps {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
  as?: "div" | "article" | "section" | "aside";
  ariaLabel?: string;
}

/** Grande carte dashboard — largeur, padding, rayon et ombre unifiés. */
export function DashboardPanel({
  children,
  className = "",
  interactive = false,
  as = "section",
  ariaLabel,
}: DashboardPanelProps) {
  return (
    <EnterpriseCard
      as={as}
      interactive={interactive}
      className={`dashboard-panel${className ? ` ${className}` : ""}`}
      aria-label={ariaLabel}
    >
      {children}
    </EnterpriseCard>
  );
}
