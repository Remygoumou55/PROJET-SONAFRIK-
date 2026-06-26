import type { StreamingPlatform } from "@sonafrik/types";
import type { StreamingDomainEventType } from "../events";
import type { StreamingRuntimeConfig } from "../integration/feature-flags";
import {
  isPlaybackBufferActive,
  isPlaybackQualityActive,
  isPlaybackRecoveryActive,
  isPlaybackSignedUrlActive,
} from "../runtime/streaming-runtime-config";
import type { StreamingRuntimeContext } from "../runtime/streaming-runtime-context";
import { RuntimeTransitionRejectedError } from "../runtime-errors";
import type { PlaybackCommand } from "./playback.commands";
import { canStartPlaybackFrom } from "./playback-state-machine";
import type { PlaybackCommandResult } from "./playback-engine.types";
import {
  applyPlaybackTrigger,
  delegateSessionActivate,
  delegateSessionClose,
  delegateSessionResume,
  delegateSessionSuspend,
  emitPlaybackEvent,
  getPlaybackInstance,
  transitionPlayback,
  type PlaybackEngineRuntime,
} from "./playback-engine.runtime";

export async function handlePreparePlayback(
  runtime: PlaybackEngineRuntime,
  ctx: StreamingRuntimeContext,
  trackId: string,
  autoPlay: boolean,
  config: StreamingRuntimeConfig,
): Promise<PlaybackCommandResult> {
  const inst = getPlaybackInstance(runtime, ctx.correlationId);
  if (!canStartPlaybackFrom(inst.state) && inst.state !== "Preparing") {
    throw new RuntimeTransitionRejectedError(`Prepare depuis ${inst.state} interdit`);
  }
  const events: StreamingDomainEventType[] = ["PlaybackRequested"];
  await emitPlaybackEvent(runtime, ctx, config, "PlaybackRequested", { trackId, autoPlay });
  inst.overlay = { ...inst.overlay, trackId, autoPlay };
  return transitionPlayback(runtime, inst, ctx, "PlayRequested", config, events);
}

export async function handleLoadTrack(
  runtime: PlaybackEngineRuntime,
  ctx: StreamingRuntimeContext,
  trackId: string,
  config: StreamingRuntimeConfig,
): Promise<PlaybackCommandResult> {
  const inst = getPlaybackInstance(runtime, ctx.correlationId);
  inst.overlay = { ...inst.overlay, trackId };
  return transitionPlayback(runtime, inst, ctx, "PreparingSucceeded", config, []);
}

export async function handleLoadSignedUrl(
  runtime: PlaybackEngineRuntime,
  ctx: StreamingRuntimeContext,
  command: Extract<PlaybackCommand, { type: "LoadSignedUrl" }>,
  config: StreamingRuntimeConfig,
): Promise<PlaybackCommandResult> {
  if (!isPlaybackSignedUrlActive(config)) {
    throw new RuntimeTransitionRejectedError("Signed URL playback désactivé");
  }

  const inst = getPlaybackInstance(runtime, ctx.correlationId);
  const platform = (command.platform ?? "web") as StreamingPlatform;
  const issued = await runtime.signedUrls.issue({
    actorId: ctx.actorId,
    trackId: command.trackId,
    platform,
    qualityLevel: command.qualityLevel,
    deviceId: command.deviceId,
  });

  if (!runtime.signedUrls.validate(issued.signedUrl, issued.expiresAt)) {
    return transitionPlayback(runtime, inst, ctx, "StartStreamFailed", config, ["PlaybackFailed"]);
  }

  inst.overlay = {
    ...inst.overlay,
    trackId: command.trackId,
    sessionId: issued.sessionId,
    signedUrl: issued.signedUrl,
    signedUrlExpiresAt: issued.expiresAt,
    qualityLevel: command.qualityLevel ?? "auto",
  };

  const events: StreamingDomainEventType[] = ["SignedUrlIssued"];
  await emitPlaybackEvent(
    runtime,
    ctx,
    config,
    "SignedUrlIssued",
    { sessionId: issued.sessionId, expiresAt: issued.expiresAt },
    issued.sessionId,
    command.trackId,
  );

  const result = await transitionPlayback(runtime, inst, ctx, "StartStreamSucceeded", config, events);
  return {
    ...result,
    sessionId: issued.sessionId,
    signedUrl: issued.signedUrl,
    signedUrlExpiresAt: issued.expiresAt,
  };
}

export async function handleStartPlayback(
  runtime: PlaybackEngineRuntime,
  ctx: StreamingRuntimeContext,
  autoPlay: boolean,
  config: StreamingRuntimeConfig,
): Promise<PlaybackCommandResult> {
  const inst = getPlaybackInstance(runtime, ctx.correlationId);
  const trigger =
    inst.state === "Buffering"
      ? autoPlay
        ? "BufferFilledPlaying"
        : "BufferFilledReady"
      : "PlaybackStarted";

  if (trigger === "PlaybackStarted" && inst.state === "Ready") {
    const events: StreamingDomainEventType[] = ["PlaybackStarted"];
    await emitPlaybackEvent(
      runtime,
      ctx,
      config,
      "PlaybackStarted",
      {},
      inst.overlay.sessionId,
      inst.overlay.trackId,
    );
    await delegateSessionActivate(runtime, ctx, config, inst.overlay.sessionId);
    return transitionPlayback(runtime, inst, ctx, "PlaybackStarted", config, events);
  }

  if (inst.state === "Buffering") {
    const events: StreamingDomainEventType[] =
      autoPlay ? ["PlaybackStarted"] : ["PlaybackBuffering", "PlaybackReady"];
    if (autoPlay) {
      await emitPlaybackEvent(
        runtime,
        ctx,
        config,
        "PlaybackStarted",
        {},
        inst.overlay.sessionId,
        inst.overlay.trackId,
      );
      await delegateSessionActivate(runtime, ctx, config, inst.overlay.sessionId);
    } else {
      await emitPlaybackEvent(
        runtime,
        ctx,
        config,
        "PlaybackBuffering",
        {},
        inst.overlay.sessionId,
        inst.overlay.trackId,
      );
      await emitPlaybackEvent(
        runtime,
        ctx,
        config,
        "PlaybackReady",
        {},
        inst.overlay.sessionId,
        inst.overlay.trackId,
      );
    }
    return transitionPlayback(runtime, inst, ctx, trigger, config, events);
  }

  throw new RuntimeTransitionRejectedError(`StartPlayback depuis ${inst.state} interdit`);
}

export async function handlePausePlayback(
  runtime: PlaybackEngineRuntime,
  ctx: StreamingRuntimeContext,
  positionSeconds: number,
  config: StreamingRuntimeConfig,
): Promise<PlaybackCommandResult> {
  const inst = getPlaybackInstance(runtime, ctx.correlationId);
  await runtime.positions.save(ctx.actorId, inst.overlay.trackId ?? ctx.trackId ?? "", positionSeconds);
  inst.overlay = { ...inst.overlay, positionSeconds };
  const events: StreamingDomainEventType[] = ["PlaybackPaused"];
  await emitPlaybackEvent(
    runtime,
    ctx,
    config,
    "PlaybackPaused",
    { positionSeconds },
    inst.overlay.sessionId,
    inst.overlay.trackId,
  );
  await delegateSessionSuspend(runtime, ctx, config, inst.overlay.sessionId);
  return transitionPlayback(runtime, inst, ctx, "PauseRequested", config, events);
}

export async function handleResumePlayback(
  runtime: PlaybackEngineRuntime,
  ctx: StreamingRuntimeContext,
  config: StreamingRuntimeConfig,
): Promise<PlaybackCommandResult> {
  const inst = getPlaybackInstance(runtime, ctx.correlationId);
  const events: StreamingDomainEventType[] = ["PlaybackResumed"];
  await emitPlaybackEvent(
    runtime,
    ctx,
    config,
    "PlaybackResumed",
    {},
    inst.overlay.sessionId,
    inst.overlay.trackId,
  );
  await delegateSessionResume(runtime, ctx, config, inst.overlay.sessionId);
  return transitionPlayback(runtime, inst, ctx, "ResumeRequested", config, events);
}

export async function handleSeekPlayback(
  runtime: PlaybackEngineRuntime,
  ctx: StreamingRuntimeContext,
  positionSeconds: number,
  config: StreamingRuntimeConfig,
): Promise<PlaybackCommandResult> {
  const inst = getPlaybackInstance(runtime, ctx.correlationId);
  inst.overlay = { ...inst.overlay, positionSeconds };
  return transitionPlayback(runtime, inst, ctx, "SeekRequested", config, []);
}

export async function handleSeekCompleted(
  runtime: PlaybackEngineRuntime,
  ctx: StreamingRuntimeContext,
  positionSeconds: number,
  config: StreamingRuntimeConfig,
): Promise<PlaybackCommandResult> {
  const inst = getPlaybackInstance(runtime, ctx.correlationId);
  inst.overlay = { ...inst.overlay, positionSeconds };
  const events: StreamingDomainEventType[] = ["PlaybackSeeked"];
  await emitPlaybackEvent(
    runtime,
    ctx,
    config,
    "PlaybackSeeked",
    { positionSeconds },
    inst.overlay.sessionId,
    inst.overlay.trackId,
  );
  return transitionPlayback(runtime, inst, ctx, "SeekCompleted", config, events);
}

export async function handleChangeQuality(
  runtime: PlaybackEngineRuntime,
  ctx: StreamingRuntimeContext,
  qualityLevel: Extract<PlaybackCommand, { type: "ChangeQuality" }>["qualityLevel"],
  positionSeconds: number,
  config: StreamingRuntimeConfig,
): Promise<PlaybackCommandResult> {
  if (!isPlaybackQualityActive(config)) {
    throw new RuntimeTransitionRejectedError("Quality management désactivé");
  }
  const inst = getPlaybackInstance(runtime, ctx.correlationId);
  const sessionId = inst.overlay.sessionId;
  const trackId = inst.overlay.trackId ?? ctx.trackId;
  if (!sessionId || !trackId) {
    throw new RuntimeTransitionRejectedError("Session ou track manquant");
  }

  const renewed = await runtime.signedUrls.renew({
    actorId: ctx.actorId,
    trackId,
    platform: "web",
    qualityLevel,
    sessionId,
  });

  inst.overlay = {
    ...inst.overlay,
    signedUrl: renewed.signedUrl,
    signedUrlExpiresAt: renewed.expiresAt,
    qualityLevel,
    positionSeconds,
    sessionId,
  };

  const events: StreamingDomainEventType[] = ["SignedUrlIssued"];
  await emitPlaybackEvent(
    runtime,
    ctx,
    config,
    "SignedUrlIssued",
    { renewed: true, qualityLevel },
    sessionId,
    trackId,
  );
  return {
    state: inst.state,
    events,
    sessionId,
    signedUrl: renewed.signedUrl,
    signedUrlExpiresAt: renewed.expiresAt,
    positionSeconds,
  };
}

export async function handleStopPlayback(
  runtime: PlaybackEngineRuntime,
  ctx: StreamingRuntimeContext,
  config: StreamingRuntimeConfig,
): Promise<PlaybackCommandResult> {
  const inst = getPlaybackInstance(runtime, ctx.correlationId);
  const events: StreamingDomainEventType[] = ["PlaybackCancelled"];
  await emitPlaybackEvent(
    runtime,
    ctx,
    config,
    "PlaybackCancelled",
    {},
    inst.overlay.sessionId,
    inst.overlay.trackId,
  );
  const result = await transitionPlayback(runtime, inst, ctx, "StopRequested", config, events);
  return transitionPlayback(runtime, inst, ctx, "ReconcileToIdle", config, [...result.events]);
}

export async function handleNextTrack(
  runtime: PlaybackEngineRuntime,
  ctx: StreamingRuntimeContext,
  trackId: string,
  config: StreamingRuntimeConfig,
): Promise<PlaybackCommandResult> {
  await handleStopPlayback(runtime, ctx, config);
  return handlePreparePlayback(runtime, ctx, trackId, true, config);
}

export async function handlePreviousTrack(
  runtime: PlaybackEngineRuntime,
  ctx: StreamingRuntimeContext,
  trackId: string,
  config: StreamingRuntimeConfig,
): Promise<PlaybackCommandResult> {
  await handleStopPlayback(runtime, ctx, config);
  return handlePreparePlayback(runtime, ctx, trackId, true, config);
}

export async function handleRecoverPlayback(
  runtime: PlaybackEngineRuntime,
  ctx: StreamingRuntimeContext,
  wasPlaying: boolean,
  config: StreamingRuntimeConfig,
): Promise<PlaybackCommandResult> {
  if (!isPlaybackRecoveryActive(config)) {
    throw new RuntimeTransitionRejectedError("Playback recovery désactivé");
  }
  return handleConnectionRecovered(runtime, ctx, wasPlaying, config);
}

export async function handleBufferFilled(
  runtime: PlaybackEngineRuntime,
  ctx: StreamingRuntimeContext,
  autoPlay: boolean,
  config: StreamingRuntimeConfig,
): Promise<PlaybackCommandResult> {
  if (!isPlaybackBufferActive(config)) {
    throw new RuntimeTransitionRejectedError("Buffer management désactivé");
  }
  return handleStartPlayback(runtime, ctx, autoPlay, config);
}

export async function handleConnectionLost(
  runtime: PlaybackEngineRuntime,
  ctx: StreamingRuntimeContext,
  config: StreamingRuntimeConfig,
): Promise<PlaybackCommandResult> {
  const inst = getPlaybackInstance(runtime, ctx.correlationId);
  inst.overlay = {
    ...inst.overlay,
    reconnectingStartedAtMs: Date.now(),
    wasPlayingBeforeReconnect: inst.state === "Playing",
  };
  const events: StreamingDomainEventType[] = ["ConnectionLost"];
  await emitPlaybackEvent(
    runtime,
    ctx,
    config,
    "ConnectionLost",
    {},
    inst.overlay.sessionId,
    inst.overlay.trackId,
  );
  return transitionPlayback(runtime, inst, ctx, "ConnectionLost", config, events);
}

export async function handleConnectionRecovered(
  runtime: PlaybackEngineRuntime,
  ctx: StreamingRuntimeContext,
  wasPlaying: boolean,
  config: StreamingRuntimeConfig,
): Promise<PlaybackCommandResult> {
  const inst = getPlaybackInstance(runtime, ctx.correlationId);
  const trigger = wasPlaying ? "ConnectionRecoveredPlaying" : "ConnectionRecoveredPaused";
  const events: StreamingDomainEventType[] = ["ConnectionRecovered"];
  await emitPlaybackEvent(
    runtime,
    ctx,
    config,
    "ConnectionRecovered",
    { wasPlaying },
    inst.overlay.sessionId,
    inst.overlay.trackId,
  );
  inst.overlay = { ...inst.overlay, reconnectingStartedAtMs: undefined };
  return transitionPlayback(runtime, inst, ctx, trigger, config, events);
}

export async function handleTrackEnded(
  runtime: PlaybackEngineRuntime,
  ctx: StreamingRuntimeContext,
  positionSeconds: number,
  totalDurationSeconds: number,
  config: StreamingRuntimeConfig,
): Promise<PlaybackCommandResult> {
  const inst = getPlaybackInstance(runtime, ctx.correlationId);
  const events: StreamingDomainEventType[] = ["PlaybackCompleted"];
  await emitPlaybackEvent(
    runtime,
    ctx,
    config,
    "PlaybackCompleted",
    { positionSeconds, totalDurationSeconds },
    inst.overlay.sessionId,
    inst.overlay.trackId,
  );
  await delegateSessionClose(
    runtime,
    ctx,
    config,
    inst.overlay.sessionId,
    positionSeconds,
    totalDurationSeconds,
  );
  return transitionPlayback(runtime, inst, ctx, "TrackEnded", config, events);
}

export { applyPlaybackTrigger };
