import type { ReactNode } from "react";

interface DashboardSectionProps {
  title?: string;
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
}

/** Section dashboard avec titre optionnel et respiration horizontale cohérente. */
export function DashboardSection({
  title,
  children,
  className = "",
  ariaLabel,
}: DashboardSectionProps) {
  return (
    <section
      className={`dashboard-section${className ? ` ${className}` : ""}`}
      aria-label={ariaLabel ?? title}
    >
      {title ? <h2 className="dash-section-title">{title}</h2> : null}
      {children}
    </section>
  );
}
