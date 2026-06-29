import { AdminAnalyticsClient } from "@/features/admin/components/AdminAnalyticsClient";
import { getAdminServiceForSession } from "@/features/admin/lib/getAdminService";
import { isValidContentName } from "@/lib/content-filter";
import type { AdminAnalyticsDashboard } from "@sonafrik/api/admin";

export const metadata = { title: "Analytiques — Admin SONAFRIK" };
export const dynamic = "force-dynamic";

const EMPTY: AdminAnalyticsDashboard = {
  activeListeners: 0,
  tracksBeingPlayed: 0,
  topCity: "Guinée",
  topTrack: "—",
  recentStreams: [],
  topTracks: [],
  topArtists: [],
  health: {
    database: { latency: 0, status: "down" },
    storage: { latency: 0, status: "down" },
    payments: { latency: 0, status: "down" },
    streaming: { latency: 0, status: "down" },
  },
};

export default async function AdminAnalyticsPage() {
  const admin = await getAdminServiceForSession();
  let data = EMPTY;
  let loadError: string | null = null;

  try {
    const raw = await admin.getAnalyticsDashboard();
    data = {
      ...raw,
      recentStreams: raw.recentStreams.filter((s) => isValidContentName(s.trackTitle)),
      topTracks: raw.topTracks.filter((t) => isValidContentName(t.title)),
      topArtists: raw.topArtists.filter((a) => isValidContentName(a.stageName)),
    };
  } catch {
    loadError = "Impossible de charger les analytiques.";
  }

  return (
    <>
      {loadError && <p className="admin-inline-error">{loadError}</p>}
      <AdminAnalyticsClient initialData={data} />
    </>
  );
}
