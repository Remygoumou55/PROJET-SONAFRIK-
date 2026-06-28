import type { AdminNavBadges } from "@sonafrik/api/admin";
import { AdminHeader, type AdminHeaderUser } from "./AdminHeader";
import { AdminSidebar } from "./AdminSidebar";

interface AdminLayoutShellProps {
  children: React.ReactNode;
  navBadges?: AdminNavBadges;
  adminUser: AdminHeaderUser;
}

export function AdminLayoutShell({ children, navBadges, adminUser }: AdminLayoutShellProps) {
  return (
    <div className="admin-layout">
      <AdminSidebar badges={navBadges} />
      <div className="admin-main">
        <AdminHeader user={adminUser} />
        <div className="admin-content">{children}</div>
      </div>
    </div>
  );
}
