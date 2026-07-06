import type { SonafrikSupabaseClient } from "@sonafrik/database";
import type {
  CreatorAnalyticsData,
  CreatorStreamStats,
  StreamTimelineEntry,
  CreatorTopTrack,
  CreatorTopAlbum,
  CreatorAudienceStats,
  CreatorRevenueStats,
} from "@sonafrik/types";
import { AnalyticsError } from "./errors";
import { AnalyticsRepository } from "./analytics.repository";
import {
  creatorAnalyticsInputSchema,
  streamTimelineInputSchema,
  topContentInputSchema,
  type CreatorAnalyticsInput,
  type StreamTimelineInput,
  type TopContentInput,
} from "./schemas";

export class AnalyticsService {
  private readonly repository: AnalyticsRepository;

  constructor(private readonly client: SonafrikSupabaseClient) {
    this.repository = new AnalyticsRepository(client);
  }

  async getStreamStats(input: CreatorAnalyticsInput): Promise<CreatorStreamStats> {
    const parsed = creatorAnalyticsInputSchema.safeParse(input);
    if (!parsed.success) throw new AnalyticsError("stream_stats_failed");
    try {
      return await this.repository.getCreatorStreamStats(parsed.data.creatorId);
    } catch {
      throw new AnalyticsError("stream_stats_failed");
    }
  }

  async getStreamTimeline(input: StreamTimelineInput): Promise<StreamTimelineEntry[]> {
    const parsed = streamTimelineInputSchema.safeParse(input);
    if (!parsed.success) throw new AnalyticsError("timeline_failed");
    try {
      return await this.repository.getCreatorStreamTimeline(
        parsed.data.creatorId,
        parsed.data.days,
      );
    } catch {
      throw new AnalyticsError("timeline_failed");
    }
  }

  async getTopTracks(input: TopContentInput): Promise<CreatorTopTrack[]> {
    const parsed = topContentInputSchema.safeParse(input);
    if (!parsed.success) throw new AnalyticsError("top_tracks_failed");
    try {
      return await this.repository.getCreatorTopTracks(
        parsed.data.creatorId,
        parsed.data.limit,
      );
    } catch {
      throw new AnalyticsError("top_tracks_failed");
    }
  }

  async getTopAlbums(input: TopContentInput): Promise<CreatorTopAlbum[]> {
    const parsed = topContentInputSchema.safeParse(input);
    if (!parsed.success) throw new AnalyticsError("top_albums_failed");
    try {
      return await this.repository.getCreatorTopAlbums(
        parsed.data.creatorId,
        parsed.data.limit,
      );
    } catch {
      throw new AnalyticsError("top_albums_failed");
    }
  }

  async getAudienceStats(input: CreatorAnalyticsInput): Promise<CreatorAudienceStats> {
    const parsed = creatorAnalyticsInputSchema.safeParse(input);
    if (!parsed.success) throw new AnalyticsError("audience_stats_failed");
    try {
      return await this.repository.getCreatorAudienceStats(parsed.data.creatorId);
    } catch {
      throw new AnalyticsError("audience_stats_failed");
    }
  }

  async getRevenueStats(input: CreatorAnalyticsInput): Promise<CreatorRevenueStats> {
    const parsed = creatorAnalyticsInputSchema.safeParse(input);
    if (!parsed.success) throw new AnalyticsError("revenue_stats_failed");
    try {
      return await this.repository.getCreatorRevenueStats(parsed.data.creatorId);
    } catch {
      throw new AnalyticsError("revenue_stats_failed");
    }
  }

  async getFullAnalytics(
    creatorId: string,
    timelineDays = 30,
  ): Promise<CreatorAnalyticsData> {
    const input = { creatorId };
    const [streamStats, timeline, topTracks, topAlbums, audienceStats, revenueStats] =
      await Promise.all([
        this.getStreamStats(input),
        this.getStreamTimeline({ creatorId, days: timelineDays }),
        this.getTopTracks({ creatorId, limit: 10 }),
        this.getTopAlbums({ creatorId, limit: 10 }),
        this.getAudienceStats(input),
        this.getRevenueStats(input),
      ]);
    return { streamStats, timeline, topTracks, topAlbums, audienceStats, revenueStats, royaltyHistory: [] };
  }
}

export function createAnalyticsService(client: SonafrikSupabaseClient): AnalyticsService {
  return new AnalyticsService(client);
}
