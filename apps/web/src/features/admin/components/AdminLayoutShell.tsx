import type { AdminLiveSnapshot } from "@sonafrik/api/admin";
import type { AdminNavFeatureFlags } from "../lib/admin-nav";
import { AdminLayoutClient } from "./AdminLayoutClient";
import type { AdminHeaderUser } from "./AdminHeader";

interface AdminLayoutShellProps {
  children: React.ReactNode;
  liveSnapshot: AdminLiveSnapshot;
  adminUser: AdminHeaderUser;
  disableLiveRealtime?: boolean;
  navFeatureFlags?: AdminNavFeatureFlags;
}

export function AdminLayoutShell({
  children,
  liveSnapshot,
  adminUser,
  disableLiveRealtime = false,
  navFeatureFlags,
}: AdminLayoutShellProps) {
  return (
    <AdminLayoutClient
      liveSnapshot={liveSnapshot}
      adminUser={adminUser}
      disableLiveRealtime={disableLiveRealtime}
      navFeatureFlags={navFeatureFlags}
    >
      {children}
    </AdminLayoutClient>
  );
}
