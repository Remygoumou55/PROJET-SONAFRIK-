/** Clés cache LDSE — social (likes, follows). */
export const SOCIAL_LDSE_KEYS = {
  like: (trackId: string) => `social:like:${trackId}`,
  follow: (entityType: string, entityId: string) => `social:follow:${entityType}:${entityId}`,
} as const;

export type SocialLikeState = { isLiked: boolean; likeCount: number };
export type SocialFollowState = { isFollowing: boolean; followerCount: number };

/** Événements métier social — Event Bus LDSE */
export const SOCIAL_LDSE_EVENTS = {
  likeToggled: "social.like.toggled",
  followToggled: "social.follow.toggled",
  invalidate: "social.invalidate",
} as const;
