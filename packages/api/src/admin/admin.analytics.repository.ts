import { countQuery, type AdminRepoClient } from "./admin.shared";
import { fetchStageNamesByCreatorIds } from "../common/stage-name.helpers";
import type {
  AdminAnalyticsDashboard,
  AdminAnalyticsHealthService,
  AdminAnalyticsRecentStream,
  AdminAnalyticsTopArtist,
  AdminAnalyticsTopTrack,
} from "./types";

const ACTIVE_HEARTBEAT_MS = 5 * 60 * 1000;

type TrendingTrackRow = {
  track_id?: string;
  title?: string;
  artist_name?: string;
  listen_count?: number;
};

function healthStatusFromLatency(latencyMs: number, ok: boolean): AdminAnalyticsHealthService["status"] {
  if (!ok) return "down";
  if (latencyMs > 2000) return "slow";
  return "ok";
}

function parseTrendingRows(data: unknown): TrendingTrackRow[] {
  if (Array.isArray(data)) return data as TrendingTrackRow[];
  return [];
}

export class AdminAnalyticsRepository {
  constructor(private readonly client: AdminRepoClient) {}

  private activeSessionsSince(): string {
    return new Date(Date.now() - ACTIVE_HEARTBEAT_MS).toISOString();
  }

  async getDashboard(): Promise<AdminAnalyticsDashboard> {
    const sinceActive = this.activeSessionsSince();
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [
      activeListeners,
      tracksBeingPlayedRes,
      recentSessionsRes,
      activeUserIdsRes,
      trendingRes,
      weekSessionsRes,
      healthChecks,
    ] = await Promise.all([
      countQuery(
        this.client
          .from("stream_sessions")
          .select("*", { count: "exact", head: true })
          .is("completed_at", null)
          .gte("last_heartbeat_at", sinceActive),
      ),
      this.client
        .from("stream_sessions")
        .select("track_id")
        .is("completed_at", null)
        .gte("last_heartbeat_at", sinceActive),
      this.client
        .from("stream_sessions")
        .select("id, track_id, user_id, platform, started_at")
        .eq("is_valid_listen", true)
        .order("started_at", { ascending: false })
        .limit(10),
      this.client
        .from("stream_sessions")
        .select("user_id")
        .is("completed_at", null)
        .gte("last_heartbeat_at", sinceActive)
        .limit(500),
      this.client.rpc("get_trending_tracks", { p_window: "7d", p_limit: 10 }),
      this.client
        .from("stream_sessions")
        .select("track_id")
        .eq("is_valid_listen", true)
        .gte("started_at", weekAgo)
        .limit(8000),
      this.runHealthChecks(),
    ]);

    if (recentSessionsRes.error) throw recentSessionsRes.error;
    if (weekSessionsRes.error) throw weekSessionsRes.error;

    const distinctTracks = new Set(
      (tracksBeingPlayedRes.data ?? []).map((row) => row.track_id as string),
    );

    const trackIds = [...new Set((recentSessionsRes.data ?? []).map((r) => r.track_id as string))];
    const userIds = [...new Set((recentSessionsRes.data ?? []).map((r) => r.user_id as string))];
    const activeUserIds = [...new Set((activeUserIdsRes.data ?? []).map((r) => r.user_id as string))];

    const weekTrackIds = (weekSessionsRes.data ?? []).map((r) => r.track_id as string);
    const allTrackIds = [...new Set([...trackIds, ...weekTrackIds])];

    const [tracksMetaRes, profilesMetaRes, activeProfilesRes] = await Promise.all([
      allTrackIds.length
        ? this.client.from("tracks").select("id, title, creator_id").in("id", allTrackIds)
        : Promise.resolve({ data: [], error: null }),
      userIds.length
        ? this.client.from("profiles").select("id, city, country_code").in("id", userIds)
        : Promise.resolve({ data: [], error: null }),
      activeUserIds.length
        ? this.client.from("profiles").select("id, city, country_code").in("id", activeUserIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (tracksMetaRes.error) throw tracksMetaRes.error;

    const trackTitleById = new Map(
      (tracksMetaRes.data ?? []).map((t) => [t.id as string, t.title as string]),
    );
    const creatorByTrack = new Map(
      (tracksMetaRes.data ?? []).map((t) => [t.id as string, t.creator_id as string]),
    );
    const creatorIds = [...new Set((tracksMetaRes.data ?? []).map((t) => t.creator_id as string))];
    const stageNames = await fetchStageNamesByCreatorIds(this.client, creatorIds);

    const profileCityByUser = new Map(
      (profilesMetaRes.data ?? []).map((p) => [
        p.id as string,
        (p.city as string | null) ?? (p.country_code as string | null) ?? "Guinée",
      ]),
    );

    const cityCounts = new Map<string, number>();
    for (const row of activeProfilesRes.data ?? []) {
      const label = (row.city as string | null) ?? (row.country_code as string | null) ?? "Guinée";
      cityCounts.set(label, (cityCounts.get(label) ?? 0) + 1);
    }
    const topCity =
      [...cityCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Guinée";

    const recentStreams: AdminAnalyticsRecentStream[] = (recentSessionsRes.data ?? []).map((row) => {
      const trackId = row.track_id as string;
      const creatorId = creatorByTrack.get(trackId);
      return {
        trackTitle: trackTitleById.get(trackId) ?? "—",
        artistName: creatorId ? (stageNames.get(creatorId) ?? "—") : "—",
        city: profileCityByUser.get(row.user_id as string) ?? "Guinée",
        at: row.started_at as string,
      };
    });

    const trendingList = parseTrendingRows(trendingRes.data);
    const topTrack = trendingList[0]?.title ?? recentStreams[0]?.trackTitle ?? "—";

    const topTracks: AdminAnalyticsTopTrack[] = trendingList.map((row, index) => ({
      id: (row.track_id as string) ?? `track-${index}`,
      title: row.title ?? "—",
      artistName: row.artist_name ?? "—",
      streams: Number(row.listen_count ?? 0),
    }));

    const artistStreamMap = new Map<string, number>();
    for (const trackId of weekTrackIds) {
      const creatorId = creatorByTrack.get(trackId);
      if (!creatorId) continue;
      artistStreamMap.set(creatorId, (artistStreamMap.get(creatorId) ?? 0) + 1);
    }

    const topArtistCreatorIds = [...artistStreamMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id]) => id);

    const genresRes = topArtistCreatorIds.length
      ? await this.client
          .from("artist_profiles")
          .select("creator_id, genres")
          .in("creator_id", topArtistCreatorIds)
      : { data: [], error: null };

    const genreByCreator = new Map(
      (genresRes.data ?? []).map((a) => [
        a.creator_id as string,
        ((a.genres as string[] | null)?.[0] ?? "—") as string,
      ]),
    );

    const topArtists: AdminAnalyticsTopArtist[] = topArtistCreatorIds.map((creatorId) => ({
      id: creatorId,
      stageName: stageNames.get(creatorId) ?? "—",
      genre: genreByCreator.get(creatorId) ?? "—",
      streams: artistStreamMap.get(creatorId) ?? 0,
    }));

    return {
      activeListeners,
      tracksBeingPlayed: distinctTracks.size,
      topCity,
      topTrack,
      recentStreams,
      topTracks,
      topArtists,
      health: healthChecks,
    };
  }

  private async runHealthChecks(): Promise<AdminAnalyticsDashboard["health"]> {
    const run = async (fn: () => Promise<void>): Promise<{ latency: number; ok: boolean }> => {
      const start = Date.now();
      try {
        await fn();
        return { latency: Date.now() - start, ok: true };
      } catch {
        return { latency: Date.now() - start, ok: false };
      }
    };

    const [database, storage, payments, streaming] = await Promise.all([
      run(async () => {
        const { error } = await this.client.from("tracks").select("id").limit(1);
        if (error) throw error;
      }),
      run(async () => {
        const { error } = await this.client.storage.from("covers").list("", { limit: 1 });
        if (error) throw error;
      }),
      run(async () => {
        const { error } = await this.client
          .from("payment_intents")
          .select("id")
          .eq("status", "confirmed")
          .limit(1);
        if (error) throw error;
      }),
      run(async () => {
        const { error } = await this.client.from("stream_sessions").select("id").limit(1);
        if (error) throw error;
      }),
    ]);

    return {
      database: {
        latency: database.latency,
        status: healthStatusFromLatency(database.latency, database.ok),
      },
      storage: {
        latency: storage.latency,
        status: healthStatusFromLatency(storage.latency, storage.ok),
      },
      payments: {
        latency: payments.latency,
        status: healthStatusFromLatency(payments.latency, payments.ok),
      },
      streaming: {
        latency: streaming.latency,
        status: healthStatusFromLatency(streaming.latency, streaming.ok),
      },
    };
  }
}
