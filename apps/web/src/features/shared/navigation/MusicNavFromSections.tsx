"use client";

import { MusicNavLink } from "./MusicNavLink";
import { MusicNavMenu, MusicNavSection } from "./MusicNavMenu";
import type { MusicNavBadgeKind, MusicNavSectionConfig } from "./musicNavTypes";

interface MusicNavFromSectionsProps {
  sections: MusicNavSectionConfig[];
  pathname: string;
  ariaLabel: string;
  isActive?: (href: string, pathname: string, exact?: boolean) => boolean;
  resolveBadge?: (
    item: MusicNavSectionConfig["items"][number],
  ) => { kind: MusicNavBadgeKind; label: string | number } | null;
  onNavigate?: () => void;
  onPrefetch?: (href: string) => void;
  className?: string;
}

function defaultIsActive(href: string, pathname: string, exact?: boolean): boolean {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MusicNavFromSections({
  sections,
  pathname,
  ariaLabel,
  isActive = defaultIsActive,
  resolveBadge,
  onNavigate,
  onPrefetch,
  className,
}: MusicNavFromSectionsProps) {
  return (
    <MusicNavMenu ariaLabel={ariaLabel} className={className}>
      {sections.map((section, index) => (
        <MusicNavSection key={section.title || `section-${index}`} title={section.title}>
          {section.items.map((item) => {
            const badge = resolveBadge?.(item);
            return (
              <MusicNavLink
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                description={item.description}
                active={isActive(item.href, pathname, item.exact)}
                badge={badge?.label ?? item.badge}
                badgeKind={badge?.kind ?? item.badgeKind}
                onNavigate={onNavigate}
                onMouseEnter={() => onPrefetch?.(item.href)}
                onFocus={() => onPrefetch?.(item.href)}
                onTouchStart={() => onPrefetch?.(item.href)}
              />
            );
          })}
        </MusicNavSection>
      ))}
    </MusicNavMenu>
  );
}
