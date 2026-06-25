import type {
  IssuedSignedUrl,
  PlaybackPosition,
  PlaybackQualityLevel,
  StreamingPlatform,
} from "@sonafrik/types";

export interface IssueSignedUrlParams {
  readonly actorId: string;
  readonly trackId: string;
  readonly platform: StreamingPlatform;
  readonly qualityLevel?: PlaybackQualityLevel;
  readonly qualityKbps?: number | null;
  readonly deviceId?: string | null;
}

/** Contract — signed URL issuance (stream-start semantics, no direct UI access) */
export interface SignedUrlRepositoryContract {
  issue(params: IssueSignedUrlParams): Promise<IssuedSignedUrl>;
  renew(
    params: IssueSignedUrlParams & { readonly sessionId: string },
  ): Promise<IssuedSignedUrl>;
  validate(signedUrl: string, expiresAt: string, nowMs?: number): boolean;
}

export interface PlaybackPositionRepositoryContract {
  find(actorId: string, trackId: string): Promise<PlaybackPosition | null>;
  save(actorId: string, trackId: string, positionSeconds: number): Promise<void>;
}
