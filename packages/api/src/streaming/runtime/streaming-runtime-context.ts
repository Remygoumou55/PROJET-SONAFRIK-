/** Zero Trust runtime context — STATE_MACHINE.md ownership */
import { RuntimeContextInvalidError } from "../runtime-errors";

export interface StreamingRuntimeContextPayload {
  readonly sessionId?: string;
  readonly positionSeconds?: number;
  readonly totalDurationSeconds?: number;
  readonly reason?: string;
  readonly platform?: string;
  readonly qualityKbps?: number | null;
  readonly deviceId?: string | null;
  /** Opaque PlaybackCommand envelope — DispatchPlaybackCommand */
  readonly playbackCommand?: { readonly type: string } & Record<string, unknown>;
}

export interface StreamingRuntimeContext {
  readonly actorId: string;
  readonly correlationId: string;
  readonly sessionId?: string;
  readonly trackId?: string;
  readonly initiatedAt: string;
  readonly idempotencyKey?: string;
  readonly payload?: StreamingRuntimeContextPayload;
}

export function createRuntimeContext(
  input: Pick<StreamingRuntimeContext, "actorId" | "correlationId"> &
    Partial<
      Pick<
        StreamingRuntimeContext,
        "sessionId" | "trackId" | "idempotencyKey" | "initiatedAt" | "payload"
      >
    >,
): StreamingRuntimeContext {
  return {
    actorId: input.actorId,
    correlationId: input.correlationId,
    sessionId: input.sessionId,
    trackId: input.trackId,
    idempotencyKey: input.idempotencyKey,
    initiatedAt: input.initiatedAt ?? new Date().toISOString(),
    payload: input.payload,
  };
}

export function assertRuntimeContext(ctx: StreamingRuntimeContext): void {
  if (!ctx.actorId?.trim()) {
    throw new RuntimeContextInvalidError("actorId requis");
  }
  if (!ctx.correlationId?.trim()) {
    throw new RuntimeContextInvalidError("correlationId requis");
  }
}
