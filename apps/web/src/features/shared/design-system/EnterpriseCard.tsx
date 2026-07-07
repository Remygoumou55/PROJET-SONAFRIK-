import type { ReactNode } from "react";

interface EnterpriseCardProps {
  children: ReactNode;
  className?: string;
  active?: boolean;
  interactive?: boolean;
  as?: "div" | "article" | "section" | "aside";
  "aria-label"?: string;
}

/**
 * Carte Enterprise officielle — rayon, padding, ombre et bordure unifiés.
 */
export function EnterpriseCard({
  children,
  className = "",
  active = false,
  interactive = false,
  as: Tag = "div",
  "aria-label": ariaLabel,
}: EnterpriseCardProps) {
  return (
    <Tag
      className={`enterprise-card${active ? " enterprise-card--active" : ""}${interactive ? " enterprise-card--interactive" : ""}${className ? ` ${className}` : ""}`}
      aria-label={ariaLabel}
    >
      {children}
    </Tag>
  );
}
