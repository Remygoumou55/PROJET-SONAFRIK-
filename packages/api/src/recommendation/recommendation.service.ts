import type { SonafrikSupabaseClient } from "@sonafrik/database";
import type { RecommendedTrack, SimilarTrack, TrendingTrack } from "@sonafrik/types";
import { RecommendationError } from "./errors";
import { RecommendationRepository } from "./recommendation.repository";
import {
  recommendationsSchema,
  similarTracksSchema,
  trendingSchema,
  type RecommendationsInput,
  type SimilarTracksInput,
  type TrendingInput,
} from "./schemas";

export class RecommendationService {
  private readonly repository: RecommendationRepository;

  constructor(private readonly client: SonafrikSupabaseClient) {
    this.repository = new RecommendationRepository(client);
  }

  private async requireUserId(): Promise<string> {
    const {
      data: { user },
    } = await this.client.auth.getUser();
    if (!user) throw new RecommendationError("unauthorized");
    return user.id;
  }

  async getTrendingTracks(input: TrendingInput): Promise<TrendingTrack[]> {
    const parsed = trendingSchema.safeParse(input);
    if (!parsed.success) throw new RecommendationError("trending_failed");
    try {
      return await this.repository.getTrendingTracks(parsed.data.window, parsed.data.limit);
    } catch {
      throw new RecommendationError("trending_failed");
    }
  }

  async getSimilarTracks(input: SimilarTracksInput): Promise<SimilarTrack[]> {
    const parsed = similarTracksSchema.safeParse(input);
    if (!parsed.success) throw new RecommendationError("similar_failed");
    try {
      return await this.repository.getSimilarTracks(parsed.data.trackId, parsed.data.limit);
    } catch {
      throw new RecommendationError("similar_failed");
    }
  }

  async getRecommendations(input: RecommendationsInput): Promise<RecommendedTrack[]> {
    const parsed = recommendationsSchema.safeParse(input);
    if (!parsed.success) throw new RecommendationError("recommendations_failed");
    await this.requireUserId();
    try {
      return await this.repository.getRecommendations(parsed.data.limit);
    } catch {
      throw new RecommendationError("recommendations_failed");
    }
  }
}

export function createRecommendationService(client: SonafrikSupabaseClient): RecommendationService {
  return new RecommendationService(client);
}
