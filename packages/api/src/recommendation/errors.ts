export type RecommendationErrorCode =
  | "unauthorized"
  | "trending_failed"
  | "similar_failed"
  | "recommendations_failed"
  | "unknown";

export class RecommendationError extends Error {
  constructor(public readonly code: RecommendationErrorCode) {
    super(code);
    this.name = "RecommendationError";
  }
}
