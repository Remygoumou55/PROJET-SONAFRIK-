import type { AdminLiveSnapshot } from "@sonafrik/api/admin";
import { AdminLayoutClient } from "./AdminLayoutClient";
import type { AdminHeaderUser } from "./AdminHeader";

interface AdminLayoutShellProps {
  children: React.ReactNode;
  liveSnapshot: AdminLiveSnapshot;
  adminUser: AdminHeaderUser;
  disableLiveRealtime?: boolean;
}

export function AdminLayoutShell({
  children,
  liveSnapshot,
  adminUser,
  disableLiveRealtime = false,
}: AdminLayoutShellProps) {
  return (
    <AdminLayoutClient
      liveSnapshot={liveSnapshot}
      adminUser={adminUser}
      disableLiveRealtime={disableLiveRealtime}
    >
      {children}
    </AdminLayoutClient>
  );
}
