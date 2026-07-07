"use client";

import Link from "next/link";
import { memo, type ReactNode } from "react";
import { MusicNavIcon } from "./MusicNavIcon";
import { MusicNavBadge } from "./MusicNavBadge";
import type { MusicNavBadgeKind, MusicNavIconName } from "./musicNavTypes";

export interface MusicNavLinkProps {
  href: string;
  label: string;
  icon: MusicNavIconName;
  active?: boolean;
  badge?: number | string;
  badgeKind?: MusicNavBadgeKind;
  description?: string;
  prefetch?: boolean;
  onNavigate?: () => void;
  onMouseEnter?: () => void;
  onFocus?: () => void;
  onTouchStart?: () => void;
  className?: string;
  children?: ReactNode;
}

export const MusicNavLink = memo(function MusicNavLink({
  href,
  label,
  icon,
  active = false,
  badge,
  badgeKind = "default",
  description,
  prefetch = true,
  onNavigate,
  onMouseEnter,
  onFocus,
  onTouchStart,
  className = "",
}: MusicNavLinkProps) {
  return (
    <Link
      href={href}
      prefetch={prefetch}
      scroll
      className={`music-nav__link${active ? " music-nav__link--active" : ""}${className ? ` ${className}` : ""}`}
      aria-current={active ? "page" : undefined}
      onClick={onNavigate}
      onMouseEnter={onMouseEnter}
      onFocus={onFocus}
      onTouchStart={onTouchStart}
    >
      <MusicNavIcon name={icon} />
      <span className="music-nav__text">
        <span className="music-nav__label">{label}</span>
        {description ? <span className="music-nav__description">{description}</span> : null}
      </span>
      {badge !== undefined && badge !== 0 && badge !== "" ? (
        <MusicNavBadge
          kind={badgeKind}
          label={badge}
          className={typeof badge === "number" ? "" : undefined}
        />
      ) : null}
    </Link>
  );
});
