"use client";

import Link from "next/link";
import { memo } from "react";
import {
  buildCreatorNavEntries,
  getCreatorNavLinks,
} from "../lib/creatorNavConfig";

interface CreatorMobileNavProps {
  activePath: string;
  pendingVerifications?: number;
}

function isActive(href: string, activePath: string, exact?: boolean): boolean {
  if (exact) return activePath === href;
  return activePath === href || activePath.startsWith(`${href}/`);
}

function CreatorMobileNavView({
  activePath,
  pendingVerifications = 0,
}: CreatorMobileNavProps) {
  const links = getCreatorNavLinks(buildCreatorNavEntries(pendingVerifications));

  return (
    <nav className="creator-mobile-nav" aria-label="Navigation espace artiste">
      <div className="creator-mobile-nav__scroll">
        {links.map((item) => {
          const active = isActive(item.href, activePath, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`creator-mobile-nav__pill${active ? " creator-mobile-nav__pill--active" : ""}`}
              aria-current={active ? "page" : undefined}
            >
              <span className="creator-mobile-nav__icon" aria-hidden="true">
                {item.icon}
              </span>
              <span className="creator-mobile-nav__label">{item.label}</span>
              {item.badge && item.badge > 0 ? (
                <span className="creator-mobile-nav__badge" aria-label={`${item.badge} en attente`}>
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export const CreatorMobileNav = memo(CreatorMobileNavView);
