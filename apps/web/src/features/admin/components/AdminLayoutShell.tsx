import type { AdminNavBadges } from "@sonafrik/api/admin";
import { AdminLayoutClient } from "./AdminLayoutClient";
import type { AdminHeaderUser } from "./AdminHeader";

interface AdminLayoutShellProps {
  children: React.ReactNode;
  navBadges?: AdminNavBadges;
  adminUser: AdminHeaderUser;
  disableLiveRealtime?: boolean;
}

export function AdminLayoutShell({
  children,
  navBadges,
  adminUser,
  disableLiveRealtime = false,
}: AdminLayoutShellProps) {
  return (
    <AdminLayoutClient
      navBadges={navBadges}
      adminUser={adminUser}
      disableLiveRealtime={disableLiveRealtime}
    >
      {children}
    </AdminLayoutClient>
  );
}
