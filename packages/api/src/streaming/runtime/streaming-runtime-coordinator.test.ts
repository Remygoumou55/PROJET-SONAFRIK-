import { describe, expect, it } from "vitest";
import { createStreamingRuntimeCoordinator } from "./streaming-runtime-factory";
import { createRuntimeContext } from "./streaming-runtime-context";
import { buildRuntimeConfig, DEFAULT_STREAMING_RUNTIME_FLAGS } from "../integration/feature-flags";
import {
  ApplicationLayerDisabledError,
  RuntimeContextInvalidError,
  RuntimeDisabledError,
  RuntimeHandlerNotRegisteredError,
} from "../runtime-errors";
import {
  RuntimePipelineRegistry,
} from "./pipeline";

const ctx = createRuntimeContext({ actorId: "user-1", correlationId: "corr-1" });

describe("StreamingRuntimeCoordinator", () => {
  it("delegates to legacy when runtime disabled", async () => {
    const coordinator = createStreamingRuntimeCoordinator({
      config: buildRuntimeConfig(DEFAULT_STREAMING_RUNTIME_FLAGS),
    });

    const result = await coordinator.dispatch(ctx, "OpenSession");
    expect(result.mode).toBe("legacy");
    expect(result.legacyActive).toBe(true);
    expect(coordinator.resolveExecutionMode()).toBe("legacy");
  });

  it("requires context flag when runtime enabled", async () => {
    const coordinator = createStreamingRuntimeCoordinator({
      config: buildRuntimeConfig({
        ...DEFAULT_STREAMING_RUNTIME_FLAGS,
        runtimeEnabled: true,
        applicationLayerEnabled: true,
      }),
    });

    await expect(coordinator.dispatch(ctx, "OpenSession")).rejects.toBeInstanceOf(
      RuntimeContextInvalidError,
    );
  });

  it("requires application layer when context enabled", async () => {
    const coordinator = createStreamingRuntimeCoordinator({
      config: buildRuntimeConfig({
        ...DEFAULT_STREAMING_RUNTIME_FLAGS,
        runtimeEnabled: true,
        contextEnabled: true,
      }),
    });

    await expect(coordinator.dispatch(ctx, "OpenSession")).rejects.toBeInstanceOf(
      ApplicationLayerDisabledError,
    );
  });

  it("dispatches registered handler in runtime mode", async () => {
    const config = buildRuntimeConfig({
      ...DEFAULT_STREAMING_RUNTIME_FLAGS,
      runtimeEnabled: true,
      applicationLayerEnabled: true,
      contextEnabled: true,
      portsEnabled: true,
      contractsEnabled: true,
    });

    const pipeline = new RuntimePipelineRegistry();
    pipeline.register({
      name: "RecordHeartbeat",
      canHandle: () => true,
      handle: async () => ({
        handler: "RecordHeartbeat",
        status: "registered",
        message: "heartbeat stub",
      }),
    });

    const coordinator = createStreamingRuntimeCoordinator({
      config,
      pipeline,
      registerSessionHandlers: false,
    });
    const result = await coordinator.dispatch(ctx, "RecordHeartbeat");
    expect(result.mode).toBe("runtime");
    expect(result.pipeline?.status).toBe("registered");
  });

  it("returns dry_run when config requires legacy path", async () => {
    const config = {
      ...buildRuntimeConfig({
        ...DEFAULT_STREAMING_RUNTIME_FLAGS,
        runtimeEnabled: true,
        applicationLayerEnabled: true,
        contextEnabled: true,
      }),
      dryRun: true,
    };
    const coordinator = createStreamingRuntimeCoordinator({ config });
    const result = await coordinator.dispatch(ctx, "OpenSession");
    expect(result.mode).toBe("dry_run");
    expect(coordinator.resolveExecutionMode()).toBe("dry_run");
    expect(coordinator.getConfig().dryRun).toBe(true);
  });

  it("requires ports flag for runtime dispatch", async () => {
    const coordinator = createStreamingRuntimeCoordinator({
      config: buildRuntimeConfig({
        ...DEFAULT_STREAMING_RUNTIME_FLAGS,
        runtimeEnabled: true,
        applicationLayerEnabled: true,
        contextEnabled: true,
        portsEnabled: false,
      }),
    });

    await expect(coordinator.dispatch(ctx, "OpenSession")).rejects.toBeInstanceOf(
      RuntimeDisabledError,
    );
  });

  it("throws when handler not registered", async () => {
    const config = buildRuntimeConfig({
      ...DEFAULT_STREAMING_RUNTIME_FLAGS,
      runtimeEnabled: true,
      applicationLayerEnabled: true,
      contextEnabled: true,
      portsEnabled: true,
    });

    const coordinator = createStreamingRuntimeCoordinator({
      config,
      registerSessionHandlers: false,
    });
    await expect(coordinator.dispatch(ctx, "OpenSession")).rejects.toBeInstanceOf(
      RuntimeHandlerNotRegisteredError,
    );
  });
});
