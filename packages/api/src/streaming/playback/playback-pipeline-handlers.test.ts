import { describe, expect, it } from "vitest";
import { buildRuntimeConfig, DEFAULT_STREAMING_RUNTIME_FLAGS } from "../integration/feature-flags";
import { createEmptyPipelineRegistry } from "../runtime/pipeline";
import { createRuntimeContext } from "../runtime/streaming-runtime-context";
import { InMemoryDomainEventPublisher } from "../ports";
import { InMemorySessionRepository } from "../session/in-memory-session.repository";
import { createSessionEngine } from "../session/session-engine";
import {
  InMemoryPlaybackPositionRepository,
  InMemorySignedUrlRepository,
} from "./in-memory-playback.repository";
import { createPlaybackEngine } from "./playback-engine";
import { registerPlaybackPipelineHandlers } from "./playback-pipeline-handlers";

describe("playback-pipeline-handlers", () => {
  it("enregistre DispatchPlaybackCommand", () => {
    const registry = createEmptyPipelineRegistry();
    const repo = new InMemorySessionRepository();
    const bus = new InMemoryDomainEventPublisher();
    const sessionEngine = createSessionEngine(repo, bus);
    const engine = createPlaybackEngine(
      new InMemorySignedUrlRepository(repo),
      new InMemoryPlaybackPositionRepository(),
      bus,
      sessionEngine,
    );
    registerPlaybackPipelineHandlers(registry, engine);
    expect(registry.list()).toContain("DispatchPlaybackCommand");
  });

  it("dispatch PreparePlayback quand flags ON", async () => {
    const registry = createEmptyPipelineRegistry();
    const repo = new InMemorySessionRepository();
    const bus = new InMemoryDomainEventPublisher();
    const sessionEngine = createSessionEngine(repo, bus);
    const engine = createPlaybackEngine(
      new InMemorySignedUrlRepository(repo),
      new InMemoryPlaybackPositionRepository(),
      bus,
      sessionEngine,
    );
    registerPlaybackPipelineHandlers(registry, engine);

    const config = buildRuntimeConfig({
      ...DEFAULT_STREAMING_RUNTIME_FLAGS,
      runtimeEnabled: true,
      applicationLayerEnabled: true,
      portsEnabled: true,
      playbackEngineEnabled: true,
    });

    const result = await registry.dispatch(
      "DispatchPlaybackCommand",
      createRuntimeContext({
        actorId: "user-1",
        correlationId: "c1",
        payload: { playbackCommand: { type: "PreparePlayback", trackId: "track-1" } },
      }),
      { ...config, dryRun: false },
    );
    expect(result.status).toBe("registered");
  });

  it("skip si playback engine OFF", async () => {
    const registry = createEmptyPipelineRegistry();
    registerPlaybackPipelineHandlers(
      registry,
      createPlaybackEngine(
        new InMemorySignedUrlRepository(),
        new InMemoryPlaybackPositionRepository(),
        new InMemoryDomainEventPublisher(),
        createSessionEngine(new InMemorySessionRepository(), new InMemoryDomainEventPublisher()),
      ),
    );
    const config = buildRuntimeConfig({
      ...DEFAULT_STREAMING_RUNTIME_FLAGS,
      runtimeEnabled: true,
      applicationLayerEnabled: true,
      portsEnabled: true,
      playbackEngineEnabled: false,
    });
    const result = await registry.dispatch(
      "DispatchPlaybackCommand",
      createRuntimeContext({
        actorId: "u",
        correlationId: "c",
        payload: { playbackCommand: { type: "PreparePlayback", trackId: "t" } },
      }),
      { ...config, dryRun: false },
    );
    expect(result.status).toBe("skipped");
  });

  it("throw si playbackCommand manquant", async () => {
    const registry = createEmptyPipelineRegistry();
    const engine = createPlaybackEngine(
      new InMemorySignedUrlRepository(),
      new InMemoryPlaybackPositionRepository(),
      new InMemoryDomainEventPublisher(),
      createSessionEngine(new InMemorySessionRepository(), new InMemoryDomainEventPublisher()),
    );
    registerPlaybackPipelineHandlers(registry, engine);
    const config = buildRuntimeConfig({
      ...DEFAULT_STREAMING_RUNTIME_FLAGS,
      runtimeEnabled: true,
      applicationLayerEnabled: true,
      portsEnabled: true,
      playbackEngineEnabled: true,
    });
    await expect(
      registry.dispatch(
        "DispatchPlaybackCommand",
        createRuntimeContext({ actorId: "u", correlationId: "c" }),
        { ...config, dryRun: false },
      ),
    ).rejects.toMatchObject({ code: "CONTEXT_INVALID" });
  });
});
