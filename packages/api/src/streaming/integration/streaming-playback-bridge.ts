import type { SonafrikSupabaseClient } from "@sonafrik/database";
import type { StreamStartResult } from "@sonafrik/types";
import type { RuntimeStatusDto } from "../application/dto";
import { createApplicationContext } from "../application/ports";
import { createStreamingApplicationService } from "../application/services/streaming-application.service";
import type { StreamingApplicationService } from "../application/services/streaming-application.service";
import type { StreamingRuntimeCoordinator } from "../runtime";
import { createStreamingRuntimeCoordinator, createSupabaseRuntimePorts } from "../runtime";
import type { StreamingRuntimeConfig } from "./feature-flags";
import {
  DEFAULT_STREAMING_RUNTIME_FLAGS,
  StreamingRuntimeFeatureFlagResolver,
  buildRuntimeConfig,
} from "./feature-flags";
import {
  StreamingService,
  createStreamingService,
} from "../streaming.service";
import type {
  CompleteStreamInput,
  SavePositionInput,
  StartStreamInput,
  StreamHeartbeatInput,
} from "../schemas";

export type StreamingPlaybackMode = "legacy" | "runtime" | "dry_run";

export interface StreamingBridgeObserveEvent {
  readonly type: "initialized" | "start_stream" | "runtime_status";
  readonly mode: StreamingPlaybackMode;
  readonly correlationId?: string;
  readonly playbackId?: string;
  readonly trackId?: string;
  readonly sessionId?: string;
  readonly runtimeStatus?: RuntimeStatusDto;
}

export interface StreamingPlaybackBridgeOptions {
  readonly onObserve?: (event: StreamingBridgeObserveEvent) => void;
}

export interface StreamingRuntimeFoundationBundle {
  readonly config: StreamingRuntimeConfig;
  readonly coordinator: StreamingRuntimeCoordinator;
  readonly application: StreamingApplicationService;
}

export interface StreamingPlaybackBridgeDeps {
  readonly legacy?: StreamingService;
  readonly loadFoundation?: (
    client: SonafrikSupabaseClient,
  ) => Promise<StreamingRuntimeFoundationBundle>;
}

function createCorrelationId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `corr-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Couche d'intégration MVP — délègue la lecture au Legacy, observe le Runtime Enterprise.
 * Sprint 2 Integration étape 1 : coordinator / status uniquement (pas de dispatch playback).
 */
export class StreamingPlaybackBridge {
  private readonly legacy: StreamingService;
  private readonly loadFoundation: (
    client: SonafrikSupabaseClient,
  ) => Promise<StreamingRuntimeFoundationBundle>;
  private foundation: StreamingRuntimeFoundationBundle | null = null;
  private initPromise: Promise<void> | null = null;
  private actorId = "anonymous";

  constructor(
    private readonly client: SonafrikSupabaseClient,
    private readonly options: StreamingPlaybackBridgeOptions = {},
    deps: StreamingPlaybackBridgeDeps = {},
  ) {
    this.legacy = deps.legacy ?? createStreamingService(client);
    this.loadFoundation =
      deps.loadFoundation ??
      (async (c) => {
        const resolver = new StreamingRuntimeFeatureFlagResolver(c);
        const flags = await resolver.resolve().catch(() => DEFAULT_STREAMING_RUNTIME_FLAGS);
        const config = buildRuntimeConfig(flags);
        const ports = createSupabaseRuntimePorts(c);
        const coordinator = createStreamingRuntimeCoordinator({ config, ports });
        const application = createStreamingApplicationService({
          coordinator,
          config,
          sessionRepository: ports.sessionRepository,
        });
        return { config, coordinator, application };
      });
  }

  async initialize(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = this.doInitialize();
    }
    await this.initPromise;
  }

  private async doInitialize(): Promise<void> {
    const {
      data: { user },
    } = await this.client.auth.getUser();
    if (user?.id) this.actorId = user.id;

    this.foundation = await this.loadFoundation(this.client);
    const status = await this.queryRuntimeStatus();
    this.emit({
      type: "initialized",
      mode: this.getPlaybackMode(),
      runtimeStatus: status,
    });
  }

  getPlaybackMode(): StreamingPlaybackMode {
    return this.foundation?.coordinator.resolveExecutionMode() ?? "legacy";
  }

  async refreshRuntimeStatus(): Promise<RuntimeStatusDto> {
    await this.initialize();
    return this.queryRuntimeStatus();
  }

  private async queryRuntimeStatus(): Promise<RuntimeStatusDto> {
    if (!this.foundation) {
      return {
        mode: "legacy",
        runtimeEnabled: false,
        applicationLayerEnabled: false,
        registeredHandlers: [],
      };
    }

    const ctx = createApplicationContext({
      actorId: this.actorId,
      correlationId: createCorrelationId(),
    });

    const status = await this.foundation.application.executeQuery(ctx, {
      type: "GetRuntimeStatus",
    });

    if ("mode" in status) {
      return status;
    }

    return {
      mode: "legacy",
      runtimeEnabled: false,
      applicationLayerEnabled: false,
      registeredHandlers: [],
    };
  }

  async startStream(input: StartStreamInput): Promise<StreamStartResult> {
    await this.initialize();

    const correlationId = createCorrelationId();
    const playbackId = createCorrelationId();
    const mode = this.getPlaybackMode();
    const runtimeStatus = await this.queryRuntimeStatus();

    this.emit({
      type: "runtime_status",
      mode,
      correlationId,
      playbackId,
      trackId: input.trackId,
      runtimeStatus,
    });

    const result = await this.legacy.startStream(input);

    this.emit({
      type: "start_stream",
      mode,
      correlationId,
      playbackId,
      trackId: input.trackId,
      sessionId: result.sessionId,
      runtimeStatus,
    });

    return result;
  }

  async sendHeartbeat(input: StreamHeartbeatInput): Promise<void> {
    return this.legacy.sendHeartbeat(input);
  }

  async completeStream(input: CompleteStreamInput): Promise<boolean> {
    return this.legacy.completeStream(input);
  }

  async savePosition(input: SavePositionInput): Promise<void> {
    return this.legacy.savePosition(input);
  }

  private emit(event: StreamingBridgeObserveEvent): void {
    this.options.onObserve?.(event);
  }
}

export function createStreamingPlaybackBridge(
  client: SonafrikSupabaseClient,
  options?: StreamingPlaybackBridgeOptions,
  deps?: StreamingPlaybackBridgeDeps,
): StreamingPlaybackBridge {
  return new StreamingPlaybackBridge(client, options, deps);
}

/** État par défaut si la résolution des flags échoue côté client */
export function defaultBridgeRuntimeStatus(): RuntimeStatusDto {
  return {
    mode: "legacy",
    runtimeEnabled: DEFAULT_STREAMING_RUNTIME_FLAGS.runtimeEnabled,
    applicationLayerEnabled: DEFAULT_STREAMING_RUNTIME_FLAGS.applicationLayerEnabled,
    registeredHandlers: [],
  };
}
