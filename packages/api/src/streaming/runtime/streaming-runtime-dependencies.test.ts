import { describe, expect, it } from "vitest";
import { createRuntimeDependencies } from "./streaming-runtime-dependencies";
import { createFoundationRuntimePorts } from "./streaming-runtime-factory";
import { buildRuntimeConfig, DEFAULT_STREAMING_RUNTIME_FLAGS } from "../integration/feature-flags";
import { createEmptyPipelineRegistry } from "./pipeline";
import { InMemoryDomainEventPublisher } from "../ports";

describe("streaming-runtime-dependencies", () => {
  it("wraps dependency container", () => {
    const config = buildRuntimeConfig(DEFAULT_STREAMING_RUNTIME_FLAGS);
    const deps = createRuntimeDependencies({
      ports: createFoundationRuntimePorts(),
      events: new InMemoryDomainEventPublisher(),
      pipeline: createEmptyPipelineRegistry(),
      config,
    });
    expect(deps.config.runtimeEnabled).toBe(false);
    expect(deps.ports.sessionEngine.engineId).toBe("session-engine");
  });
});
