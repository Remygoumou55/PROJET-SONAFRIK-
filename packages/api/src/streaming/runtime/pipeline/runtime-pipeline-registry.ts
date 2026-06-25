import type { StreamingRuntimeConfig } from "../../integration/feature-flags";
import type { StreamingRuntimeContext } from "../streaming-runtime-context";

export type RuntimePipelineHandlerName =
  | "OpenSession"
  | "RecordHeartbeat"
  | "CompleteSession"
  | "InvalidateSession"
  | "DispatchPlaybackCommand";

export interface RuntimePipelineHandlerResult {
  readonly handler: RuntimePipelineHandlerName;
  readonly status: "registered" | "skipped" | "not_implemented";
  readonly message: string;
}

export interface RuntimePipelineHandler {
  readonly name: RuntimePipelineHandlerName;
  canHandle(config: StreamingRuntimeConfig): boolean;
  handle(
    ctx: StreamingRuntimeContext,
    config: StreamingRuntimeConfig,
  ): Promise<RuntimePipelineHandlerResult>;
}

export class RuntimePipelineRegistry {
  private readonly handlers = new Map<RuntimePipelineHandlerName, RuntimePipelineHandler>();

  register(handler: RuntimePipelineHandler): void {
    this.handlers.set(handler.name, handler);
  }

  get(name: RuntimePipelineHandlerName): RuntimePipelineHandler | undefined {
    return this.handlers.get(name);
  }

  list(): readonly RuntimePipelineHandlerName[] {
    return [...this.handlers.keys()];
  }

  async dispatch(
    name: RuntimePipelineHandlerName,
    ctx: StreamingRuntimeContext,
    config: StreamingRuntimeConfig,
  ): Promise<RuntimePipelineHandlerResult> {
    const handler = this.handlers.get(name);
    if (!handler) {
      return {
        handler: name,
        status: "not_implemented",
        message: `Handler ${name} non enregistré — Sprint 2.2+`,
      };
    }
    if (!handler.canHandle(config)) {
      return {
        handler: name,
        status: "skipped",
        message: `Handler ${name} ignoré — flags runtime insuffisants`,
      };
    }
    return handler.handle(ctx, config);
  }
}

export function createEmptyPipelineRegistry(): RuntimePipelineRegistry {
  return new RuntimePipelineRegistry();
}
