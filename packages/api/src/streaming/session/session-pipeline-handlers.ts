import type { StreamingPlatform } from "@sonafrik/types";
import {
  isSessionEngineActive,
  isSessionHeartbeatActive,
} from "../runtime/streaming-runtime-config";
import { RuntimeContextInvalidError } from "../runtime-errors";
import type {
  RuntimePipelineHandler,
  RuntimePipelineHandlerResult,
} from "../runtime/pipeline";
import type { SessionEngine } from "./session-engine";

function ok(
  handler: RuntimePipelineHandler["name"],
  message: string,
): RuntimePipelineHandlerResult {
  return { handler, status: "registered", message };
}

export function createSessionPipelineHandlers(engine: SessionEngine): RuntimePipelineHandler[] {
  return [
    {
      name: "OpenSession",
      canHandle: (config) => isSessionEngineActive(config),
      handle: async (ctx, config) => {
        if (!ctx.trackId?.trim()) {
          throw new RuntimeContextInvalidError("trackId requis pour OpenSession");
        }
        const platform = (ctx.payload?.platform ?? "web") as StreamingPlatform;
        const result = await engine.execute(
          ctx,
          {
            type: "CreateSession",
            trackId: ctx.trackId,
            platform,
            qualityKbps: ctx.payload?.qualityKbps ?? null,
            deviceId: ctx.payload?.deviceId ?? null,
            totalDurationSeconds: ctx.payload?.totalDurationSeconds,
          },
          config,
        );
        return ok("OpenSession", `Session ${result.sessionId} créée (${result.state})`);
      },
    },
    {
      name: "RecordHeartbeat",
      canHandle: (config) =>
        isSessionEngineActive(config) && isSessionHeartbeatActive(config),
      handle: async (ctx, config) => {
        const sessionId = ctx.sessionId ?? ctx.payload?.sessionId;
        const positionSeconds = ctx.payload?.positionSeconds;
        if (!sessionId?.trim()) {
          throw new RuntimeContextInvalidError("sessionId requis pour RecordHeartbeat");
        }
        if (typeof positionSeconds !== "number" || positionSeconds < 0) {
          throw new RuntimeContextInvalidError("positionSeconds invalide");
        }
        const result = await engine.execute(
          ctx,
          { type: "HeartbeatSession", sessionId, positionSeconds },
          config,
        );
        return ok("RecordHeartbeat", `Heartbeat ${result.state}`);
      },
    },
    {
      name: "CompleteSession",
      canHandle: (config) => isSessionEngineActive(config),
      handle: async (ctx, config) => {
        const sessionId = ctx.sessionId ?? ctx.payload?.sessionId;
        const positionSeconds = ctx.payload?.positionSeconds ?? 0;
        const totalDurationSeconds = ctx.payload?.totalDurationSeconds ?? 0;
        if (!sessionId?.trim()) {
          throw new RuntimeContextInvalidError("sessionId requis pour CompleteSession");
        }
        const result = await engine.execute(
          ctx,
          {
            type: "CloseSession",
            sessionId,
            positionSeconds,
            totalDurationSeconds,
          },
          config,
        );
        return ok(
          "CompleteSession",
          `Session fermée (${result.isValidListen ? "valid" : "invalid"})`,
        );
      },
    },
    {
      name: "InvalidateSession",
      canHandle: (config) => isSessionEngineActive(config),
      handle: async (ctx, config) => {
        const sessionId = ctx.sessionId ?? ctx.payload?.sessionId;
        const reason = ctx.payload?.reason ?? "invalidated";
        if (!sessionId?.trim()) {
          throw new RuntimeContextInvalidError("sessionId requis pour InvalidateSession");
        }
        await engine.execute(ctx, { type: "InvalidateSession", sessionId, reason }, config);
        return ok("InvalidateSession", "Session invalidée");
      },
    },
  ];
}

export function registerSessionPipelineHandlers(
  registry: { register: (handler: RuntimePipelineHandler) => void },
  engine: SessionEngine,
): void {
  for (const handler of createSessionPipelineHandlers(engine)) {
    registry.register(handler);
  }
}
