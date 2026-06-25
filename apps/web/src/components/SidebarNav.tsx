import Link from "next/link";
import { Badge } from "@sonafrik/ui";

export interface SidebarNavItem {
  href: string;
  label: string;
  exact?: boolean;
  badge?: number;
}

interface SidebarNavProps {
  title: string;
  items: SidebarNavItem[];
  activePath: string;
  backHref: string;
  backLabel: string;
}

export function SidebarNav({ title, items, activePath, backHref, backLabel }: SidebarNavProps) {
  return (
    <nav className="sidebar-nav" aria-label={title}>
      <p className="sidebar-nav__title">{title}</p>
      <ul className="sidebar-nav__list">
        {items.map((item) => {
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
                <span>{item.label}</span>
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
