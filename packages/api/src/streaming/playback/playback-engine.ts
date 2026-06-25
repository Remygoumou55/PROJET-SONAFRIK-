import type { PlaybackStateId, StreamingPlatform } from "@sonafrik/types";
import type { StreamingDomainEventType } from "../events";
import type {
  PlaybackPositionRepositoryContract,
  SignedUrlRepositoryContract,
} from "../contracts/playback.contract";
import type { DomainEventBusContract } from "../contracts";
import type { StreamingRuntimeConfig } from "../integration/feature-flags";
import {
  canPublishEvents,
  isPlaybackBufferActive,
  isPlaybackEngineActive,
  isPlaybackQualityActive,
  isPlaybackRecoveryActive,
  isPlaybackSignedUrlActive,
  isSessionEngineActive,
} from "../runtime/streaming-runtime-config";
import type { StreamingRuntimeContext } from "../runtime/streaming-runtime-context";
import type { SessionEnginePort } from "../ports";
import { RuntimeTransitionRejectedError } from "../runtime-errors";
import type { PlaybackCommand } from "./playback.commands";
import { publishPlaybackDomainEvent } from "./playback-event-publisher";
import {
  derivePlaybackState,
  type PlaybackRuntimeOverlay,
} from "./playback-state";
import { canStartPlaybackFrom, transitionPlaybackState } from "./playback-state-machine";
import type { PlaybackEnginePort } from "../ports";

export interface PlaybackCommandResult {
  readonly state: PlaybackStateId;
  readonly events: readonly StreamingDomainEventType[];
  readonly sessionId?: string;
  readonly signedUrl?: string;
  readonly signedUrlExpiresAt?: string;
  readonly positionSeconds?: number;
}

interface PlaybackInstance {
  state: PlaybackStateId;
  overlay: PlaybackRuntimeOverlay;
}

export class PlaybackEngine implements PlaybackEnginePort {
  readonly engineId = "playback-engine" as const;

  private readonly instances = new Map<string, PlaybackInstance>();

  constructor(
    private readonly signedUrls: SignedUrlRepositoryContract,
    private readonly positions: PlaybackPositionRepositoryContract,
    private readonly eventBus: DomainEventBusContract,
    private readonly sessionEngine: SessionEnginePort,
  ) {}

  isReady(config: StreamingRuntimeConfig): boolean {
    return isPlaybackEngineActive(config);
  }

  async execute(
    ctx: StreamingRuntimeContext,
    command: PlaybackCommand,
    config: StreamingRuntimeConfig,
  ): Promise<PlaybackCommandResult> {
    if (!this.isReady(config)) {
      throw new RuntimeTransitionRejectedError("Playback Engine désactivé");
    }

    switch (command.type) {
      case "PreparePlayback":
        return this.prepare(ctx, command.trackId, command.autoPlay ?? false, config);
      case "LoadTrack":
        return this.loadTrack(ctx, command.trackId, config);
      case "LoadSignedUrl":
        return this.loadSignedUrl(ctx, command, config);
      case "StartPlayback":
        return this.startPlayback(ctx, command.autoPlay ?? false, config);
      case "PausePlayback":
        return this.pause(ctx, command.positionSeconds, config);
      case "ResumePlayback":
        return this.resume(ctx, config);
      case "SeekPlayback":
        return this.seek(ctx, command.positionSeconds, config);
      case "ChangeQuality":
        return this.changeQuality(ctx, command.qualityLevel, command.positionSeconds, config);
      case "NextTrack":
        return this.nextTrack(ctx, command.trackId, config);
      case "PreviousTrack":
        return this.previousTrack(ctx, command.trackId, config);
      case "StopPlayback":
        return this.stop(ctx, config);
      case "RecoverPlayback":
        return this.recover(ctx, command.wasPlaying, config);
      case "BufferFilled":
        return this.bufferFilled(ctx, command.autoPlay ?? false, config);
      case "BufferEmpty":
        return this.applyTrigger(ctx, "BufferEmpty", config, ["PlaybackBuffering"]);
      case "BufferTimeout":
        return this.applyTrigger(ctx, "BufferTimeout", config, ["PlaybackFailed"]);
      case "ConnectionLost":
        return this.connectionLost(ctx, config);
      case "ConnectionRecovered":
        return this.connectionRecovered(ctx, command.wasPlaying, config);
      case "ReconnectTimeout":
        return this.applyTrigger(ctx, "ReconnectTimeout", config, ["PlaybackFailed"]);
      case "TrackEnded":
        return this.trackEnded(ctx, command.positionSeconds, command.totalDurationSeconds, config);
      case "AudioError":
        return this.applyTrigger(ctx, "AudioError", config, ["PlaybackFailed"], {
          reason: command.reason,
        });
      case "SeekCompleted":
        return this.seekCompleted(ctx, command.positionSeconds, config);
      case "SeekFailed":
        return this.applyTrigger(ctx, "SeekFailed", config, ["PlaybackFailed"], {
          reason: command.reason,
        });
      case "ReconcileToIdle":
        return this.applyTrigger(ctx, "ReconcileToIdle", config, []);
      default: {
        const _exhaustive: never = command;
        return _exhaustive;
      }
    }
  }

  getState(correlationId: string): PlaybackStateId {
    return this.instances.get(correlationId)?.state ?? "Idle";
  }

  private instance(ctx: StreamingRuntimeContext): PlaybackInstance {
    let inst = this.instances.get(ctx.correlationId);
    if (!inst) {
      inst = { state: "Idle", overlay: {} };
      this.instances.set(ctx.correlationId, inst);
    }
    return inst;
  }

  private async prepare(
    ctx: StreamingRuntimeContext,
    trackId: string,
    autoPlay: boolean,
    config: StreamingRuntimeConfig,
  ): Promise<PlaybackCommandResult> {
    const inst = this.instance(ctx);
    if (!canStartPlaybackFrom(inst.state) && inst.state !== "Preparing") {
      throw new RuntimeTransitionRejectedError(`Prepare depuis ${inst.state} interdit`);
    }
    const events: StreamingDomainEventType[] = ["PlaybackRequested"];
    await this.emit(ctx, config, "PlaybackRequested", { trackId, autoPlay }, events);
    inst.overlay = { ...inst.overlay, trackId, autoPlay };
    return this.transition(inst, ctx, "PlayRequested", config, events);
  }

  private async loadTrack(
    ctx: StreamingRuntimeContext,
    trackId: string,
    config: StreamingRuntimeConfig,
  ): Promise<PlaybackCommandResult> {
    const inst = this.instance(ctx);
    inst.overlay = { ...inst.overlay, trackId };
    return this.transition(inst, ctx, "PreparingSucceeded", config, []);
  }

  private async loadSignedUrl(
    ctx: StreamingRuntimeContext,
    command: Extract<PlaybackCommand, { type: "LoadSignedUrl" }>,
    config: StreamingRuntimeConfig,
  ): Promise<PlaybackCommandResult> {
    if (!isPlaybackSignedUrlActive(config)) {
      throw new RuntimeTransitionRejectedError("Signed URL playback désactivé");
    }

    const inst = this.instance(ctx);
    const platform = (command.platform ?? "web") as StreamingPlatform;
    const issued = await this.signedUrls.issue({
      actorId: ctx.actorId,
      trackId: command.trackId,
      platform,
      qualityLevel: command.qualityLevel,
      deviceId: command.deviceId,
    });

    if (!this.signedUrls.validate(issued.signedUrl, issued.expiresAt)) {
      return this.transition(inst, ctx, "StartStreamFailed", config, ["PlaybackFailed"]);
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
    await this.emit(
      ctx,
      config,
      "SignedUrlIssued",
      { sessionId: issued.sessionId, expiresAt: issued.expiresAt },
      events,
      issued.sessionId,
      command.trackId,
    );

    const result = await this.transition(inst, ctx, "StartStreamSucceeded", config, events);
    return {
      ...result,
      sessionId: issued.sessionId,
      signedUrl: issued.signedUrl,
      signedUrlExpiresAt: issued.expiresAt,
    };
  }

  private async startPlayback(
    ctx: StreamingRuntimeContext,
    autoPlay: boolean,
    config: StreamingRuntimeConfig,
  ): Promise<PlaybackCommandResult> {
    const inst = this.instance(ctx);
    const trigger =
      inst.state === "Buffering"
        ? autoPlay
          ? "BufferFilledPlaying"
          : "BufferFilledReady"
        : "PlaybackStarted";

    if (trigger === "PlaybackStarted" && inst.state === "Ready") {
      const events: StreamingDomainEventType[] = ["PlaybackStarted"];
      await this.emit(ctx, config, "PlaybackStarted", {}, events, inst.overlay.sessionId, inst.overlay.trackId);
      await this.delegateSessionActivate(ctx, config, inst.overlay.sessionId);
      return this.transition(inst, ctx, "PlaybackStarted", config, events);
    }

    if (inst.state === "Buffering") {
      const events: StreamingDomainEventType[] =
        autoPlay ? ["PlaybackStarted"] : ["PlaybackBuffering", "PlaybackReady"];
      if (autoPlay) {
        await this.emit(ctx, config, "PlaybackStarted", {}, events, inst.overlay.sessionId, inst.overlay.trackId);
        await this.delegateSessionActivate(ctx, config, inst.overlay.sessionId);
      } else {
        await this.emit(ctx, config, "PlaybackBuffering", {}, events, inst.overlay.sessionId, inst.overlay.trackId);
        await this.emit(ctx, config, "PlaybackReady", {}, events, inst.overlay.sessionId, inst.overlay.trackId);
      }
      return this.transition(inst, ctx, trigger, config, events);
    }

    throw new RuntimeTransitionRejectedError(`StartPlayback depuis ${inst.state} interdit`);
  }

  private async pause(
    ctx: StreamingRuntimeContext,
    positionSeconds: number,
    config: StreamingRuntimeConfig,
  ): Promise<PlaybackCommandResult> {
    const inst = this.instance(ctx);
    await this.positions.save(ctx.actorId, inst.overlay.trackId ?? ctx.trackId ?? "", positionSeconds);
    inst.overlay = { ...inst.overlay, positionSeconds };
    const events: StreamingDomainEventType[] = ["PlaybackPaused"];
    await this.emit(ctx, config, "PlaybackPaused", { positionSeconds }, events, inst.overlay.sessionId, inst.overlay.trackId);
    await this.delegateSessionSuspend(ctx, config, inst.overlay.sessionId);
    return this.transition(inst, ctx, "PauseRequested", config, events);
  }

  private async resume(ctx: StreamingRuntimeContext, config: StreamingRuntimeConfig): Promise<PlaybackCommandResult> {
    const inst = this.instance(ctx);
    const events: StreamingDomainEventType[] = ["PlaybackResumed"];
    await this.emit(ctx, config, "PlaybackResumed", {}, events, inst.overlay.sessionId, inst.overlay.trackId);
    await this.delegateSessionResume(ctx, config, inst.overlay.sessionId);
    return this.transition(inst, ctx, "ResumeRequested", config, events);
  }

  private async seek(
    ctx: StreamingRuntimeContext,
    positionSeconds: number,
    config: StreamingRuntimeConfig,
  ): Promise<PlaybackCommandResult> {
    const inst = this.instance(ctx);
    inst.overlay = { ...inst.overlay, positionSeconds };
    return this.transition(inst, ctx, "SeekRequested", config, []);
  }

  private async seekCompleted(
    ctx: StreamingRuntimeContext,
    positionSeconds: number,
    config: StreamingRuntimeConfig,
  ): Promise<PlaybackCommandResult> {
    const inst = this.instance(ctx);
    inst.overlay = { ...inst.overlay, positionSeconds };
    const events: StreamingDomainEventType[] = ["PlaybackSeeked"];
    await this.emit(ctx, config, "PlaybackSeeked", { positionSeconds }, events, inst.overlay.sessionId, inst.overlay.trackId);
    return this.transition(inst, ctx, "SeekCompleted", config, events);
  }

  private async changeQuality(
    ctx: StreamingRuntimeContext,
    qualityLevel: Extract<PlaybackCommand, { type: "ChangeQuality" }>["qualityLevel"],
    positionSeconds: number,
    config: StreamingRuntimeConfig,
  ): Promise<PlaybackCommandResult> {
    if (!isPlaybackQualityActive(config)) {
      throw new RuntimeTransitionRejectedError("Quality management désactivé");
    }
    const inst = this.instance(ctx);
    const sessionId = inst.overlay.sessionId;
    const trackId = inst.overlay.trackId ?? ctx.trackId;
    if (!sessionId || !trackId) {
      throw new RuntimeTransitionRejectedError("Session ou track manquant");
    }

    const renewed = await this.signedUrls.renew({
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
    await this.emit(ctx, config, "SignedUrlIssued", { renewed: true, qualityLevel }, events, sessionId, trackId);
    return {
      state: inst.state,
      events,
      sessionId,
      signedUrl: renewed.signedUrl,
      signedUrlExpiresAt: renewed.expiresAt,
      positionSeconds,
    };
  }

  private async nextTrack(
    ctx: StreamingRuntimeContext,
    trackId: string,
    config: StreamingRuntimeConfig,
  ): Promise<PlaybackCommandResult> {
    await this.stop(ctx, config);
    return this.prepare(ctx, trackId, true, config);
  }

  private async previousTrack(
    ctx: StreamingRuntimeContext,
    trackId: string,
    config: StreamingRuntimeConfig,
  ): Promise<PlaybackCommandResult> {
    await this.stop(ctx, config);
    return this.prepare(ctx, trackId, true, config);
  }

  private async stop(ctx: StreamingRuntimeContext, config: StreamingRuntimeConfig): Promise<PlaybackCommandResult> {
    const inst = this.instance(ctx);
    const events: StreamingDomainEventType[] = ["PlaybackCancelled"];
    await this.emit(ctx, config, "PlaybackCancelled", {}, events, inst.overlay.sessionId, inst.overlay.trackId);
    const result = await this.transition(inst, ctx, "StopRequested", config, events);
    return this.transition(inst, ctx, "ReconcileToIdle", config, [...result.events]);
  }

  private async recover(
    ctx: StreamingRuntimeContext,
    wasPlaying: boolean,
    config: StreamingRuntimeConfig,
  ): Promise<PlaybackCommandResult> {
    if (!isPlaybackRecoveryActive(config)) {
      throw new RuntimeTransitionRejectedError("Playback recovery désactivé");
    }
    return this.connectionRecovered(ctx, wasPlaying, config);
  }

  private async bufferFilled(
    ctx: StreamingRuntimeContext,
    autoPlay: boolean,
    config: StreamingRuntimeConfig,
  ): Promise<PlaybackCommandResult> {
    if (!isPlaybackBufferActive(config)) {
      throw new RuntimeTransitionRejectedError("Buffer management désactivé");
    }
    return this.startPlayback(ctx, autoPlay, config);
  }

  private async connectionLost(
    ctx: StreamingRuntimeContext,
    config: StreamingRuntimeConfig,
  ): Promise<PlaybackCommandResult> {
    const inst = this.instance(ctx);
    inst.overlay = {
      ...inst.overlay,
      reconnectingStartedAtMs: Date.now(),
      wasPlayingBeforeReconnect: inst.state === "Playing",
    };
    const events: StreamingDomainEventType[] = ["ConnectionLost"];
    await this.emit(ctx, config, "ConnectionLost", {}, events, inst.overlay.sessionId, inst.overlay.trackId);
    return this.transition(inst, ctx, "ConnectionLost", config, events);
  }

  private async connectionRecovered(
    ctx: StreamingRuntimeContext,
    wasPlaying: boolean,
    config: StreamingRuntimeConfig,
  ): Promise<PlaybackCommandResult> {
    const inst = this.instance(ctx);
    const trigger = wasPlaying ? "ConnectionRecoveredPlaying" : "ConnectionRecoveredPaused";
    const events: StreamingDomainEventType[] = ["ConnectionRecovered"];
    await this.emit(ctx, config, "ConnectionRecovered", { wasPlaying }, events, inst.overlay.sessionId, inst.overlay.trackId);
    inst.overlay = { ...inst.overlay, reconnectingStartedAtMs: undefined };
    return this.transition(inst, ctx, trigger, config, events);
  }

  private async trackEnded(
    ctx: StreamingRuntimeContext,
    positionSeconds: number,
    totalDurationSeconds: number,
    config: StreamingRuntimeConfig,
  ): Promise<PlaybackCommandResult> {
    const inst = this.instance(ctx);
    const events: StreamingDomainEventType[] = ["PlaybackCompleted"];
    await this.emit(
      ctx,
      config,
      "PlaybackCompleted",
      { positionSeconds, totalDurationSeconds },
      events,
      inst.overlay.sessionId,
      inst.overlay.trackId,
    );
    await this.delegateSessionClose(ctx, config, inst.overlay.sessionId, positionSeconds, totalDurationSeconds);
    return this.transition(inst, ctx, "TrackEnded", config, events);
  }

  private async applyTrigger(
    ctx: StreamingRuntimeContext,
    trigger: Parameters<typeof transitionPlaybackState>[1],
    config: StreamingRuntimeConfig,
    events: StreamingDomainEventType[],
    payload: Record<string, unknown> = {},
  ): Promise<PlaybackCommandResult> {
    const inst = this.instance(ctx);
    if (events.length > 0 && events[0]) {
      await this.emit(ctx, config, events[0], payload, events, inst.overlay.sessionId, inst.overlay.trackId);
    }
    return this.transition(inst, ctx, trigger, config, events);
  }

  private async transition(
    inst: PlaybackInstance,
    ctx: StreamingRuntimeContext,
    trigger: Parameters<typeof transitionPlaybackState>[1],
    config: StreamingRuntimeConfig,
    events: StreamingDomainEventType[],
  ): Promise<PlaybackCommandResult> {
    const current = derivePlaybackState(inst.state, inst.overlay);
    const result = transitionPlaybackState(current, trigger);
    if (!result.allowed || !result.nextState) {
      throw new RuntimeTransitionRejectedError(`Transition ${trigger} refusée depuis ${current}`);
    }
    inst.state = result.nextState;
    if (result.nextState === "Buffering") {
      inst.overlay = { ...inst.overlay, bufferingStartedAtMs: Date.now() };
    }
    return {
      state: inst.state,
      events,
      sessionId: inst.overlay.sessionId,
      signedUrl: inst.overlay.signedUrl,
      signedUrlExpiresAt: inst.overlay.signedUrlExpiresAt,
      positionSeconds: inst.overlay.positionSeconds,
    };
  }

  private async delegateSessionActivate(
    ctx: StreamingRuntimeContext,
    config: StreamingRuntimeConfig,
    sessionId?: string,
  ): Promise<void> {
    if (!isSessionEngineActive(config) || !sessionId) return;
    await this.sessionEngine.execute(
      ctx,
      { type: "ActivateSession", sessionId },
      config,
    );
  }

  private async delegateSessionSuspend(
    ctx: StreamingRuntimeContext,
    config: StreamingRuntimeConfig,
    sessionId?: string,
  ): Promise<void> {
    if (!isSessionEngineActive(config) || !sessionId) return;
    await this.sessionEngine.execute(ctx, { type: "SuspendSession", sessionId }, config);
  }

  private async delegateSessionResume(
    ctx: StreamingRuntimeContext,
    config: StreamingRuntimeConfig,
    sessionId?: string,
  ): Promise<void> {
    if (!isSessionEngineActive(config) || !sessionId) return;
    await this.sessionEngine.execute(ctx, { type: "ResumeSession", sessionId }, config);
  }

  private async delegateSessionClose(
    ctx: StreamingRuntimeContext,
    config: StreamingRuntimeConfig,
    sessionId: string | undefined,
    positionSeconds: number,
    totalDurationSeconds: number,
  ): Promise<void> {
    if (!isSessionEngineActive(config) || !sessionId) return;
    await this.sessionEngine.execute(
      ctx,
      { type: "CloseSession", sessionId, positionSeconds, totalDurationSeconds },
      config,
    );
  }

  private async emit(
    ctx: StreamingRuntimeContext,
    config: StreamingRuntimeConfig,
    eventType: StreamingDomainEventType,
    payload: Record<string, unknown>,
    events: StreamingDomainEventType[],
    sessionId?: string,
    trackId?: string,
  ): Promise<void> {
    if (!canPublishEvents(config)) return;
    await publishPlaybackDomainEvent(this.eventBus, ctx, eventType, payload, sessionId, trackId);
  }
}

export function createPlaybackEngine(
  signedUrls: SignedUrlRepositoryContract,
  positions: PlaybackPositionRepositoryContract,
  eventBus: DomainEventBusContract,
  sessionEngine: SessionEnginePort,
): PlaybackEngine {
  return new PlaybackEngine(signedUrls, positions, eventBus, sessionEngine);
}
