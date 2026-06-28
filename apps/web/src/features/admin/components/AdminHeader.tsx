"use client";

import { usePathname } from "next/navigation";
import { ADMIN_PAGE_TITLES } from "../lib/admin-nav";

export interface AdminHeaderUser {
  fullName: string;
  initials: string;
}

interface AdminHeaderProps {
  user: AdminHeaderUser;
}

function resolvePageTitle(pathname: string): string {
  if (ADMIN_PAGE_TITLES[pathname]) return ADMIN_PAGE_TITLES[pathname];
  const match = Object.entries(ADMIN_PAGE_TITLES)
    .filter(([path]) => path !== "/admin")
    .sort((a, b) => b[0].length - a[0].length)
    .find(([path]) => pathname.startsWith(path));
  return match?.[1] ?? "Administration";
}

export function AdminHeader({ user }: AdminHeaderProps) {
  const pathname = usePathname();
  const pageTitle = resolvePageTitle(pathname);

  return (
    <header className="admin-header">
      <div className="admin-header-left">
        <nav className="admin-breadcrumb" aria-label="Fil d'Ariane">
          <span>Admin</span>
          <span className="admin-breadcrumb-sep" aria-hidden="true">
            ›
          </span>
          <span className="admin-breadcrumb-current">{pageTitle}</span>
        </nav>
      </div>

      <div className="admin-header-right">
        <div className="admin-live-indicator">
          <span className="admin-live-dot" aria-hidden="true" />
          <span>Temps réel</span>
        </div>

        <div className="admin-user-badge">
          <span className="admin-user-avatar" aria-hidden="true">
            {user.initials}
          </span>
          <div>
            <p className="admin-user-name">{user.fullName}</p>
            <p className="admin-user-role">Super Admin</p>
          </div>
        </div>
      </div>
    </header>
  );
}
