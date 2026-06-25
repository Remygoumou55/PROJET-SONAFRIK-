import type { CreatorInspirationArtist, CreatorMonthlyRevenuePoint } from "@sonafrik/types";
import type { SonafrikSupabaseClient } from "@sonafrik/database";
import type { TrendingTrack } from "@sonafrik/types";

export interface CreatorCatalogCounts {
  tracksPublished: number;
  albumsPublished: number;
}

export class CreatorDashboardRepository {
  constructor(private readonly client: SonafrikSupabaseClient) {}

  async getCatalogCounts(creatorId: string): Promise<CreatorCatalogCounts> {
    const [tracksRes, albumsRes] = await Promise.all([
      this.client
        .from("tracks")
        .select("id", { count: "exact", head: true })
        .eq("creator_id", creatorId)
        .eq("publication_status", "published"),
      this.client
        .from("albums")
        .select("id", { count: "exact", head: true })
        .eq("creator_id", creatorId)
        .eq("publication_status", "published"),
    ]);

    return {
      tracksPublished: tracksRes.count ?? 0,
      albumsPublished: albumsRes.count ?? 0,
    };
  }

  async isPaymentConfigured(userId: string): Promise<boolean> {
    const { data, error } = await this.client
      .from("profiles")
      .select("orange_money_number, mtn_money_number")
      .eq("id", userId)
      .maybeSingle();

    if (error || !data) return false;
    const row = data as { orange_money_number: string | null; mtn_money_number: string | null };
    return Boolean(row.orange_money_number?.trim() || row.mtn_money_number?.trim());
  }

  async getMonthlyRoyalties(creatorId: string, months = 6): Promise<CreatorMonthlyRevenuePoint[]> {
    const since = new Date();
    since.setMonth(since.getMonth() - months);

    const { data, error } = await this.client
      .from("royalty_calculations")
      .select("net_amount_gnf, created_at")
      .eq("creator_id", creatorId)
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: true });

    if (error || !data?.length) return [];

    const buckets = new Map<string, number>();
    for (const row of data as { net_amount_gnf: number; created_at: string }[]) {
      const d = new Date(row.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      buckets.set(key, (buckets.get(key) ?? 0) + Number(row.net_amount_gnf ?? 0));
    }

    return Array.from(buckets.entries()).map(([month, amountGnf]) => ({ month, amountGnf }));
  }

  async getInspirationArtists(
    trendingTracks: TrendingTrack[],
    excludeCreatorId: string,
    limit = 3,
  ): Promise<CreatorInspirationArtist[]> {
    const byCreator = new Map<string, { streams: number; name: string }>();
    for (const track of trendingTracks) {
      if (track.creator_id === excludeCreatorId) continue;
      const existing = byCreator.get(track.creator_id);
      const streams = (existing?.streams ?? 0) + track.listen_count;
      byCreator.set(track.creator_id, {
        streams,
        name: track.artist_name ?? "Artiste",
      });
    }

    const topIds = [...byCreator.entries()]
      .sort((a, b) => b[1].streams - a[1].streams)
      .slice(0, limit)
      .map(([id]) => id);

    if (topIds.length === 0) return [];

    const { data: profiles } = await this.client
      .from("artist_profiles")
      .select("creator_id, stage_name, genres, cover_path")
      .in("creator_id", topIds);

    const profileMap = new Map(
      (profiles ?? []).map((p) => {
        const row = p as {
          creator_id: string;
          stage_name: string;
          genres: string[];
          cover_path: string | null;
        };
        return [row.creator_id, row];
      }),
    );

    return topIds.map((creatorId) => {
      const profile = profileMap.get(creatorId);
      const agg = byCreator.get(creatorId)!;
      return {
        creatorId,
        stageName: profile?.stage_name ?? agg.name,
        genreLabel: profile?.genres?.[0] ?? "Musique",
        weeklyStreams: agg.streams,
        coverPath: profile?.cover_path ?? null,
      };
    });
  }
}
