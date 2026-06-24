import type { SonafrikSupabaseClient } from "@sonafrik/database";
import type {
  CreatorStreamStats,
  StreamTimelineEntry,
  CreatorTopTrack,
  CreatorTopAlbum,
  CreatorAudienceStats,
  CreatorRevenueStats,
} from "@sonafrik/types";

export class AnalyticsRepository {
  constructor(private readonly client: SonafrikSupabaseClient) {}

  async getCreatorStreamStats(creatorId: string): Promise<CreatorStreamStats> {
    const { data, error } = await this.client.rpc("get_creator_stream_stats", {
      p_creator_id: creatorId,
    });
    if (error) throw error;
    return data as unknown as CreatorStreamStats;
  }

  async getCreatorStreamTimeline(
    creatorId: string,
    days: number,
  ): Promise<StreamTimelineEntry[]> {
    const { data, error } = await this.client.rpc("get_creator_stream_timeline", {
      p_creator_id: creatorId,
      p_days: days,
    });
    if (error) throw error;
    return (data as unknown as StreamTimelineEntry[]) ?? [];
  }

  async getCreatorTopTracks(
    creatorId: string,
    limit: number,
  ): Promise<CreatorTopTrack[]> {
    const { data, error } = await this.client.rpc("get_creator_top_tracks", {
      p_creator_id: creatorId,
      p_limit: limit,
    });
    if (error) throw error;
    return (data as unknown as CreatorTopTrack[]) ?? [];
  }

  async getCreatorTopAlbums(
    creatorId: string,
    limit: number,
  ): Promise<CreatorTopAlbum[]> {
    const { data, error } = await this.client.rpc("get_creator_top_albums", {
      p_creator_id: creatorId,
      p_limit: limit,
    });
    if (error) throw error;
    return (data as unknown as CreatorTopAlbum[]) ?? [];
  }

  async getCreatorAudienceStats(creatorId: string): Promise<CreatorAudienceStats> {
    const { data, error } = await this.client.rpc("get_creator_audience_stats", {
      p_creator_id: creatorId,
    });
    if (error) throw error;
    return data as unknown as CreatorAudienceStats;
  }

  async getCreatorRevenueStats(creatorId: string): Promise<CreatorRevenueStats> {
    const { data, error } = await this.client.rpc("get_creator_revenue_stats", {
      p_creator_id: creatorId,
    });
    if (error) throw error;
    return data as unknown as CreatorRevenueStats;
  }
}
