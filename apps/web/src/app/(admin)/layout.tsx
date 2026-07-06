import { getAdminSessionContext } from "@/features/admin/lib/getAdminSessionContext";
import { getAdminServiceForSession } from "@/features/admin/lib/getAdminService";
import { EMPTY_ADMIN_LIVE_SNAPSHOT } from "@/features/admin/lib/admin-empty-snapshot";
import { requireAdmin } from "@/features/admin/lib/requireAdmin";
import { isDevBypassActive } from "@/lib/auth/guards";
import { AdminLayoutShell } from "@/features/admin/components/AdminLayoutShell";
import { RealtimeShell } from "@/features/shared/rendering/RealtimeShell";
import { PerformanceProvider } from "@/lib/performance";
import { getCachedPerformanceFlags } from "@/lib/performance/server";
import "@/app/styles/admin-bundle.css";

export const dynamic = "force-dynamic";

/**
 * Layout admin allégé — snapshot live délégué au client (AdminLdseProvider + SRTSP).
 * Réduit TTFB et évite un re-fetch snapshot à chaque navigation inter-pages.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const [adminUser, admin] = await Promise.all([
    getAdminSessionContext(),
    getAdminServiceForSession(),
  ]);
  const [beatStoreAdmin, awardsAdmin] = await Promise.all([
    admin.isFeatureEnabled("beat_store_admin"),
    admin.isFeatureEnabled("awards_admin"),
  ]);
  const performanceFlags = await getCachedPerformanceFlags();

  return (
    <RealtimeShell>
      <PerformanceProvider flags={performanceFlags}>
      <AdminLayoutShell
        liveSnapshot={EMPTY_ADMIN_LIVE_SNAPSHOT}
        adminUser={adminUser}
        disableLiveRealtime={isDevBypassActive()}
        navFeatureFlags={{ beatStoreAdmin, awardsAdmin }}
      >
        {children}
      </AdminLayoutShell>
      </PerformanceProvider>
    </RealtimeShell>
  );
}
