import { describe, expect, it } from "vitest";
import type { IssuedSignedUrl } from "@sonafrik/types";
import type { SignedUrlRepositoryContract } from "../contracts/playback.contract";
import { buildRuntimeConfig, DEFAULT_STREAMING_RUNTIME_FLAGS } from "../integration/feature-flags";
import { createRuntimeContext } from "../runtime/streaming-runtime-context";
import { InMemoryDomainEventPublisher } from "../ports";
import { InMemorySessionRepository } from "../session/in-memory-session.repository";
import { createSessionEngine } from "../session/session-engine";
import {
  InMemoryPlaybackPositionRepository,
  InMemorySignedUrlRepository,
} from "./in-memory-playback.repository";
import { createPlaybackEngine } from "./playback-engine";

function playbackConfig(overrides: Partial<ReturnType<typeof buildRuntimeConfig>> = {}) {
  return {
    ...buildRuntimeConfig({
      ...DEFAULT_STREAMING_RUNTIME_FLAGS,
      runtimeEnabled: true,
      applicationLayerEnabled: true,
      portsEnabled: true,
      eventsEnabled: true,
      playbackEngineEnabled: true,
      playbackSignedUrlEnabled: true,
      playbackBufferEnabled: true,
      playbackRecoveryEnabled: true,
      playbackQualityEnabled: true,
      sessionEngineEnabled: true,
      sessionHeartbeatEnabled: true,
    }),
    dryRun: false,
    ...overrides,
  };
}

function createEngine() {
  const repo = new InMemorySessionRepository();
  const bus = new InMemoryDomainEventPublisher();
  const sessionEngine = createSessionEngine(repo, bus);
  const signedUrls = new InMemorySignedUrlRepository(repo);
  return {
    engine: createPlaybackEngine(
      signedUrls,
      new InMemoryPlaybackPositionRepository(),
      bus,
      sessionEngine,
    ),
    repo,
  };
}

const ctx = createRuntimeContext({ actorId: "user-1", correlationId: "pb-1" });

describe("PlaybackEngine — lifecycle", () => {
  it("exécute Prepare → Load → SignedUrl → Playing", async () => {
    const { engine } = createEngine();
    const config = playbackConfig();

    await engine.execute(ctx, { type: "PreparePlayback", trackId: "track-1", autoPlay: true }, config);
    await engine.execute(ctx, { type: "LoadTrack", trackId: "track-1" }, config);
    const loaded = await engine.execute(
      ctx,
      { type: "LoadSignedUrl", trackId: "track-1", platform: "web" },
      config,
    );
    expect(loaded.state).toBe("Buffering");
    expect(loaded.signedUrl).toBeDefined();

    const playing = await engine.execute(ctx, { type: "StartPlayback", autoPlay: true }, config);
    expect(playing.state).toBe("Playing");
    expect(playing.events).toContain("PlaybackStarted");
  });

  it("pause et resume sans casser la session", async () => {
    const { engine } = createEngine();
    const config = playbackConfig();
    await engine.execute(ctx, { type: "PreparePlayback", trackId: "track-1" }, config);
    await engine.execute(ctx, { type: "LoadTrack", trackId: "track-1" }, config);
    await engine.execute(ctx, { type: "LoadSignedUrl", trackId: "track-1" }, config);
    await engine.execute(ctx, { type: "StartPlayback", autoPlay: true }, config);

    const paused = await engine.execute(ctx, { type: "PausePlayback", positionSeconds: 42 }, config);
    expect(paused.state).toBe("Paused");

    const resumed = await engine.execute(ctx, { type: "ResumePlayback" }, config);
    expect(resumed.state).toBe("Playing");
    expect(resumed.events).toContain("PlaybackResumed");
  });

  it("change quality renouvelle URL sans nouvelle session", async () => {
    const { engine } = createEngine();
    const config = playbackConfig();
    await engine.execute(ctx, { type: "PreparePlayback", trackId: "track-1" }, config);
    await engine.execute(ctx, { type: "LoadTrack", trackId: "track-1" }, config);
    const loaded = await engine.execute(
      ctx,
      { type: "LoadSignedUrl", trackId: "track-1" },
      config,
    );
    const sessionId = loaded.sessionId;

    const changed = await engine.execute(
      ctx,
      { type: "ChangeQuality", qualityLevel: "high", positionSeconds: 10 },
      config,
    );
    expect(changed.sessionId).toBe(sessionId);
    expect(changed.signedUrl).toContain(sessionId!);
  });

  it("recovery réseau", async () => {
    const { engine } = createEngine();
    const config = playbackConfig();
    await engine.execute(ctx, { type: "PreparePlayback", trackId: "track-1" }, config);
    await engine.execute(ctx, { type: "LoadTrack", trackId: "track-1" }, config);
    await engine.execute(ctx, { type: "LoadSignedUrl", trackId: "track-1" }, config);
    await engine.execute(ctx, { type: "StartPlayback", autoPlay: true }, config);

    const lost = await engine.execute(ctx, { type: "ConnectionLost" }, config);
    expect(lost.state).toBe("Reconnecting");

    const recovered = await engine.execute(ctx, { type: "RecoverPlayback", wasPlaying: true }, config);
    expect(recovered.state).toBe("Playing");
    expect(recovered.events).toContain("ConnectionRecovered");
  });

  it("refuse si playback flag OFF", async () => {
    const { engine } = createEngine();
    await expect(
      engine.execute(
        ctx,
        { type: "PreparePlayback", trackId: "track-1" },
        playbackConfig({ playbackEngineEnabled: false }),
      ),
    ).rejects.toMatchObject({ code: "TRANSITION_REJECTED" });
  });

  it("isReady false quand engine flag OFF", () => {
    const { engine } = createEngine();
    expect(engine.isReady(playbackConfig())).toBe(true);
    expect(engine.isReady(playbackConfig({ playbackEngineEnabled: false }))).toBe(false);
  });

  it("seek, stop, track ended et buffer events", async () => {
    const { engine } = createEngine();
    const config = playbackConfig();
    await engine.execute(ctx, { type: "PreparePlayback", trackId: "track-1" }, config);
    await engine.execute(ctx, { type: "LoadTrack", trackId: "track-1" }, config);
    await engine.execute(ctx, { type: "LoadSignedUrl", trackId: "track-1" }, config);
    await engine.execute(ctx, { type: "StartPlayback", autoPlay: true }, config);

    const seeking = await engine.execute(ctx, { type: "SeekPlayback", positionSeconds: 30 }, config);
    expect(seeking.state).toBe("Seeking");

    const seeked = await engine.execute(
      ctx,
      { type: "SeekCompleted", positionSeconds: 30 },
      config,
    );
    expect(seeked.state).toBe("Playing");
    expect(seeked.events).toContain("PlaybackSeeked");

    const ended = await engine.execute(
      ctx,
      { type: "TrackEnded", positionSeconds: 180, totalDurationSeconds: 180 },
      config,
    );
    expect(ended.state).toBe("Completed");

    await engine.execute(ctx, { type: "PreparePlayback", trackId: "track-2" }, config);
    await engine.execute(ctx, { type: "LoadTrack", trackId: "track-2" }, config);
    await engine.execute(ctx, { type: "LoadSignedUrl", trackId: "track-2" }, config);
    await engine.execute(ctx, { type: "BufferFilled", autoPlay: true }, config);
    expect(engine.getState(ctx.correlationId)).toBe("Playing");

    await engine.execute(ctx, { type: "StopPlayback" }, config);
    expect(engine.getState(ctx.correlationId)).toBe("Idle");
  });

  it("nextTrack et erreurs buffer/audio", async () => {
    const { engine } = createEngine();
    const config = playbackConfig();
    await engine.execute(ctx, { type: "PreparePlayback", trackId: "track-1" }, config);
    await engine.execute(ctx, { type: "LoadTrack", trackId: "track-1" }, config);
    await engine.execute(ctx, { type: "LoadSignedUrl", trackId: "track-1" }, config);
    await engine.execute(ctx, { type: "StartPlayback", autoPlay: true }, config);

    const next = await engine.execute(ctx, { type: "NextTrack", trackId: "track-2" }, config);
    expect(next.state).toBe("Preparing");

    await engine.execute(ctx, { type: "LoadTrack", trackId: "track-2" }, config);
    await engine.execute(ctx, { type: "LoadSignedUrl", trackId: "track-2" }, config);
    await engine.execute(ctx, { type: "StartPlayback", autoPlay: true }, config);

    const buffering = await engine.execute(ctx, { type: "BufferEmpty" }, config);
    expect(buffering.state).toBe("Buffering");
    await engine.execute(ctx, { type: "BufferFilled", autoPlay: true }, config);

    const failed = await engine.execute(ctx, { type: "AudioError", reason: "decode" }, config);
    expect(failed.state).toBe("Error");
  });

  it("previousTrack et transition invalide", async () => {
    const { engine } = createEngine();
    const config = playbackConfig();
    await engine.execute(ctx, { type: "PreparePlayback", trackId: "track-1" }, config);
    await engine.execute(ctx, { type: "LoadTrack", trackId: "track-1" }, config);
    await engine.execute(ctx, { type: "LoadSignedUrl", trackId: "track-1" }, config);
    await engine.execute(ctx, { type: "StartPlayback", autoPlay: true }, config);

    const prev = await engine.execute(ctx, { type: "PreviousTrack", trackId: "track-0" }, config);
    expect(prev.state).toBe("Preparing");

    await expect(
      engine.execute(ctx, { type: "PreparePlayback", trackId: "track-9" }, config),
    ).rejects.toMatchObject({ code: "TRANSITION_REJECTED" });
  });

  it("refuse signed url, buffer, recovery et quality quand flags OFF", async () => {
    const { engine } = createEngine();
    const base = playbackConfig();
    await engine.execute(ctx, { type: "PreparePlayback", trackId: "track-1" }, base);
    await engine.execute(ctx, { type: "LoadTrack", trackId: "track-1" }, base);

    await expect(
      engine.execute(
        ctx,
        { type: "LoadSignedUrl", trackId: "track-1" },
        playbackConfig({ playbackSignedUrlEnabled: false }),
      ),
    ).rejects.toMatchObject({ code: "TRANSITION_REJECTED" });

    await engine.execute(ctx, { type: "LoadSignedUrl", trackId: "track-1" }, base);
    await engine.execute(ctx, { type: "StartPlayback", autoPlay: true }, base);

    await expect(
      engine.execute(ctx, { type: "BufferFilled", autoPlay: true }, playbackConfig({ playbackBufferEnabled: false })),
    ).rejects.toMatchObject({ code: "TRANSITION_REJECTED" });

    await engine.execute(ctx, { type: "ConnectionLost" }, base);
    await expect(
      engine.execute(ctx, { type: "RecoverPlayback", wasPlaying: true }, playbackConfig({ playbackRecoveryEnabled: false })),
    ).rejects.toMatchObject({ code: "TRANSITION_REJECTED" });

    await expect(
      engine.execute(
        ctx,
        { type: "ChangeQuality", qualityLevel: "low", positionSeconds: 0 },
        playbackConfig({ playbackQualityEnabled: false }),
      ),
    ).rejects.toMatchObject({ code: "TRANSITION_REJECTED" });
  });

  it("Ready sans autoplay, timeouts et signed URL invalide", async () => {
    const { engine } = createEngine();
    const config = playbackConfig();
    await engine.execute(ctx, { type: "PreparePlayback", trackId: "track-1", autoPlay: false }, config);
    await engine.execute(ctx, { type: "LoadTrack", trackId: "track-1" }, config);
    await engine.execute(ctx, { type: "LoadSignedUrl", trackId: "track-1" }, config);
    const ready = await engine.execute(ctx, { type: "StartPlayback", autoPlay: false }, config);
    expect(ready.state).toBe("Ready");

    const playing = await engine.execute(ctx, { type: "StartPlayback", autoPlay: true }, config);
    expect(playing.state).toBe("Playing");

    await engine.execute(ctx, { type: "SeekPlayback", positionSeconds: 5 }, config);
    const seekFailed = await engine.execute(ctx, { type: "SeekFailed", reason: "stall" }, config);
    expect(seekFailed.state).toBe("Error");

    await engine.execute(ctx, { type: "PreparePlayback", trackId: "track-1" }, config);
    await engine.execute(ctx, { type: "LoadTrack", trackId: "track-1" }, config);
    await engine.execute(ctx, { type: "LoadSignedUrl", trackId: "track-1" }, config);
    await engine.execute(ctx, { type: "StartPlayback", autoPlay: true }, config);
    await engine.execute(ctx, { type: "ConnectionLost" }, config);
    const reconnectTimeout = await engine.execute(ctx, { type: "ReconnectTimeout" }, config);
    expect(reconnectTimeout.state).toBe("Error");
  });

  it("signed URL invalide déclenche StartStreamFailed", async () => {
    const invalidRepo: SignedUrlRepositoryContract = {
      issue: async (): Promise<IssuedSignedUrl> => ({
        sessionId: "s-invalid",
        signedUrl: "",
        expiresAt: new Date(0).toISOString(),
        durationSeconds: 180,
      }),
      renew: async () => ({
        sessionId: "s-invalid",
        signedUrl: "",
        expiresAt: new Date(0).toISOString(),
        durationSeconds: 180,
      }),
      validate: () => false,
    };
    const repo = new InMemorySessionRepository();
    const bus = new InMemoryDomainEventPublisher();
    const engine = createPlaybackEngine(
      invalidRepo,
      new InMemoryPlaybackPositionRepository(),
      bus,
      createSessionEngine(repo, bus),
    );
    const config = playbackConfig();
    await engine.execute(ctx, { type: "PreparePlayback", trackId: "track-1" }, config);
    await engine.execute(ctx, { type: "LoadTrack", trackId: "track-1" }, config);
    const failed = await engine.execute(ctx, { type: "LoadSignedUrl", trackId: "track-1" }, config);
    expect(failed.state).toBe("Error");
  });
});
