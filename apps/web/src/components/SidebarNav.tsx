"use client";

import Link from "next/link";
import { Badge } from "@sonafrik/ui";

export type SidebarNavEntry =
  | { type: "section"; label: string }
  | {
      href: string;
      label: string;
      icon?: string;
      description?: string;
      exact?: boolean;
      badge?: number;
    };

/** @deprecated Use SidebarNavEntry */
export type SidebarNavItem = Extract<SidebarNavEntry, { href: string }>;

function isSectionEntry(entry: SidebarNavEntry): entry is { type: "section"; label: string } {
  return "type" in entry && entry.type === "section";
}

interface SidebarNavProps {
  title: string;
  items: SidebarNavEntry[];
  activePath: string;
  backHref: string;
  backLabel: string;
  variant?: "default" | "creator";
}

export function SidebarNav({
  title,
  items,
  activePath,
  backHref,
  backLabel,
  variant = "default",
}: SidebarNavProps) {
  const navClass = variant === "creator" ? "sidebar-nav sidebar-nav--creator" : "sidebar-nav";

  return (
    <nav className={navClass} aria-label={title}>
      <p className="sidebar-nav__title">{title}</p>
      <ul className="sidebar-nav__list">
        {items.map((item) => {
          if (isSectionEntry(item)) {
            return (
              <li key={`section-${item.label}`} className="sidebar-nav__section" aria-hidden="true">
                <span className="sidebar-nav__section-title">{item.label}</span>
              </li>
            );
          }

          const isActive = item.exact
            ? activePath === item.href
            : activePath === item.href || activePath.startsWith(`${item.href}/`);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`sidebar-nav__link${isActive ? " sidebar-nav__link--active" : ""}`}
                aria-current={isActive ? "page" : undefined}
              >
                {item.icon ? (
                  <span className="sidebar-nav__icon" aria-hidden="true">
                    {item.icon}
                  </span>
                ) : null}
                <span className="sidebar-nav__text">
                  <span className="sidebar-nav__label">{item.label}</span>
                  <span
                    className={
                      item.description
                        ? "sidebar-nav__description"
                        : "sidebar-nav__description sidebar-nav__description--empty"
                    }
                    aria-hidden={item.description ? undefined : true}
                  >
                    {item.description ?? ""}
                  </span>
                </span>
                {item.badge && item.badge > 0 ? (
                  <Badge variant="primary">{item.badge}</Badge>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
      <Link href={backHref} className="sidebar-nav__back">
        ← {backLabel}
      </Link>
    </nav>
  );
}
