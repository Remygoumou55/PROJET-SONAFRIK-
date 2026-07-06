"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Favorite, LibraryItem, Playlist } from "@sonafrik/types";
import { ldseCache } from "@/features/shared/ldse/cache";
import { useLdseEvent } from "@/features/shared/ldse/LdseProvider";
import {
  LISTENER_LDSE_EVENTS,
  LISTENER_LDSE_KEYS,
} from "@/features/shared/ldse/listener/listener-ldse-config";
import { publishListenerLdseEvent } from "@/features/shared/ldse/listener/publishListenerLdseEvent";
import { useStreamingService } from "../hooks/useStreaming";
import {
  getListenerHubInvalidateEvents,
  shouldRefreshListenerLibrary,
} from "@sonafrik/realtime/adapters";
import { useEventSubscription } from "@sonafrik/realtime/react";

type LibraryLdseState = {
  library: LibraryItem[];
  playlists: Playlist[];
  isLoading: boolean;
  error: string | null;
  toggleFavorite: (entityType: Favorite["entity_type"], entityId: string) => Promise<boolean>;
  createPlaylist: (title: string, description?: string, isPublic?: boolean) => Promise<Playlist>;
  updatePlaylist: (
    playlistId: string,
    updates: { isPublic?: boolean; title?: string; description?: string },
  ) => Promise<Playlist>;
  deletePlaylist: (playlistId: string) => Promise<void>;
  refresh: () => Promise<void>;
};

const LibraryLdseContext = createContext<LibraryLdseState | null>(null);

type LibraryBundle = { library: LibraryItem[]; playlists: Playlist[] };

export function LibraryLdseProvider({
  userId,
  children,
}: {
  userId: string;
  children: ReactNode;
}) {
  const streaming = useStreamingService();
  const cacheKey = LISTENER_LDSE_KEYS.libraryFull(userId);

  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const commitBundle = useCallback(
    (bundle: LibraryBundle) => {
      ldseCache.set(cacheKey, bundle, 60_000);
      setLibrary(bundle.library);
      setPlaylists(bundle.playlists);
    },
    [cacheKey],
  );

  const loadLibrary = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const cached = ldseCache.get<LibraryBundle>(cacheKey);
      if (cached) {
        commitBundle(cached);
        setIsLoading(false);
      }
      const [libraryItems, userPlaylists] = await Promise.all([
        streaming.getLibrary(),
        streaming.listPlaylists(),
      ]);
      commitBundle({ library: libraryItems, playlists: userPlaylists });
    } catch {
      setError("Impossible de charger la bibliothèque.");
    } finally {
      setIsLoading(false);
    }
  }, [streaming, cacheKey, commitBundle]);

  useEffect(() => {
    void loadLibrary();
  }, [loadLibrary]);

  useLdseEvent(LISTENER_LDSE_EVENTS.libraryInvalidate, (event) => {
    if (event.payload?.userId === userId) void loadLibrary();
  });

  useEventSubscription(
    getListenerHubInvalidateEvents(),
    (event) => {
      if (shouldRefreshListenerLibrary(event, { userId })) void loadLibrary();
    },
    true,
  );

  const toggleFavorite = useCallback(
    async (entityType: Favorite["entity_type"], entityId: string) => {
      try {
        const isFav = await streaming.toggleFavorite({ entityType, entityId });
        setLibrary((prev) => {
          const next = isFav
            ? prev.find((i) => i.entity_id === entityId)
              ? prev
              : [...prev, { entity_type: entityType, entity_id: entityId } as LibraryItem]
            : prev.filter((i) => i.entity_id !== entityId);
          ldseCache.set(cacheKey, { library: next, playlists }, 60_000);
          return next;
        });
        publishListenerLdseEvent(LISTENER_LDSE_EVENTS.favoriteToggled, userId, {
          entityType,
          entityId,
          isFav,
        });
        return isFav;
      } catch {
        return false;
      }
    },
    [streaming, cacheKey, playlists, userId],
  );

  const createPlaylist = useCallback(
    async (title: string, description?: string, isPublic = false) => {
      const playlist = await streaming.createPlaylist({ title, description, isPublic });
      setPlaylists((prev) => {
        const next = [playlist, ...prev];
        ldseCache.set(cacheKey, { library, playlists: next }, 60_000);
        return next;
      });
      publishListenerLdseEvent(LISTENER_LDSE_EVENTS.playlistUpdated, userId, { action: "create" });
      return playlist;
    },
    [streaming, cacheKey, library, userId],
  );

  const deletePlaylist = useCallback(
    async (playlistId: string) => {
      await streaming.deletePlaylist(playlistId);
      setPlaylists((prev) => {
        const next = prev.filter((p) => p.id !== playlistId);
        ldseCache.set(cacheKey, { library, playlists: next }, 60_000);
        return next;
      });
      publishListenerLdseEvent(LISTENER_LDSE_EVENTS.playlistUpdated, userId, { action: "delete" });
    },
    [streaming, cacheKey, library, userId],
  );

  const updatePlaylist = useCallback(
    async (
      playlistId: string,
      updates: { isPublic?: boolean; title?: string; description?: string },
    ) => {
      const updated = await streaming.updatePlaylist(playlistId, updates);
      setPlaylists((prev) => {
        const next = prev.map((p) => (p.id === playlistId ? updated : p));
        ldseCache.set(cacheKey, { library, playlists: next }, 60_000);
        return next;
      });
      publishListenerLdseEvent(LISTENER_LDSE_EVENTS.playlistUpdated, userId, { action: "update" });
      return updated;
    },
    [streaming, cacheKey, library, userId],
  );

  const value = useMemo<LibraryLdseState>(
    () => ({
      library,
      playlists,
      isLoading,
      error,
      toggleFavorite,
      createPlaylist,
      updatePlaylist,
      deletePlaylist,
      refresh: loadLibrary,
    }),
    [
      library,
      playlists,
      isLoading,
      error,
      toggleFavorite,
      createPlaylist,
      updatePlaylist,
      deletePlaylist,
      loadLibrary,
    ],
  );

  return <LibraryLdseContext.Provider value={value}>{children}</LibraryLdseContext.Provider>;
}

/** SSOT bibliothèque — une seule instance par page (évite double fetch). */
export function useLibraryLdse(): LibraryLdseState {
  const ctx = useContext(LibraryLdseContext);
  if (!ctx) {
    throw new Error("useLibraryLdse must be used within LibraryLdseProvider");
  }
  return ctx;
}
