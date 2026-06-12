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
    const { data, error } = await this.client.rpc(
      "get_creator_stream_stats" as never,
      { p_creator_id: creatorId } as never,
    );
    if (error) throw error;
    return data as CreatorStreamStats;
  }

  async getCreatorStreamTimeline(
    creatorId: string,
    days: number,
  ): Promise<StreamTimelineEntry[]> {
    const { data, error } = await this.client.rpc(
      "get_creator_stream_timeline" as never,
      { p_creator_id: creatorId, p_days: days } as never,
    );
    if (error) throw error;
    return (data as StreamTimelineEntry[]) ?? [];
  }

  async getCreatorTopTracks(
    creatorId: string,
    limit: number,
  ): Promise<CreatorTopTrack[]> {
    const { data, error } = await this.client.rpc(
      "get_creator_top_tracks" as never,
      { p_creator_id: creatorId, p_limit: limit } as never,
    );
    if (error) throw error;
    return (data as CreatorTopTrack[]) ?? [];
  }

  async getCreatorTopAlbums(
    creatorId: string,
    limit: number,
  ): Promise<CreatorTopAlbum[]> {
    const { data, error } = await this.client.rpc(
      "get_creator_top_albums" as never,
      { p_creator_id: creatorId, p_limit: limit } as never,
    );
    if (error) throw error;
    return (data as CreatorTopAlbum[]) ?? [];
  }

  async getCreatorAudienceStats(creatorId: string): Promise<CreatorAudienceStats> {
    const { data, error } = await this.client.rpc(
      "get_creator_audience_stats" as never,
      { p_creator_id: creatorId } as never,
    );
    if (error) throw error;
    return data as CreatorAudienceStats;
  }

  async getCreatorRevenueStats(creatorId: string): Promise<CreatorRevenueStats> {
    const { data, error } = await this.client.rpc(
      "get_creator_revenue_stats" as never,
      { p_creator_id: creatorId } as never,
    );
    if (error) throw error;
    return data as CreatorRevenueStats;
  }
}
