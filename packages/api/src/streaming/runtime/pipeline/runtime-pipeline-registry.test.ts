import { describe, expect, it } from "vitest";
import {
  RuntimePipelineRegistry,
  type RuntimePipelineHandler,
} from "./runtime-pipeline-registry";
import { createRuntimeContext } from "../streaming-runtime-context";
import { buildRuntimeConfig, DEFAULT_STREAMING_RUNTIME_FLAGS } from "../../integration/feature-flags";

const ctx = createRuntimeContext({ actorId: "user-1", correlationId: "corr-1" });
const enabledConfig = buildRuntimeConfig({
  ...DEFAULT_STREAMING_RUNTIME_FLAGS,
  runtimeEnabled: true,
  portsEnabled: true,
});

describe("RuntimePipelineRegistry", () => {
  it("returns not_implemented for unregistered handler", async () => {
    const registry = new RuntimePipelineRegistry();
    const result = await registry.dispatch("OpenSession", ctx, enabledConfig);
    expect(result.status).toBe("not_implemented");
  });

  it("dispatches registered handler", async () => {
    const registry = new RuntimePipelineRegistry();
    const handler: RuntimePipelineHandler = {
      name: "OpenSession",
      canHandle: () => true,
      handle: async () => ({
        handler: "OpenSession",
        status: "registered",
        message: "ok",
      }),
    };
    registry.register(handler);

    const result = await registry.dispatch("OpenSession", ctx, enabledConfig);
    expect(result.status).toBe("registered");
    expect(registry.list()).toContain("OpenSession");
  });

  it("lists registered handlers", () => {
    const registry = new RuntimePipelineRegistry();
    registry.register({
      name: "InvalidateSession",
      canHandle: () => true,
      handle: async () => ({
        handler: "InvalidateSession",
        status: "registered",
        message: "ok",
      }),
    });
    expect(registry.list()).toEqual(["InvalidateSession"]);
  });

  it("skips handler when canHandle is false", async () => {
    const registry = new RuntimePipelineRegistry();
    registry.register({
      name: "CompleteSession",
      canHandle: () => false,
      handle: async () => ({
        handler: "CompleteSession",
        status: "registered",
        message: "should not run",
      }),
    });

    const result = await registry.dispatch("CompleteSession", ctx, enabledConfig);
    expect(result.status).toBe("skipped");
  });
});
