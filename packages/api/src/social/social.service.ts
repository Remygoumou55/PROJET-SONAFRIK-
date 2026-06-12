import type { SonafrikSupabaseClient } from "@sonafrik/database";
import type {
  CreatorEngagementStats,
  EngagementStats,
  Favorite,
  FavoriteEntityType,
  Follow,
  FollowEntityType,
} from "@sonafrik/types";
import { SocialError } from "./errors";
import { SocialRepository } from "./social.repository";
import {
  getCreatorEngagementStatsSchema,
  getEngagementStatsSchema,
  getFollowCountSchema,
  getLikeCountSchema,
  isFollowingSchema,
  toggleFollowSchema,
  toggleLikeSchema,
  toggleFavoriteSchema,
  type GetCreatorEngagementStatsInput,
  type GetEngagementStatsInput,
  type GetFollowCountInput,
  type GetLikeCountInput,
  type IsFollowingInput,
  type ToggleFollowInput,
  type ToggleLikeInput,
  type ToggleSocialFavoriteInput,
} from "./schemas";

export class SocialService {
  private readonly repository: SocialRepository;

  constructor(private readonly client: SonafrikSupabaseClient) {
    this.repository = new SocialRepository(client);
  }

  private async requireUserId(): Promise<string> {
    const {
      data: { user },
    } = await this.client.auth.getUser();
    if (!user) throw new SocialError("unauthorized");
    return user.id;
  }

  // ---------------------------------------------------------------------------
  // Likes — track favorites
  // ---------------------------------------------------------------------------

  async toggleLike(input: ToggleLikeInput): Promise<boolean> {
    const parsed = toggleLikeSchema.safeParse(input);
    if (!parsed.success) throw new SocialError("like_failed");
    await this.requireUserId();
    try {
      return await this.repository.toggleLike(parsed.data.trackId);
    } catch {
      throw new SocialError("like_failed");
    }
  }

  async isLiked(input: ToggleLikeInput): Promise<boolean> {
    const parsed = toggleLikeSchema.safeParse(input);
    if (!parsed.success) return false;
    await this.requireUserId();
    try {
      return await this.repository.isLiked(parsed.data.trackId);
    } catch {
      return false;
    }
  }

  async getLikeCount(input: GetLikeCountInput): Promise<number> {
    const parsed = getLikeCountSchema.safeParse(input);
    if (!parsed.success) return 0;
    try {
      return await this.repository.getLikeCount(parsed.data.trackId);
    } catch {
      return 0;
    }
  }

  // ---------------------------------------------------------------------------
  // Favorites — all entity types
  // ---------------------------------------------------------------------------

  async toggleFavorite(input: ToggleSocialFavoriteInput): Promise<boolean> {
    const parsed = toggleFavoriteSchema.safeParse(input);
    if (!parsed.success) throw new SocialError("favorite_failed");
    await this.requireUserId();
    try {
      return await this.repository.toggleFavorite(
        parsed.data.entityType as FavoriteEntityType,
        parsed.data.entityId,
      );
    } catch {
      throw new SocialError("favorite_failed");
    }
  }

  async isFavorited(input: ToggleSocialFavoriteInput): Promise<boolean> {
    const parsed = toggleFavoriteSchema.safeParse(input);
    if (!parsed.success) return false;
    await this.requireUserId();
    try {
      return await this.repository.isFavorited(
        parsed.data.entityType as FavoriteEntityType,
        parsed.data.entityId,
      );
    } catch {
      return false;
    }
  }

  async getUserFavorites(): Promise<Favorite[]> {
    const userId = await this.requireUserId();
    try {
      return await this.repository.getUserFavorites(userId);
    } catch {
      throw new SocialError("favorite_failed");
    }
  }

  // ---------------------------------------------------------------------------
  // Follows
  // ---------------------------------------------------------------------------

  async toggleFollow(input: ToggleFollowInput): Promise<boolean> {
    const parsed = toggleFollowSchema.safeParse(input);
    if (!parsed.success) throw new SocialError("follow_failed");
    await this.requireUserId();
    try {
      return await this.repository.toggleFollow(parsed.data.entityType, parsed.data.entityId);
    } catch {
      throw new SocialError("follow_failed");
    }
  }

  async isFollowing(input: IsFollowingInput): Promise<boolean> {
    const parsed = isFollowingSchema.safeParse(input);
    if (!parsed.success) return false;
    await this.requireUserId();
    try {
      return await this.repository.isFollowing(parsed.data.entityType, parsed.data.entityId);
    } catch {
      return false;
    }
  }

  async getFollowCount(input: GetFollowCountInput): Promise<number> {
    const parsed = getFollowCountSchema.safeParse(input);
    if (!parsed.success) return 0;
    try {
      return await this.repository.getFollowCount(parsed.data.entityType, parsed.data.entityId);
    } catch {
      return 0;
    }
  }

  async getUserFollows(): Promise<Follow[]> {
    const userId = await this.requireUserId();
    try {
      return await this.repository.getUserFollows(userId);
    } catch {
      throw new SocialError("follow_failed");
    }
  }

  async getEntityFollowers(entityType: FollowEntityType, entityId: string): Promise<Follow[]> {
    try {
      return await this.repository.getEntityFollowers(entityType, entityId);
    } catch {
      throw new SocialError("follow_failed");
    }
  }

  // ---------------------------------------------------------------------------
  // Engagement analytics
  // ---------------------------------------------------------------------------

  async getEngagementStats(input: GetEngagementStatsInput): Promise<EngagementStats> {
    const parsed = getEngagementStatsSchema.safeParse(input);
    if (!parsed.success) throw new SocialError("engagement_failed");
    try {
      return await this.repository.getEngagementStats(parsed.data.entityType, parsed.data.entityId);
    } catch {
      throw new SocialError("engagement_failed");
    }
  }

  async getCreatorEngagementStats(input: GetCreatorEngagementStatsInput): Promise<CreatorEngagementStats> {
    const parsed = getCreatorEngagementStatsSchema.safeParse(input);
    if (!parsed.success) throw new SocialError("engagement_failed");
    await this.requireUserId();
    try {
      return await this.repository.getCreatorEngagementStats(parsed.data.creatorId);
    } catch {
      throw new SocialError("engagement_failed");
    }
  }
}

export function createSocialService(client: SonafrikSupabaseClient): SocialService {
  return new SocialService(client);
}
