import type { PlaybackCommand } from "./playback.commands";
import { isPlaybackEngineActive } from "../runtime/streaming-runtime-config";
import { RuntimeContextInvalidError } from "../runtime-errors";
import type {
  RuntimePipelineHandler,
  RuntimePipelineHandlerResult,
} from "../runtime/pipeline";
import type { PlaybackEngine } from "./playback-engine";

function ok(message: string): RuntimePipelineHandlerResult {
  return {
    handler: "DispatchPlaybackCommand",
    status: "registered",
    message,
  };
}

export function createPlaybackPipelineHandlers(engine: PlaybackEngine): RuntimePipelineHandler[] {
  return [
    {
      name: "DispatchPlaybackCommand",
      canHandle: (config) => isPlaybackEngineActive(config),
      handle: async (ctx, config) => {
        const command = ctx.payload?.playbackCommand as PlaybackCommand | undefined;
        if (!command?.type) {
          throw new RuntimeContextInvalidError("playbackCommand requis");
        }
        const result = await engine.execute(ctx, command, config);
        return ok(`Playback ${command.type} → ${result.state}`);
      },
    },
  ];
}

export function registerPlaybackPipelineHandlers(
  registry: { register: (handler: RuntimePipelineHandler) => void },
  engine: PlaybackEngine,
): void {
  for (const handler of createPlaybackPipelineHandlers(engine)) {
    registry.register(handler);
  }
}
