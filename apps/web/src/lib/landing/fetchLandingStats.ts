import { createClient } from "@supabase/supabase-js";
import type { LandingPublicStats } from "./constants";
import { ACTIVE_STREAM_HEARTBEAT_MINUTES } from "./constants";

const HIDDEN: LandingPublicStats = {
  visible: false,
  activeStreams: 0,
  totalArtists: 0,
  royaltiesPaidGnf: 0,
  monthlyRoyaltiesGnf: 0,
};

/** Stats agrégées anonymisées pour la landing — aucune donnée personnelle. */
export async function fetchLandingStats(): Promise<LandingPublicStats> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return HIDDEN;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const supabase = createClient(url, key, {
      global: {
        fetch: (input, init) =>
          fetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer)),
      },
    });

    const heartbeatSince = new Date(
      Date.now() - ACTIVE_STREAM_HEARTBEAT_MINUTES * 60 * 1000,
    ).toISOString();

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [streamsRes, artistsRes, royaltiesRes, monthlyRes] = await Promise.all([
      supabase
        .from("stream_sessions")
        .select("id", { count: "exact", head: true })
        .is("completed_at", null)
        .gte("last_heartbeat_at", heartbeatSince),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .in("account_type", ["artiste", "auditeur_artiste"]),
      supabase
        .from("transactions")
        .select("net_amount_gnf")
        .eq("type", "royalty_payout")
        .eq("status", "completed"),
      supabase
        .from("transactions")
        .select("net_amount_gnf")
        .eq("type", "royalty_payout")
        .eq("status", "completed")
        .gte("created_at", monthStart.toISOString()),
    ]);

    const activeStreams = streamsRes.count ?? 0;
    const totalArtists = artistsRes.count ?? 0;

    const royaltiesPaidGnf = (royaltiesRes.data ?? []).reduce(
      (sum, row) => sum + (row.net_amount_gnf ?? 0),
      0,
    );
    const monthlyRoyaltiesGnf = (monthlyRes.data ?? []).reduce(
      (sum, row) => sum + (row.net_amount_gnf ?? 0),
      0,
    );

    const hasData = activeStreams > 0 || totalArtists > 0 || royaltiesPaidGnf > 0;
    if (!hasData) return HIDDEN;

    return {
      visible: true,
      activeStreams,
      totalArtists,
      royaltiesPaidGnf,
      monthlyRoyaltiesGnf,
    };
  } catch {
    return HIDDEN;
  }
}
