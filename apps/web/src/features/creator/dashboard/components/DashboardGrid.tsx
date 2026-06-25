import type { ReactNode } from "react";

export function WidgetContainer({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`creator-dashboard-grid__cell ${className}`.trim()}>{children}</div>;
}

export function DashboardGrid({ children }: { children: ReactNode }) {
  return <div className="creator-dashboard-grid">{children}</div>;
}
