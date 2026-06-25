import { describe, expect, it } from "vitest";
import { createStreamingApplicationService } from "./streaming-application.service";
import { createStreamingRuntimeCoordinator, createFoundationRuntimePorts } from "../../runtime";
import { createApplicationContext } from "../ports";
import { buildRuntimeConfig, DEFAULT_STREAMING_RUNTIME_FLAGS } from "../../integration/feature-flags";
import { RuntimePipelineRegistry } from "../../runtime/pipeline";
import { ApplicationLayerDisabledError, RuntimeNotImplementedError } from "../../runtime-errors";
import { InMemorySessionRepository } from "../../session/in-memory-session.repository";

const ctx = createApplicationContext({ actorId: "user-1", correlationId: "corr-1" });

function buildService(flags = DEFAULT_STREAMING_RUNTIME_FLAGS) {
  const config = buildRuntimeConfig(flags);
  const coordinator = createStreamingRuntimeCoordinator({ config });
  return createStreamingApplicationService({ coordinator, config });
}

describe("StreamingApplicationService", () => {
  it("returns legacy mode for GetRuntimeStatus when disabled", async () => {
    const service = buildService();
    const status = await service.executeQuery(ctx, { type: "GetRuntimeStatus" });
    expect(status).toMatchObject({
      mode: "legacy",
      runtimeEnabled: false,
    });
  });

  it("rejects commands when application layer disabled", async () => {
    const service = buildService();
    const result = await service.executeCommand(ctx, {
      type: "OpenSession",
      trackId: "track-1",
    });
    expect(result.accepted).toBe(false);
    expect(result.mode).toBe("legacy");
  });

  it("requires contracts flag for command execution", async () => {
    const service = buildService({
      ...DEFAULT_STREAMING_RUNTIME_FLAGS,
      runtimeEnabled: true,
      applicationLayerEnabled: true,
    });

    await expect(
      service.executeCommand(ctx, { type: "OpenSession", trackId: "track-1" }),
    ).rejects.toBeInstanceOf(ApplicationLayerDisabledError);
  });

  it("returns legacy state for GetSessionState when session engine disabled", async () => {
    const service = buildService();
    const state = await service.executeQuery(ctx, {
      type: "GetSessionState",
      sessionId: "sess-1",
    });
    expect(state).toMatchObject({
      sessionId: "sess-1",
      state: "legacy",
    });
  });

  it("accepts command when handler registered", async () => {
    const flags = {
      ...DEFAULT_STREAMING_RUNTIME_FLAGS,
      runtimeEnabled: true,
      applicationLayerEnabled: true,
      contractsEnabled: true,
      contextEnabled: true,
      portsEnabled: true,
      sessionEngineEnabled: true,
    };
    const config = buildRuntimeConfig(flags);
    const pipeline = new RuntimePipelineRegistry();
    pipeline.register({
      name: "OpenSession",
      canHandle: () => true,
      handle: async () => ({
        handler: "OpenSession",
        status: "registered",
        message: "session stub",
      }),
    });
    const coordinator = createStreamingRuntimeCoordinator({ config, pipeline });
    const service = createStreamingApplicationService({ coordinator, config });

    const result = await service.executeCommand(ctx, {
      type: "OpenSession",
      trackId: "track-1",
    });
    expect(result.accepted).toBe(true);
    expect(result.mode).toBe("runtime");
  });

  it("returns dry_run message when config forces legacy path", async () => {
    const config = {
      ...buildRuntimeConfig({
        ...DEFAULT_STREAMING_RUNTIME_FLAGS,
        runtimeEnabled: true,
        applicationLayerEnabled: true,
        contractsEnabled: true,
      }),
      dryRun: true,
    };
    const coordinator = createStreamingRuntimeCoordinator({ config });
    const service = createStreamingApplicationService({ coordinator, config });

    const result = await service.executeCommand(ctx, {
      type: "CompleteSession",
      sessionId: "sess-1",
    });
    expect(result.mode).toBe("dry_run");
    expect(result.accepted).toBe(false);
  });

  it("throws not implemented when session engine on but handler missing", async () => {
    const flags = {
      ...DEFAULT_STREAMING_RUNTIME_FLAGS,
      runtimeEnabled: true,
      applicationLayerEnabled: true,
      contractsEnabled: true,
      contextEnabled: true,
      portsEnabled: true,
      sessionEngineEnabled: true,
    };
    const config = buildRuntimeConfig(flags);
    const coordinator = createStreamingRuntimeCoordinator({
      config,
      registerSessionHandlers: false,
    });
    const service = createStreamingApplicationService({ coordinator, config });

    await expect(
      service.executeCommand(ctx, { type: "OpenSession", trackId: "track-1" }),
    ).rejects.toBeInstanceOf(RuntimeNotImplementedError);
  });

  it("dispatches RecordHeartbeat via session pipeline", async () => {
    const repo = new InMemorySessionRepository();
    const flags = {
      ...DEFAULT_STREAMING_RUNTIME_FLAGS,
      runtimeEnabled: true,
      applicationLayerEnabled: true,
      contractsEnabled: true,
      contextEnabled: true,
      portsEnabled: true,
      sessionEngineEnabled: true,
      sessionHeartbeatEnabled: true,
    };
    const config = buildRuntimeConfig(flags);
    const ports = createFoundationRuntimePorts({ sessionRepository: repo });
    const coordinator = createStreamingRuntimeCoordinator({ config, ports });
    const service = createStreamingApplicationService({
      coordinator,
      config,
      sessionRepository: repo,
    });

    const sessionId = await repo.openSession({
      actorId: "user-1",
      trackId: "track-1",
      platform: "web",
    });

    const result = await service.executeCommand(ctx, {
      type: "RecordHeartbeat",
      sessionId,
      positionSeconds: 12,
    });
    expect(result.accepted).toBe(true);
  });

  it("dispatches InvalidateSession via session pipeline", async () => {
    const repo = new InMemorySessionRepository();
    const flags = {
      ...DEFAULT_STREAMING_RUNTIME_FLAGS,
      runtimeEnabled: true,
      applicationLayerEnabled: true,
      contractsEnabled: true,
      contextEnabled: true,
      portsEnabled: true,
      sessionEngineEnabled: true,
    };
    const config = buildRuntimeConfig(flags);
    const ports = createFoundationRuntimePorts({ sessionRepository: repo });
    const service = createStreamingApplicationService({
      coordinator: createStreamingRuntimeCoordinator({ config, ports }),
      config,
      sessionRepository: repo,
    });

    const sessionId = await repo.openSession({
      actorId: "user-1",
      trackId: "track-1",
      platform: "web",
    });

    const result = await service.executeCommand(ctx, {
      type: "InvalidateSession",
      sessionId,
      reason: "test",
    });
    expect(result.accepted).toBe(true);
  });

  it("dispatches CompleteSession via session pipeline", async () => {
    const repo = new InMemorySessionRepository();
    const flags = {
      ...DEFAULT_STREAMING_RUNTIME_FLAGS,
      runtimeEnabled: true,
      applicationLayerEnabled: true,
      contractsEnabled: true,
      contextEnabled: true,
      portsEnabled: true,
      sessionEngineEnabled: true,
      sessionHeartbeatEnabled: true,
    };
    const config = buildRuntimeConfig(flags);
    const ports = createFoundationRuntimePorts({ sessionRepository: repo });
    const service = createStreamingApplicationService({
      coordinator: createStreamingRuntimeCoordinator({ config, ports }),
      config,
      sessionRepository: repo,
    });

    const sessionId = await repo.openSession({
      actorId: "user-1",
      trackId: "track-1",
      platform: "web",
    });
    await repo.recordHeartbeat(sessionId, "user-1", 170);

    const result = await service.executeCommand(ctx, {
      type: "CompleteSession",
      sessionId,
    });
    expect(result.accepted).toBe(true);
  });

  it("dispatches OpenSession via session pipeline when fully enabled", async () => {
    const repo = new InMemorySessionRepository();
    const flags = {
      ...DEFAULT_STREAMING_RUNTIME_FLAGS,
      runtimeEnabled: true,
      applicationLayerEnabled: true,
      contractsEnabled: true,
      contextEnabled: true,
      portsEnabled: true,
      sessionEngineEnabled: true,
      sessionHeartbeatEnabled: true,
    };
    const config = buildRuntimeConfig(flags);
    const coordinator = createStreamingRuntimeCoordinator({ config });
    const service = createStreamingApplicationService({
      coordinator,
      config,
      sessionRepository: repo,
    });

    const result = await service.executeCommand(ctx, {
      type: "OpenSession",
      trackId: "track-1",
    });
    expect(result.accepted).toBe(true);
    expect(result.mode).toBe("runtime");
  });

  it("returns dry_run when session engine on but dryRun forced", async () => {
    const config = {
      ...buildRuntimeConfig({
        ...DEFAULT_STREAMING_RUNTIME_FLAGS,
        runtimeEnabled: true,
        applicationLayerEnabled: true,
        contractsEnabled: true,
        sessionEngineEnabled: true,
      }),
      dryRun: true,
    };
    const coordinator = createStreamingRuntimeCoordinator({ config });
    const service = createStreamingApplicationService({ coordinator, config });

    const result = await service.executeCommand(ctx, {
      type: "OpenSession",
      trackId: "track-1",
    });
    expect(result.mode).toBe("dry_run");
    expect(result.accepted).toBe(false);
  });

  it("returns derived session state when engine enabled", async () => {
    const repo = new InMemorySessionRepository();
    const sessionId = await repo.openSession({
      actorId: "user-1",
      trackId: "track-1",
      platform: "web",
    });

    const flags = {
      ...DEFAULT_STREAMING_RUNTIME_FLAGS,
      runtimeEnabled: true,
      applicationLayerEnabled: true,
      portsEnabled: true,
      sessionEngineEnabled: true,
    };
    const config = buildRuntimeConfig(flags);
    const coordinator = createStreamingRuntimeCoordinator({ config, ports: undefined });
    const service = createStreamingApplicationService({
      coordinator,
      config,
      sessionRepository: repo,
    });

    const state = await service.executeQuery(ctx, { type: "GetSessionState", sessionId });
    expect(state).toMatchObject({ sessionId, state: "Created" });
  });

  it("returns not_found for unknown session", async () => {
    const repo = new InMemorySessionRepository();
    const flags = {
      ...DEFAULT_STREAMING_RUNTIME_FLAGS,
      runtimeEnabled: true,
      applicationLayerEnabled: true,
      portsEnabled: true,
      sessionEngineEnabled: true,
    };
    const config = buildRuntimeConfig(flags);
    const service = createStreamingApplicationService({
      coordinator: createStreamingRuntimeCoordinator({ config }),
      config,
      sessionRepository: repo,
    });

    const state = await service.executeQuery(ctx, {
      type: "GetSessionState",
      sessionId: "missing",
    });
    expect(state).toMatchObject({ state: "not_found" });
  });
});
