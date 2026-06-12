import type { SonafrikSupabaseClient } from "@sonafrik/database";
import type {
  CreatorEngagementStats,
  EngagementStats,
  Favorite,
  Follow,
  FollowEntityType,
} from "@sonafrik/types";

export class SocialRepository {
  constructor(private readonly client: SonafrikSupabaseClient) {}

  // ---------------------------------------------------------------------------
  // Likes (favorites entity_type='track')
  // ---------------------------------------------------------------------------

  async toggleLike(trackId: string): Promise<boolean> {
    const { data, error } = await this.client.rpc("toggle_favorite", {
      p_entity_type: "track",
      p_entity_id: trackId,
    });
    if (error) throw error;
    return data as boolean;
  }

  async isLiked(trackId: string): Promise<boolean> {
    const { data, error } = await this.client.rpc("is_favorited", {
      p_entity_type: "track",
      p_entity_id: trackId,
    });
    if (error) throw error;
    return data as boolean;
  }

  async getLikeCount(trackId: string): Promise<number> {
    const { data, error } = await this.client.rpc("get_like_count" as never, {
      p_track_id: trackId,
    } as never);
    if (error) throw error;
    return (data as number) ?? 0;
  }

  // ---------------------------------------------------------------------------
  // Favorites (all entity types)
  // ---------------------------------------------------------------------------

  async toggleFavorite(entityType: Favorite["entity_type"], entityId: string): Promise<boolean> {
    const { data, error } = await this.client.rpc("toggle_favorite", {
      p_entity_type: entityType,
      p_entity_id: entityId,
    });
    if (error) throw error;
    return data as boolean;
  }

  async isFavorited(entityType: Favorite["entity_type"], entityId: string): Promise<boolean> {
    const { data, error } = await this.client.rpc("is_favorited", {
      p_entity_type: entityType,
      p_entity_id: entityId,
    });
    if (error) throw error;
    return data as boolean;
  }

  async getUserFavorites(userId: string): Promise<Favorite[]> {
    const { data, error } = await this.client
      .from("favorites")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Favorite[];
  }

  // ---------------------------------------------------------------------------
  // Follows
  // ---------------------------------------------------------------------------

  async toggleFollow(entityType: FollowEntityType, entityId: string): Promise<boolean> {
    const { data, error } = await this.client.rpc("toggle_follow" as never, {
      p_entity_type: entityType,
      p_entity_id: entityId,
    } as never);
    if (error) throw error;
    return data as boolean;
  }

  async isFollowing(entityType: FollowEntityType, entityId: string): Promise<boolean> {
    const { data, error } = await this.client.rpc("is_following" as never, {
      p_entity_type: entityType,
      p_entity_id: entityId,
    } as never);
    if (error) throw error;
    return (data as boolean) ?? false;
  }

  async getFollowCount(entityType: FollowEntityType, entityId: string): Promise<number> {
    const { data, error } = await this.client.rpc("get_follow_count" as never, {
      p_entity_type: entityType,
      p_entity_id: entityId,
    } as never);
    if (error) throw error;
    return (data as number) ?? 0;
  }

  async getUserFollows(userId: string): Promise<Follow[]> {
    const { data, error } = await this.client
      .from("follows" as never)
      .select("*")
      .eq("follower_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Follow[];
  }

  async getEntityFollowers(entityType: FollowEntityType, entityId: string): Promise<Follow[]> {
    const { data, error } = await this.client
      .from("follows" as never)
      .select("*")
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Follow[];
  }

  // ---------------------------------------------------------------------------
  // Engagement analytics
  // ---------------------------------------------------------------------------

  async getEngagementStats(entityType: string, entityId: string): Promise<EngagementStats> {
    const { data, error } = await this.client.rpc("get_engagement_stats" as never, {
      p_entity_type: entityType,
      p_entity_id: entityId,
    } as never);
    if (error) throw error;
    const result = data as EngagementStats;
    return {
      like_count: result?.like_count ?? 0,
      follow_count: result?.follow_count ?? 0,
      user_liked: result?.user_liked ?? false,
      user_favorited: result?.user_favorited ?? false,
      user_following: result?.user_following ?? false,
    };
  }

  async getCreatorEngagementStats(creatorId: string): Promise<CreatorEngagementStats> {
    const { data, error } = await this.client.rpc("get_creator_engagement_stats" as never, {
      p_creator_id: creatorId,
    } as never);
    if (error) throw error;
    const result = data as CreatorEngagementStats;
    return {
      track_likes: result?.track_likes ?? 0,
      album_favorites: result?.album_favorites ?? 0,
      artist_followers: result?.artist_followers ?? 0,
      creator_followers: result?.creator_followers ?? 0,
      playlist_followers: result?.playlist_followers ?? 0,
      total_engagement: result?.total_engagement ?? 0,
    };
  }
}
