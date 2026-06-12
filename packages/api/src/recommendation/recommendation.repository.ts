import type { SonafrikSupabaseClient } from "@sonafrik/database";
import type { RecommendedTrack, SimilarTrack, TrendingTrack } from "@sonafrik/types";

export class RecommendationRepository {
  constructor(private readonly client: SonafrikSupabaseClient) {}

  async getTrendingTracks(window: string, limit: number): Promise<TrendingTrack[]> {
    const { data, error } = await this.client.rpc("get_trending_tracks" as never, {
      p_window: window,
      p_limit: limit,
    } as never);
    if (error) throw error;
    return (data as TrendingTrack[]) ?? [];
  }

  async getSimilarTracks(trackId: string, limit: number): Promise<SimilarTrack[]> {
    const { data, error } = await this.client.rpc("get_similar_tracks" as never, {
      p_track_id: trackId,
      p_limit: limit,
    } as never);
    if (error) throw error;
    return (data as SimilarTrack[]) ?? [];
  }

  async getRecommendations(limit: number): Promise<RecommendedTrack[]> {
    const { data, error } = await this.client.rpc("get_recommendations" as never, {
      p_limit: limit,
    } as never);
    if (error) throw error;
    return (data as RecommendedTrack[]) ?? [];
  }
}
