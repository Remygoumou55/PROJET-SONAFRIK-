import type { StreamingRuntimeConfig } from "../integration/feature-flags";
import type { DomainEventPublisherPort } from "../ports";
import type { StreamingRuntimePorts } from "../ports";
import {
  ApplicationLayerDisabledError,
  RuntimeContextInvalidError,
  RuntimeDisabledError,
  RuntimeHandlerNotRegisteredError,
} from "../runtime-errors";
import {
  isApplicationLayerActive,
  isRuntimeActive,
  requiresLegacyPath,
} from "./streaming-runtime-config";
import { assertRuntimeContext, type StreamingRuntimeContext } from "./streaming-runtime-context";
import {
  createEmptyPipelineRegistry,
  type RuntimePipelineHandlerName,
  type RuntimePipelineHandlerResult,
  type RuntimePipelineRegistry,
} from "./pipeline";

export interface RuntimeDispatchResult {
  readonly mode: "legacy" | "runtime" | "dry_run";
  readonly pipeline?: RuntimePipelineHandlerResult;
  readonly legacyActive: boolean;
}

/**
 * Streaming Runtime Coordinator — shell Sprint 2.1.
 * Orchestration formelle ; moteurs métier = Sprint 2.2+.
 */
export class StreamingRuntimeCoordinator {
  constructor(
    private readonly ports: StreamingRuntimePorts,
    private readonly _events: DomainEventPublisherPort,
    private readonly pipeline: RuntimePipelineRegistry = createEmptyPipelineRegistry(),
    private readonly config: StreamingRuntimeConfig,
  ) {}

  getConfig(): StreamingRuntimeConfig {
    return this.config;
  }

  getRegisteredHandlers(): readonly RuntimePipelineHandlerName[] {
    return this.pipeline.list();
  }

  async dispatch(
    ctx: StreamingRuntimeContext,
    handlerName: RuntimePipelineHandlerName,
  ): Promise<RuntimeDispatchResult> {
    assertRuntimeContext(ctx);

    if (!isRuntimeActive(this.config)) {
      return {
        mode: "legacy",
        legacyActive: this.ports.legacyAdapter.isActive(),
      };
    }

    if (!this.config.contextEnabled) {
      throw new RuntimeContextInvalidError("runtime_context_enabled requis");
    }

    if (!isApplicationLayerActive(this.config)) {
      throw new ApplicationLayerDisabledError();
    }

    if (requiresLegacyPath(this.config)) {
      return {
        mode: "dry_run",
        legacyActive: this.ports.legacyAdapter.isActive(),
      };
    }

    if (!this.config.portsEnabled) {
      throw new RuntimeDisabledError("runtime_ports_enabled requis pour dispatch");
    }

    const pipelineResult = await this.pipeline.dispatch(handlerName, ctx, this.config);

    if (pipelineResult.status === "not_implemented") {
      throw new RuntimeHandlerNotRegisteredError(handlerName);
    }

    return {
      mode: "runtime",
      pipeline: pipelineResult,
      legacyActive: false,
    };
  }

  resolveExecutionMode(): "legacy" | "runtime" | "dry_run" {
    if (!isRuntimeActive(this.config)) {
      return "legacy";
    }
    if (requiresLegacyPath(this.config)) {
      return "dry_run";
    }
    return "runtime";
  }
}
