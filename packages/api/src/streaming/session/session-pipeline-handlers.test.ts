import { describe, expect, it } from "vitest";
import { buildRuntimeConfig, DEFAULT_STREAMING_RUNTIME_FLAGS } from "../integration/feature-flags";
import { createEmptyPipelineRegistry } from "../runtime/pipeline";
import { createRuntimeContext } from "../runtime/streaming-runtime-context";
import { createSessionEngine } from "./session-engine";
import { registerSessionPipelineHandlers } from "./session-pipeline-handlers";
import { InMemorySessionRepository } from "./in-memory-session.repository";
import { RuntimeContextInvalidError } from "../runtime-errors";
import { InMemoryDomainEventPublisher } from "../ports";

describe("session-pipeline-handlers", () => {
  it("enregistre OpenSession et RecordHeartbeat", () => {
    const registry = createEmptyPipelineRegistry();
    const engine = createSessionEngine(
      new InMemorySessionRepository(),
      new InMemoryDomainEventPublisher(),
    );
    registerSessionPipelineHandlers(registry, engine);
    expect(registry.list()).toEqual([
      "OpenSession",
      "RecordHeartbeat",
      "CompleteSession",
      "InvalidateSession",
    ]);
  });

  it("OpenSession crée une session quand flags ON", async () => {
    const repo = new InMemorySessionRepository();
    const registry = createEmptyPipelineRegistry();
    const engine = createSessionEngine(repo, new InMemoryDomainEventPublisher());
    registerSessionPipelineHandlers(registry, engine);

    const config = buildRuntimeConfig({
      ...DEFAULT_STREAMING_RUNTIME_FLAGS,
      runtimeEnabled: true,
      applicationLayerEnabled: true,
      portsEnabled: true,
      sessionEngineEnabled: true,
      sessionHeartbeatEnabled: true,
    });

    const ctx = createRuntimeContext({
      actorId: "user-1",
      correlationId: "c1",
      trackId: "track-1",
    });

    const result = await registry.dispatch("OpenSession", ctx, { ...config, dryRun: false });
    expect(result.status).toBe("registered");
    expect(result.message).toContain("Session");
  });

  it("CompleteSession ferme une session valide", async () => {
    const repo = new InMemorySessionRepository();
    const registry = createEmptyPipelineRegistry();
    const engine = createSessionEngine(repo, new InMemoryDomainEventPublisher());
    registerSessionPipelineHandlers(registry, engine);

    const config = buildRuntimeConfig({
      ...DEFAULT_STREAMING_RUNTIME_FLAGS,
      runtimeEnabled: true,
      applicationLayerEnabled: true,
      portsEnabled: true,
      sessionEngineEnabled: true,
      sessionHeartbeatEnabled: true,
    });
    const runtimeConfig = { ...config, dryRun: false };

    const ctx = createRuntimeContext({
      actorId: "user-1",
      correlationId: "c1",
      trackId: "track-1",
    });
    const created = await engine.execute(
      ctx,
      { type: "CreateSession", trackId: "track-1" },
      runtimeConfig,
    );
    await engine.execute(
      ctx,
      { type: "HeartbeatSession", sessionId: created.sessionId!, positionSeconds: 5 },
      runtimeConfig,
    );

    const completeCtx = createRuntimeContext({
      actorId: "user-1",
      correlationId: "c3",
      sessionId: created.sessionId,
      payload: { sessionId: created.sessionId, positionSeconds: 170, totalDurationSeconds: 180 },
    });
    const result = await registry.dispatch("CompleteSession", completeCtx, runtimeConfig);
    expect(result.status).toBe("registered");
  });

  it("InvalidateSession ferme une session frauduleuse", async () => {
    const repo = new InMemorySessionRepository();
    const registry = createEmptyPipelineRegistry();
    const engine = createSessionEngine(repo, new InMemoryDomainEventPublisher());
    registerSessionPipelineHandlers(registry, engine);

    const config = buildRuntimeConfig({
      ...DEFAULT_STREAMING_RUNTIME_FLAGS,
      runtimeEnabled: true,
      applicationLayerEnabled: true,
      portsEnabled: true,
      sessionEngineEnabled: true,
    });

    const created = await engine.execute(
      createRuntimeContext({ actorId: "user-1", correlationId: "c1", trackId: "track-1" }),
      { type: "CreateSession", trackId: "track-1" },
      { ...config, dryRun: false },
    );

    const ctx = createRuntimeContext({
      actorId: "user-1",
      correlationId: "c2",
      sessionId: created.sessionId,
      payload: { sessionId: created.sessionId, reason: "test" },
    });
    const result = await registry.dispatch("InvalidateSession", ctx, { ...config, dryRun: false });
    expect(result.status).toBe("registered");
  });

  it("OpenSession exige trackId", async () => {
    const registry = createEmptyPipelineRegistry();
    registerSessionPipelineHandlers(
      registry,
      createSessionEngine(new InMemorySessionRepository(), new InMemoryDomainEventPublisher()),
    );
    const config = buildRuntimeConfig({
      ...DEFAULT_STREAMING_RUNTIME_FLAGS,
      runtimeEnabled: true,
      applicationLayerEnabled: true,
      portsEnabled: true,
      sessionEngineEnabled: true,
    });
    await expect(
      registry.dispatch(
        "OpenSession",
        createRuntimeContext({
          actorId: "u",
          correlationId: "c",
          initiatedAt: new Date().toISOString(),
        }),
        { ...config, dryRun: false },
      ),
    ).rejects.toBeInstanceOf(RuntimeContextInvalidError);
  });

  it("CompleteSession exige sessionId", async () => {
    const registry = createEmptyPipelineRegistry();
    registerSessionPipelineHandlers(
      registry,
      createSessionEngine(new InMemorySessionRepository(), new InMemoryDomainEventPublisher()),
    );
    const config = buildRuntimeConfig({
      ...DEFAULT_STREAMING_RUNTIME_FLAGS,
      runtimeEnabled: true,
      applicationLayerEnabled: true,
      portsEnabled: true,
      sessionEngineEnabled: true,
    });
    await expect(
      registry.dispatch(
        "CompleteSession",
        createRuntimeContext({ actorId: "u", correlationId: "c" }),
        { ...config, dryRun: false },
      ),
    ).rejects.toBeInstanceOf(RuntimeContextInvalidError);
  });

  it("RecordHeartbeat exige sessionId et position valide", async () => {
    const registry = createEmptyPipelineRegistry();
    registerSessionPipelineHandlers(
      registry,
      createSessionEngine(new InMemorySessionRepository(), new InMemoryDomainEventPublisher()),
    );
    const config = buildRuntimeConfig({
      ...DEFAULT_STREAMING_RUNTIME_FLAGS,
      runtimeEnabled: true,
      applicationLayerEnabled: true,
      portsEnabled: true,
      sessionEngineEnabled: true,
      sessionHeartbeatEnabled: true,
    });
    const runtimeConfig = { ...config, dryRun: false };

    await expect(
      registry.dispatch(
        "RecordHeartbeat",
        createRuntimeContext({ actorId: "u", correlationId: "c", payload: { positionSeconds: 1 } }),
        runtimeConfig,
      ),
    ).rejects.toBeInstanceOf(RuntimeContextInvalidError);

    await expect(
      registry.dispatch(
        "RecordHeartbeat",
        createRuntimeContext({
          actorId: "u",
          correlationId: "c",
          payload: { sessionId: "s1", positionSeconds: -1 },
        }),
        runtimeConfig,
      ),
    ).rejects.toBeInstanceOf(RuntimeContextInvalidError);
  });

  it("RecordHeartbeat accepte sessionId sur le contexte", async () => {
    const repo = new InMemorySessionRepository();
    const registry = createEmptyPipelineRegistry();
    const engine = createSessionEngine(repo, new InMemoryDomainEventPublisher());
    registerSessionPipelineHandlers(registry, engine);
    const config = buildRuntimeConfig({
      ...DEFAULT_STREAMING_RUNTIME_FLAGS,
      runtimeEnabled: true,
      applicationLayerEnabled: true,
      portsEnabled: true,
      sessionEngineEnabled: true,
      sessionHeartbeatEnabled: true,
    });
    const runtimeConfig = { ...config, dryRun: false };
    const created = await engine.execute(
      createRuntimeContext({ actorId: "user-1", correlationId: "c1", trackId: "track-1" }),
      { type: "CreateSession", trackId: "track-1" },
      runtimeConfig,
    );
    const result = await registry.dispatch(
      "RecordHeartbeat",
      createRuntimeContext({
        actorId: "user-1",
        correlationId: "c2",
        sessionId: created.sessionId,
        payload: { positionSeconds: 3 },
      }),
      runtimeConfig,
    );
    expect(result.status).toBe("registered");
  });

  it("RecordHeartbeat ignoré si heartbeat flag OFF", async () => {
    const registry = createEmptyPipelineRegistry();
    const engine = createSessionEngine(
      new InMemorySessionRepository(),
      new InMemoryDomainEventPublisher(),
    );
    registerSessionPipelineHandlers(registry, engine);

    const config = buildRuntimeConfig({
      ...DEFAULT_STREAMING_RUNTIME_FLAGS,
      runtimeEnabled: true,
      applicationLayerEnabled: true,
      portsEnabled: true,
      sessionEngineEnabled: true,
      sessionHeartbeatEnabled: false,
    });

    const ctx = createRuntimeContext({
      actorId: "user-1",
      correlationId: "c1",
      sessionId: "s1",
      payload: { positionSeconds: 10 },
    });

    const result = await registry.dispatch("RecordHeartbeat", ctx, { ...config, dryRun: false });
    expect(result.status).toBe("skipped");
  });
});
