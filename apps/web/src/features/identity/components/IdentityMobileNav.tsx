"use client";

import Link from "next/link";
import { memo } from "react";
import { IDENTITY_NAV_ENTRIES, isIdentityNavActive } from "../lib/identityNavConfig";

interface IdentityMobileNavProps {
  activePath: string;
  unreadNotifications?: number;
}

function IdentityMobileNavView({ activePath, unreadNotifications = 0 }: IdentityMobileNavProps) {
  return (
    <nav className="identity-mobile-nav" aria-label="Navigation profil et paramètres">
      <div className="identity-mobile-nav__scroll">
        {IDENTITY_NAV_ENTRIES.map((item) => {
          const active = isIdentityNavActive(item.href, activePath, item.exact);
          const badge =
            item.href === "/settings/notifications" && unreadNotifications > 0
              ? unreadNotifications
              : undefined;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`identity-mobile-nav__pill${active ? " identity-mobile-nav__pill--active" : ""}`}
              aria-current={active ? "page" : undefined}
            >
              <span className="identity-mobile-nav__label">{item.shortLabel}</span>
              {badge ? (
                <span className="identity-mobile-nav__badge" aria-label={`${badge} non lues`}>
                  {badge > 99 ? "99+" : badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export const IdentityMobileNav = memo(IdentityMobileNavView);
