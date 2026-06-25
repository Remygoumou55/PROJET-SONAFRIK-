import { describe, expect, it, vi } from "vitest";
import type { StreamingRuntimeConfig } from "../integration/feature-flags";
import { buildRuntimeConfig, DEFAULT_STREAMING_RUNTIME_FLAGS } from "../integration/feature-flags";
import { createRuntimeContext } from "../runtime/streaming-runtime-context";
import { InMemoryDomainEventPublisher } from "../ports";
import { InMemorySessionRepository } from "./in-memory-session.repository";
import { createSessionEngine, resolveClosedSubtype, sessionIsFirstHeartbeat } from "./session-engine";

function sessionConfig(overrides: Partial<StreamingRuntimeConfig> = {}): StreamingRuntimeConfig {
  return {
    ...buildRuntimeConfig({
      ...DEFAULT_STREAMING_RUNTIME_FLAGS,
      runtimeEnabled: true,
      applicationLayerEnabled: true,
      contractsEnabled: true,
      portsEnabled: true,
      eventsEnabled: true,
      contextEnabled: true,
      sessionEngineEnabled: true,
      sessionHeartbeatEnabled: true,
      sessionRecoveryEnabled: true,
      sessionExpirationEnabled: true,
    }),
    dryRun: false,
    ...overrides,
  };
}

describe("SessionEngine — lifecycle", () => {
  const ctx = createRuntimeContext({
    actorId: "user-1",
    correlationId: "corr-1",
    trackId: "track-1",
  });

  it("exécute le cycle complet Created → Active → Heartbeat → Suspended → Active → Closed", async () => {
    const repo = new InMemorySessionRepository();
    const bus = { publish: vi.fn().mockResolvedValue(undefined) };
    const engine = createSessionEngine(repo, bus);
    const config = sessionConfig();

    await engine.execute(ctx, { type: "AuthenticateSession" }, config);
    const created = await engine.execute(
      ctx,
      { type: "CreateSession", trackId: "track-1", platform: "web" },
      config,
    );
    expect(created.state).toBe("Created");
    expect(created.sessionId).toBeDefined();

    const activated = await engine.execute(
      ctx,
      { type: "HeartbeatSession", sessionId: created.sessionId!, positionSeconds: 0 },
      config,
    );
    expect(activated.state).toBe("Active");
    expect(activated.events).toContain("SessionActivated");

    const heartbeat = await engine.execute(
      ctx,
      { type: "HeartbeatSession", sessionId: created.sessionId!, positionSeconds: 15 },
      config,
    );
    expect(heartbeat.state).toBe("Heartbeat");
    expect(heartbeat.events).toContain("PlaybackHeartbeat");

    const suspended = await engine.execute(
      ctx,
      { type: "SuspendSession", sessionId: created.sessionId! },
      config,
    );
    expect(suspended.state).toBe("Suspended");
    expect(suspended.events).toContain("SessionSuspended");

    const resumed = await engine.execute(
      ctx,
      { type: "ResumeSession", sessionId: created.sessionId! },
      config,
    );
    expect(resumed.state).toBe("Active");
    expect(resumed.events).toContain("SessionActivated");

    const closed = await engine.execute(
      ctx,
      {
        type: "CloseSession",
        sessionId: created.sessionId!,
        positionSeconds: 170,
        totalDurationSeconds: 180,
      },
      config,
    );
    expect(closed.state).toBe("Closed");
    expect(closed.isValidListen).toBe(true);
    expect(closed.events).toContain("StreamValidated");
    expect(closed.events).toContain("SessionClosed");
  });

  it("refuse heartbeat si session_engine heartbeat flag OFF", async () => {
    const repo = new InMemorySessionRepository();
    const engine = createSessionEngine(repo, new InMemoryDomainEventPublisher());
    const config = sessionConfig({ sessionHeartbeatEnabled: false });

    const created = await engine.execute(
      ctx,
      { type: "CreateSession", trackId: "track-1" },
      config,
    );

    await expect(
      engine.execute(
        ctx,
        { type: "HeartbeatSession", sessionId: created.sessionId!, positionSeconds: 0 },
        config,
      ),
    ).rejects.toMatchObject({ code: "TRANSITION_REJECTED" });
  });

  it("expire une session avec flag expiration ON", async () => {
    const repo = new InMemorySessionRepository();
    const engine = createSessionEngine(repo, new InMemoryDomainEventPublisher());
    const config = sessionConfig();

    const created = await engine.execute(
      ctx,
      { type: "CreateSession", trackId: "track-1" },
      config,
    );

    const expired = await engine.execute(
      ctx,
      { type: "ExpireSession", sessionId: created.sessionId! },
      config,
    );
    expect(expired.state).toBe("Expired");
    expect(expired.events).toContain("SessionExpired");
  });

  it("recover émet SessionRecovered quand recovery ON", async () => {
    const repo = new InMemorySessionRepository();
    const engine = createSessionEngine(repo, new InMemoryDomainEventPublisher());
    const config = sessionConfig();

    const created = await engine.execute(
      ctx,
      { type: "CreateSession", trackId: "track-1" },
      config,
    );
    await engine.execute(
      ctx,
      { type: "HeartbeatSession", sessionId: created.sessionId!, positionSeconds: 1 },
      config,
    );
    await engine.execute(ctx, { type: "SuspendSession", sessionId: created.sessionId! }, config);

    const recovered = await engine.execute(
      ctx,
      { type: "RecoverSession", sessionId: created.sessionId! },
      config,
    );
    expect(recovered.events).toContain("SessionRecovered");
  });

  it("refuse accès cross-user (ownership)", async () => {
    const repo = new InMemorySessionRepository();
    const engine = createSessionEngine(repo, new InMemoryDomainEventPublisher());
    const config = sessionConfig();

    const created = await engine.execute(
      ctx,
      { type: "CreateSession", trackId: "track-1" },
      config,
    );

    const otherCtx = createRuntimeContext({ actorId: "user-2", correlationId: "corr-2" });
    await expect(
      engine.execute(
        otherCtx,
        { type: "HeartbeatSession", sessionId: created.sessionId!, positionSeconds: 0 },
        config,
      ),
    ).rejects.toMatchObject({ code: "NOT_AUTHORIZED" });
  });

  it("invalidate ferme sans valid listen", async () => {
    const repo = new InMemorySessionRepository();
    const engine = createSessionEngine(repo, new InMemoryDomainEventPublisher());
    const config = sessionConfig();

    const created = await engine.execute(
      ctx,
      { type: "CreateSession", trackId: "track-1" },
      config,
    );

    const result = await engine.execute(
      ctx,
      { type: "InvalidateSession", sessionId: created.sessionId!, reason: "fraud" },
      config,
    );
    expect(result.state).toBe("Closed");
    expect(result.isValidListen).toBe(false);
  });

  it("close invalid listen émet StreamRejected", async () => {
    const repo = new InMemorySessionRepository();
    const engine = createSessionEngine(repo, new InMemoryDomainEventPublisher());
    const config = sessionConfig();

    const created = await engine.execute(
      ctx,
      { type: "CreateSession", trackId: "track-1" },
      config,
    );
    await engine.execute(
      ctx,
      { type: "HeartbeatSession", sessionId: created.sessionId!, positionSeconds: 10 },
      config,
    );

    const closed = await engine.execute(
      ctx,
      {
        type: "CloseSession",
        sessionId: created.sessionId!,
        positionSeconds: 20,
        totalDurationSeconds: 180,
      },
      config,
    );
    expect(closed.isValidListen).toBe(false);
    expect(closed.events).toContain("StreamRejected");
  });

  it("isReady false quand session engine flag OFF", () => {
    const engine = createSessionEngine(
      new InMemorySessionRepository(),
      new InMemoryDomainEventPublisher(),
    );
    expect(engine.isReady(sessionConfig({ sessionEngineEnabled: false }))).toBe(false);
    expect(engine.isReady(sessionConfig())).toBe(true);
  });

  it("n émet pas si eventsEnabled false", async () => {
    const bus = { publish: vi.fn().mockResolvedValue(undefined) };
    const engine = createSessionEngine(new InMemorySessionRepository(), bus);
    const config = sessionConfig({ eventsEnabled: false });

    await engine.execute(ctx, { type: "AuthenticateSession" }, config);
    expect(bus.publish).not.toHaveBeenCalled();
  });

  it("ActivateSession délègue au premier heartbeat", async () => {
    const engine = createSessionEngine(
      new InMemorySessionRepository(),
      new InMemoryDomainEventPublisher(),
    );
    const config = sessionConfig();
    const created = await engine.execute(
      ctx,
      { type: "CreateSession", trackId: "track-1" },
      config,
    );
    const activated = await engine.execute(
      ctx,
      { type: "ActivateSession", sessionId: created.sessionId! },
      config,
    );
    expect(activated.state).toBe("Active");
  });

  it("expire et recover refusés si flags OFF", async () => {
    const engine = createSessionEngine(
      new InMemorySessionRepository(),
      new InMemoryDomainEventPublisher(),
    );
    const created = await engine.execute(
      ctx,
      { type: "CreateSession", trackId: "track-1" },
      sessionConfig(),
    );
    await expect(
      engine.execute(
        ctx,
        { type: "ExpireSession", sessionId: created.sessionId! },
        sessionConfig({ sessionExpirationEnabled: false }),
      ),
    ).rejects.toMatchObject({ code: "TRANSITION_REJECTED" });
    await expect(
      engine.execute(
        ctx,
        { type: "RecoverSession", sessionId: created.sessionId! },
        sessionConfig({ sessionRecoveryEnabled: false }),
      ),
    ).rejects.toMatchObject({ code: "TRANSITION_REJECTED" });
  });

  it("refuse heartbeat en pause", async () => {
    const engine = createSessionEngine(
      new InMemorySessionRepository(),
      new InMemoryDomainEventPublisher(),
    );
    const config = sessionConfig();
    const created = await engine.execute(
      ctx,
      { type: "CreateSession", trackId: "track-1" },
      config,
    );
    await engine.execute(
      ctx,
      { type: "HeartbeatSession", sessionId: created.sessionId!, positionSeconds: 1 },
      config,
    );
    await engine.execute(ctx, { type: "SuspendSession", sessionId: created.sessionId! }, config);
    await expect(
      engine.execute(
        ctx,
        { type: "HeartbeatSession", sessionId: created.sessionId!, positionSeconds: 2 },
        config,
      ),
    ).rejects.toMatchObject({ code: "TRANSITION_REJECTED" });
  });

  it("refuse invalidate sur session déjà fermée", async () => {
    const repo = new InMemorySessionRepository();
    const engine = createSessionEngine(repo, new InMemoryDomainEventPublisher());
    const config = sessionConfig();
    const created = await engine.execute(
      ctx,
      { type: "CreateSession", trackId: "track-1" },
      config,
    );
    await engine.execute(
      ctx,
      { type: "InvalidateSession", sessionId: created.sessionId!, reason: "x" },
      config,
    );
    await expect(
      engine.execute(
        ctx,
        { type: "InvalidateSession", sessionId: created.sessionId!, reason: "x" },
        config,
      ),
    ).rejects.toMatchObject({ code: "TRANSITION_REJECTED" });
  });

  it("ferme depuis état Heartbeat overlay", async () => {
    const repo = new InMemorySessionRepository();
    const engine = createSessionEngine(repo, new InMemoryDomainEventPublisher());
    const config = sessionConfig();
    const created = await engine.execute(
      ctx,
      { type: "CreateSession", trackId: "track-1" },
      config,
    );
    await engine.execute(
      ctx,
      { type: "HeartbeatSession", sessionId: created.sessionId!, positionSeconds: 5 },
      config,
    );
    await engine.execute(
      ctx,
      { type: "HeartbeatSession", sessionId: created.sessionId!, positionSeconds: 15 },
      config,
    );
    const closed = await engine.execute(
      ctx,
      {
        type: "CloseSession",
        sessionId: created.sessionId!,
        positionSeconds: 170,
        totalDurationSeconds: 180,
      },
      config,
    );
    expect(closed.state).toBe("Closed");
  });

  it("getDerivedState lit le repository", async () => {
    const repo = new InMemorySessionRepository();
    const engine = createSessionEngine(repo, new InMemoryDomainEventPublisher());
    const sessionId = await repo.openSession({
      actorId: "user-1",
      trackId: "track-1",
      platform: "web",
    });
    const session = await repo.findById(sessionId, "user-1");
    expect(engine.getDerivedState(sessionId, session)).toBe("Created");
  });

  it("expose helpers de subtype et first heartbeat", () => {
    const session = {
      id: "s",
      user_id: "u",
      track_id: "t",
      track_file_id: null,
      device_id: null,
      platform: "web" as const,
      quality_kbps: null,
      started_at: new Date().toISOString(),
      last_heartbeat_at: new Date().toISOString(),
      completed_at: null,
      total_listened_seconds: 0,
      total_duration_seconds: 100,
      listen_percentage: 0,
      is_valid_listen: false,
      fraud_flags: [],
      ip_address: null,
      user_agent: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    expect(sessionIsFirstHeartbeat(session)).toBe(true);
    expect(resolveClosedSubtype({ ...session, is_valid_listen: true })).toBe("Completed_Valid");
  });
});
