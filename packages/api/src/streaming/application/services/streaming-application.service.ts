import { ApplicationLayerDisabledError, RuntimeNotImplementedError } from "../../runtime-errors";
import type { StreamingCommand } from "../commands";
import type { CommandDispatchDto, RuntimeStatusDto, SessionStateDto } from "../dto";
import type { StreamingQuery } from "../queries";
import type { StreamingApplicationPorts } from "../ports";
import type { StreamingApplicationContext } from "../ports";
import { assertApplicationContext } from "../ports";
import type { RuntimePipelineHandlerName } from "../../runtime/pipeline";
import { createRuntimeContext } from "../../runtime/streaming-runtime-context";
import { isSessionEngineActive } from "../../runtime/streaming-runtime-config";
import { deriveSessionState } from "../../session/session-state";

const COMMAND_HANDLER_MAP: Record<StreamingCommand["type"], RuntimePipelineHandlerName> = {
  OpenSession: "OpenSession",
  RecordHeartbeat: "RecordHeartbeat",
  CompleteSession: "CompleteSession",
  InvalidateSession: "InvalidateSession",
};

function toRuntimeContext(
  ctx: StreamingApplicationContext,
  command: StreamingCommand,
): ReturnType<typeof createRuntimeContext> {
  const base = createRuntimeContext({
    actorId: ctx.actorId,
    correlationId: ctx.correlationId,
    idempotencyKey: ctx.idempotencyKey,
    initiatedAt: ctx.initiatedAt,
  });

  switch (command.type) {
    case "OpenSession":
      return {
        ...base,
        trackId: command.trackId,
        payload: { platform: command.platform },
      };
    case "RecordHeartbeat":
      return {
        ...base,
        sessionId: command.sessionId,
        payload: { sessionId: command.sessionId, positionSeconds: command.positionSeconds },
      };
    case "CompleteSession":
      return {
        ...base,
        sessionId: command.sessionId,
        payload: { sessionId: command.sessionId },
      };
    case "InvalidateSession":
      return {
        ...base,
        sessionId: command.sessionId,
        payload: { sessionId: command.sessionId, reason: command.reason },
      };
    default: {
      const _exhaustive: never = command;
      return _exhaustive;
    }
  }
}

/** CQRS entry point — Sprint 2.1 foundation shell */
export class StreamingApplicationService {
  constructor(private readonly deps: StreamingApplicationPorts) {}

  async executeCommand(
    ctx: StreamingApplicationContext,
    command: StreamingCommand,
  ): Promise<CommandDispatchDto> {
    assertApplicationContext(ctx);

    if (!this.deps.config.applicationLayerEnabled || !this.deps.config.runtimeEnabled) {
      return {
        accepted: false,
        mode: "legacy",
        commandType: command.type,
        message: "Couche application désactivée — chemin legacy actif",
      };
    }

    if (!this.deps.config.contractsEnabled) {
      throw new ApplicationLayerDisabledError("runtime_contracts_enabled requis");
    }

    if (!isSessionEngineActive(this.deps.config)) {
      return {
        accepted: false,
        mode: this.deps.coordinator.resolveExecutionMode(),
        commandType: command.type,
        message: `Session Engine désactivé — legacy inchangé`,
      };
    }

    const handlerName = COMMAND_HANDLER_MAP[command.type];
    const mode = this.deps.coordinator.resolveExecutionMode();

    if (mode === "legacy" || mode === "dry_run") {
      return {
        accepted: false,
        mode,
        commandType: command.type,
        message: `Commande ${command.type} — runtime dry-run, legacy inchangé`,
      };
    }

    try {
      const runtimeCtx = toRuntimeContext(ctx, command);
      const result = await this.deps.coordinator.dispatch(runtimeCtx, handlerName);
      return {
        accepted: result.mode === "runtime" && result.pipeline?.status === "registered",
        mode: result.mode,
        commandType: command.type,
        message: result.pipeline?.message ?? "Dispatch runtime",
      };
    } catch {
      throw new RuntimeNotImplementedError(command.type);
    }
  }

  async executeQuery(
    ctx: StreamingApplicationContext,
    query: StreamingQuery,
  ): Promise<RuntimeStatusDto | SessionStateDto> {
    assertApplicationContext(ctx);

    switch (query.type) {
      case "GetRuntimeStatus":
        return {
          mode: this.deps.coordinator.resolveExecutionMode(),
          runtimeEnabled: this.deps.config.runtimeEnabled,
          applicationLayerEnabled: this.deps.config.applicationLayerEnabled,
          registeredHandlers: this.deps.coordinator.getRegisteredHandlers(),
        };
      case "GetSessionState": {
        if (!isSessionEngineActive(this.deps.config) || !this.deps.sessionRepository) {
          return {
            sessionId: query.sessionId,
            state: "legacy",
            message: "Session Engine désactivé — legacy actif",
          };
        }
        const session = await this.deps.sessionRepository.findById(query.sessionId, ctx.actorId);
        if (!session) {
          return {
            sessionId: query.sessionId,
            state: "not_found",
            message: "Session introuvable",
          };
        }
        const state = deriveSessionState(session);
        return {
          sessionId: query.sessionId,
          state,
          message: `État dérivé : ${state}`,
        };
      }
      default: {
        const _exhaustive: never = query;
        return _exhaustive;
      }
    }
  }
}

export function createStreamingApplicationService(
  deps: StreamingApplicationPorts,
): StreamingApplicationService {
  return new StreamingApplicationService(deps);
}
