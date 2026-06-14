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
    <nav className="flex flex-col gap-1">
      <p className="text-texte-desactive mb-2 px-3 text-xs font-semibold uppercase tracking-wider">
        {title}
      </p>
      {items.map((item) => {
        const isActive = item.exact
          ? activePath === item.href
          : activePath === item.href || activePath.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
              isActive
                ? "bg-elevated text-vert-energie font-medium"
                : "text-texte-secondaire hover:bg-elevated hover:text-texte-principal"
            }`}
          >
            <span>{item.label}</span>
            {item.badge && item.badge > 0 ? (
              <Badge variant="primary">{item.badge}</Badge>
            ) : null}
          </Link>
        );
      })}
      <Link
        href={backHref}
        className="text-texte-desactive mt-4 px-3 text-xs hover:text-texte-secondaire"
      >
        ← {backLabel}
      </Link>
    </nav>
  );
}
