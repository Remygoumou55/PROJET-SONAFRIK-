import { Suspense } from "react";
import { getAdminServiceForSession } from "@/features/admin/lib/getAdminService";
import { getAdminSessionContext } from "@/features/admin/lib/getAdminSessionContext";
import { requireAdmin } from "@/features/admin/lib/requireAdmin";
import { isDevBypassActive } from "@/lib/auth/guards";
import { AdminLayoutShell } from "@/features/admin/components/AdminLayoutShell";
import AdminLoading from "./loading";
import "@/app/styles/admin.css";
import "@/app/styles/admin-dashboard-human.css";
import "@/app/styles/admin-responsive.css";
import "@/app/styles/admin-fraud-human.css";
import "@/app/styles/admin-sprint5.css";

export const dynamic = "force-dynamic";

async function AdminGuard({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const admin = await getAdminServiceForSession();
  const [liveSnapshot, adminUser] = await Promise.all([
    admin.getAdminLiveSnapshot().catch(() => ({
      navBadges: {
        content: 0,
        pendingRightsClaims: 0,
        fraudSessions: 0,
        withdrawals: 0,
      },
      fraudMetrics: {
        totalFlagged: 0,
        flaggedThisMonth: 0,
        flaggedToday: 0,
      },
      moderationMetrics: {
        pendingAlbums: 0,
        pendingTracks: 0,
        pendingCatalog: 0,
        pendingWithdrawals: 0,
        pendingRightsClaims: 0,
        pendingArtistVerifications: 0,
      },
      userMetrics: {
        totalUsers: 0,
        premiumUsers: 0,
        newUsersToday: 0,
        activeArtists: 0,
        newArtistsThisWeek: 0,
      },
      fetchedAt: new Date().toISOString(),
    })),
    getAdminSessionContext(),
  ]);

  return (
    <AdminLayoutShell
      liveSnapshot={liveSnapshot}
      adminUser={adminUser}
      disableLiveRealtime={isDevBypassActive()}
    >
      {children}
    </AdminLayoutShell>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <AdminGuard>{children}</AdminGuard>
    </Suspense>
  );
}
