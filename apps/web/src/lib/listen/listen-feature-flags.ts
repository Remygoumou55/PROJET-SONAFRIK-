import type { SonafrikSupabaseClient } from "@sonafrik/database";

export interface ListenFeatureFlags {
  readonly fullscreenPlayer: boolean;
  readonly queuePanel: boolean;
  readonly whatsappShare: boolean;
  readonly discoverMode: boolean;
  readonly synchronizedLyrics: boolean;
}

export const LISTEN_FEATURE_FLAG_NAMES = [
  "listen_fullscreen_player",
  "listen_queue_panel",
  "listen_whatsapp_share",
  "listen_discover_mode",
  "listen_synchronized_lyrics",
] as const;

export const DEFAULT_LISTEN_FEATURE_FLAGS: ListenFeatureFlags = {
  fullscreenPlayer: false,
  queuePanel: false,
  whatsappShare: false,
  discoverMode: false,
  synchronizedLyrics: false,
};

const FLAG_FETCH_TIMEOUT_MS = 2_500;

export async function resolveListenFeatureFlags(
  client: SonafrikSupabaseClient,
): Promise<ListenFeatureFlags> {
  try {
    const fetchFlags = client
      .from("feature_flags")
      .select("name, enabled")
      .in("name", [...LISTEN_FEATURE_FLAG_NAMES])
      .then(({ data, error }) => {
        if (error) throw error;
        const byName = new Map(
          (data ?? []).map((row) => [row.name as string, row.enabled as boolean]),
        );
        return {
          fullscreenPlayer: byName.get("listen_fullscreen_player") ?? false,
          queuePanel: byName.get("listen_queue_panel") ?? false,
          whatsappShare: byName.get("listen_whatsapp_share") ?? false,
          discoverMode: byName.get("listen_discover_mode") ?? false,
          synchronizedLyrics: byName.get("listen_synchronized_lyrics") ?? false,
        } satisfies ListenFeatureFlags;
      });

    const timeout = new Promise<ListenFeatureFlags>((_, reject) => {
      setTimeout(() => reject(new Error("listen_flags_timeout")), FLAG_FETCH_TIMEOUT_MS);
    });

    return await Promise.race([fetchFlags, timeout]);
  } catch {
    return DEFAULT_LISTEN_FEATURE_FLAGS;
  }
}
