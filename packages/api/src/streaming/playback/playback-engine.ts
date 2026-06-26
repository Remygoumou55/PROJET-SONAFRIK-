import type { StreamingRuntimeConfig } from "../integration/feature-flags";
import { isPlaybackEngineActive } from "../runtime/streaming-runtime-config";
import type { StreamingRuntimeContext } from "../runtime/streaming-runtime-context";
import { RuntimeTransitionRejectedError } from "../runtime-errors";
import type { PlaybackCommand } from "./playback.commands";
import type { PlaybackEnginePort } from "../ports";
import type {
  PlaybackPositionRepositoryContract,
  SignedUrlRepositoryContract,
} from "../contracts/playback.contract";
import type { DomainEventBusContract } from "../contracts";
import type { SessionEnginePort } from "../ports";
import type { PlaybackCommandResult, PlaybackInstance } from "./playback-engine.types";
import type { PlaybackEngineRuntime } from "./playback-engine.runtime";
import {
  applyPlaybackTrigger,
  handleBufferFilled,
  handleChangeQuality,
  handleConnectionLost,
  handleConnectionRecovered,
  handleLoadSignedUrl,
  handleLoadTrack,
  handleNextTrack,
  handlePausePlayback,
  handlePreparePlayback,
  handlePreviousTrack,
  handleRecoverPlayback,
  handleResumePlayback,
  handleSeekCompleted,
  handleSeekPlayback,
  handleStartPlayback,
  handleStopPlayback,
  handleTrackEnded,
} from "./playback-engine.handlers";

export type { PlaybackCommandResult } from "./playback-engine.types";

export class PlaybackEngine implements PlaybackEnginePort {
  readonly engineId = "playback-engine" as const;

  private readonly runtime: PlaybackEngineRuntime;

  constructor(
    signedUrls: SignedUrlRepositoryContract,
    positions: PlaybackPositionRepositoryContract,
    eventBus: DomainEventBusContract,
    sessionEngine: SessionEnginePort,
  ) {
    this.runtime = {
      signedUrls,
      positions,
      eventBus,
      sessionEngine,
      instances: new Map<string, PlaybackInstance>(),
    };
  }

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

    const rt = this.runtime;

    switch (command.type) {
      case "PreparePlayback":
        return handlePreparePlayback(rt, ctx, command.trackId, command.autoPlay ?? false, config);
      case "LoadTrack":
        return handleLoadTrack(rt, ctx, command.trackId, config);
      case "LoadSignedUrl":
        return handleLoadSignedUrl(rt, ctx, command, config);
      case "StartPlayback":
        return handleStartPlayback(rt, ctx, command.autoPlay ?? false, config);
      case "PausePlayback":
        return handlePausePlayback(rt, ctx, command.positionSeconds, config);
      case "ResumePlayback":
        return handleResumePlayback(rt, ctx, config);
      case "SeekPlayback":
        return handleSeekPlayback(rt, ctx, command.positionSeconds, config);
      case "ChangeQuality":
        return handleChangeQuality(rt, ctx, command.qualityLevel, command.positionSeconds, config);
      case "NextTrack":
        return handleNextTrack(rt, ctx, command.trackId, config);
      case "PreviousTrack":
        return handlePreviousTrack(rt, ctx, command.trackId, config);
      case "StopPlayback":
        return handleStopPlayback(rt, ctx, config);
      case "RecoverPlayback":
        return handleRecoverPlayback(rt, ctx, command.wasPlaying, config);
      case "BufferFilled":
        return handleBufferFilled(rt, ctx, command.autoPlay ?? false, config);
      case "BufferEmpty":
        return applyPlaybackTrigger(rt, ctx, "BufferEmpty", config, ["PlaybackBuffering"]);
      case "BufferTimeout":
        return applyPlaybackTrigger(rt, ctx, "BufferTimeout", config, ["PlaybackFailed"]);
      case "ConnectionLost":
        return handleConnectionLost(rt, ctx, config);
      case "ConnectionRecovered":
        return handleConnectionRecovered(rt, ctx, command.wasPlaying, config);
      case "ReconnectTimeout":
        return applyPlaybackTrigger(rt, ctx, "ReconnectTimeout", config, ["PlaybackFailed"]);
      case "TrackEnded":
        return handleTrackEnded(rt, ctx, command.positionSeconds, command.totalDurationSeconds, config);
      case "AudioError":
        return applyPlaybackTrigger(rt, ctx, "AudioError", config, ["PlaybackFailed"], {
          reason: command.reason,
        });
      case "SeekCompleted":
        return handleSeekCompleted(rt, ctx, command.positionSeconds, config);
      case "SeekFailed":
        return applyPlaybackTrigger(rt, ctx, "SeekFailed", config, ["PlaybackFailed"], {
          reason: command.reason,
        });
      case "ReconcileToIdle":
        return applyPlaybackTrigger(rt, ctx, "ReconcileToIdle", config, []);
      default: {
        const _exhaustive: never = command;
        return _exhaustive;
      }
    }
  }

  getState(correlationId: string) {
    return this.runtime.instances.get(correlationId)?.state ?? "Idle";
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
