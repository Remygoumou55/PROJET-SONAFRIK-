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

const FLAG_FETCH_TIMEOUT_MS = 5_000;

function mapListenFlags(
  rows: ReadonlyArray<{ name: string; enabled: boolean }>,
): ListenFeatureFlags {
  const byName = new Map(rows.map((row) => [row.name, row.enabled]));
  return {
    fullscreenPlayer: byName.get("listen_fullscreen_player") ?? false,
    queuePanel: byName.get("listen_queue_panel") ?? false,
    whatsappShare: byName.get("listen_whatsapp_share") ?? false,
    discoverMode: byName.get("listen_discover_mode") ?? false,
    synchronizedLyrics: byName.get("listen_synchronized_lyrics") ?? false,
  };
}

function hasResolvedListenFlags(flags: ListenFeatureFlags): boolean {
  return (
    flags.fullscreenPlayer ||
    flags.queuePanel ||
    flags.whatsappShare ||
    flags.discoverMode ||
    flags.synchronizedLyrics
  );
}

async function fetchListenFlagsFromTable(
  client: SonafrikSupabaseClient,
): Promise<ListenFeatureFlags | null> {
  const { data, error } = await client
    .from("feature_flags")
    .select("name, enabled")
    .in("name", [...LISTEN_FEATURE_FLAG_NAMES]);

  if (error || !data?.length) return null;
  return mapListenFlags(data as Array<{ name: string; enabled: boolean }>);
}

async function fetchListenFlagsFromRpc(
  client: SonafrikSupabaseClient,
): Promise<ListenFeatureFlags | null> {
  const { data, error } = await client.rpc("get_feature_flags");
  if (error || !data?.length) return null;

  const listenRows = (data as Array<{ name: string; enabled: boolean }>).filter((row) =>
    LISTEN_FEATURE_FLAG_NAMES.includes(row.name as (typeof LISTEN_FEATURE_FLAG_NAMES)[number]),
  );
  if (!listenRows.length) return null;
  return mapListenFlags(listenRows);
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const timeout = new Promise<T>((_, reject) => {
    setTimeout(() => reject(new Error("listen_flags_timeout")), ms);
  });
  return Promise.race([promise, timeout]);
}

export async function resolveListenFeatureFlags(
  client: SonafrikSupabaseClient,
): Promise<ListenFeatureFlags> {
  try {
    const tableFlags = await withTimeout(fetchListenFlagsFromTable(client), FLAG_FETCH_TIMEOUT_MS);
    if (tableFlags && hasResolvedListenFlags(tableFlags)) return tableFlags;
  } catch {
    // fallback RPC below
  }

  try {
    const rpcFlags = await withTimeout(fetchListenFlagsFromRpc(client), FLAG_FETCH_TIMEOUT_MS);
    if (rpcFlags && hasResolvedListenFlags(rpcFlags)) return rpcFlags;
  } catch {
    // defaults below
  }

  return DEFAULT_LISTEN_FEATURE_FLAGS;
}
