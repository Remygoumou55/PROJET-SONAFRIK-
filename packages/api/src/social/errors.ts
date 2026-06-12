export type SocialErrorCode =
  | "unauthorized"
  | "follow_failed"
  | "unfollow_failed"
  | "like_failed"
  | "favorite_failed"
  | "engagement_failed"
  | "unknown";

export class SocialError extends Error {
  constructor(public readonly code: SocialErrorCode) {
    super(code);
    this.name = "SocialError";
  }
}
