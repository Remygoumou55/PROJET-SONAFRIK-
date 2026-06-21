/** SONAFRIK — Domaine Social & Engagement (Follows, Likes) */

export type FollowEntityType = "artist" | "creator" | "playlist";

export interface Follow {
  follower_id: string;
  entity_type: FollowEntityType;
  entity_id: string;
  created_at: string;
}

export interface EngagementStats {
  like_count: number;
  follow_count: number;
  user_liked: boolean;
  user_favorited: boolean;
  user_following: boolean;
}

export interface CreatorEngagementStats {
  track_likes: number;
  album_favorites: number;
  artist_followers: number;
  creator_followers: number;
  playlist_followers: number;
  total_engagement: number;
}

export const SOCIAL_ERROR_MESSAGES: Record<string, string> = {
  unauthorized:       "Accès non autorisé. Connectez-vous.",
  follow_failed:      "Impossible de suivre cet artiste.",
  unfollow_failed:    "Impossible d'arrêter de suivre.",
  like_failed:        "Impossible de liker ce morceau.",
  favorite_failed:    "Impossible d'ajouter aux favoris.",
  engagement_failed:  "Impossible de charger les statistiques d'engagement.",
  unknown:            "Une erreur est survenue. Réessayez.",
};
