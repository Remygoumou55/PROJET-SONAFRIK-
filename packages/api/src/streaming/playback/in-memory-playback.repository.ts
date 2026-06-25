import type { IssuedSignedUrl, PlaybackPosition } from "@sonafrik/types";
import type { SessionRepositoryContract } from "../contracts/repository.contract";
import type {
  IssueSignedUrlParams,
  PlaybackPositionRepositoryContract,
  SignedUrlRepositoryContract,
} from "../contracts/playback.contract";
import { PLAYBACK_SIGNED_URL_TTL_MS } from "@sonafrik/types";
import { SignedUrlCache } from "./signed-url-cache";
import { resolveQualityKbps } from "./playback-state";

/** In-memory signed URL adapter for tests and dry-run */
export class InMemorySignedUrlRepository implements SignedUrlRepositoryContract {
  private readonly cache = new SignedUrlCache();

  constructor(private readonly sessionRepo?: SessionRepositoryContract) {}

  async issue(params: IssueSignedUrlParams): Promise<IssuedSignedUrl> {
    const qualityKbps = resolveQualityKbps(
      params.qualityLevel ?? "auto",
      params.qualityKbps,
    );
    const key = this.cache.cacheKey(params.trackId, params.actorId, qualityKbps);
    const cached = this.cache.get(key);
    if (cached) return cached;

    const sessionId = this.sessionRepo
      ? await this.sessionRepo.openSession({
          actorId: params.actorId,
          trackId: params.trackId,
          platform: params.platform,
          qualityKbps,
          deviceId: params.deviceId,
        })
      : crypto.randomUUID();

    const expiresAt = new Date(Date.now() + PLAYBACK_SIGNED_URL_TTL_MS).toISOString();
    const issued: IssuedSignedUrl = {
      sessionId,
      signedUrl: `https://signed.test/${params.trackId}/${sessionId}`,
      expiresAt,
      durationSeconds: 180,
      qualityKbps,
    };
    this.cache.set(key, issued);
    return issued;
  }

  async renew(
    params: IssueSignedUrlParams & { readonly sessionId: string },
  ): Promise<IssuedSignedUrl> {
    const qualityKbps = resolveQualityKbps(
      params.qualityLevel ?? "auto",
      params.qualityKbps,
    );
    const key = this.cache.cacheKey(params.trackId, params.actorId, qualityKbps);
    this.cache.invalidate(key);
    const expiresAt = new Date(Date.now() + PLAYBACK_SIGNED_URL_TTL_MS).toISOString();
    const issued: IssuedSignedUrl = {
      sessionId: params.sessionId,
      signedUrl: `https://signed.test/${params.trackId}/${params.sessionId}`,
      expiresAt,
      durationSeconds: 180,
      qualityKbps,
    };
    this.cache.set(key, issued);
    return issued;
  }

  validate(signedUrl: string, expiresAt: string, nowMs?: number): boolean {
    if (!signedUrl.trim()) return false;
    return !this.cache.isExpired(expiresAt, nowMs);
  }
}

export class InMemoryPlaybackPositionRepository implements PlaybackPositionRepositoryContract {
  private readonly positions = new Map<string, PlaybackPosition>();

  private key(actorId: string, trackId: string): string {
    return `${actorId}:${trackId}`;
  }

  async find(actorId: string, trackId: string): Promise<PlaybackPosition | null> {
    return this.positions.get(this.key(actorId, trackId)) ?? null;
  }

  async save(actorId: string, trackId: string, positionSeconds: number): Promise<void> {
    const now = new Date().toISOString();
    this.positions.set(this.key(actorId, trackId), {
      user_id: actorId,
      track_id: trackId,
      position_seconds: positionSeconds,
      updated_at: now,
    });
  }
}
