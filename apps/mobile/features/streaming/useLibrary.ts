import { useCallback, useEffect, useMemo, useState } from "react";
import { createStreamingService } from "@sonafrik/api/streaming";
import type { Favorite, LibraryItem, Playlist } from "@sonafrik/types";
import { getSupabaseMobileClient } from "../../lib/supabase";

export function useLibrary() {
  const streaming = useMemo(() => createStreamingService(getSupabaseMobileClient()), []);
  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLibrary = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [libraryItems, userPlaylists] = await Promise.all([
        streaming.getLibrary(),
        streaming.listPlaylists(),
      ]);
      setLibrary(libraryItems);
      setPlaylists(userPlaylists);
    } catch {
      setError("Impossible de charger la bibliothèque.");
    } finally {
      setIsLoading(false);
    }
  }, [streaming]);

  useEffect(() => {
    loadLibrary();
  }, [loadLibrary]);

  const toggleFavorite = useCallback(
    async (entityType: Favorite["entity_type"], entityId: string) => {
      try {
        const isFav = await streaming.toggleFavorite({ entityType, entityId });
        await loadLibrary();
        return isFav;
      } catch {
        return false;
      }
    },
    [streaming, loadLibrary],
  );

  const createPlaylist = useCallback(
    async (title: string) => {
      const playlist = await streaming.createPlaylist({ title, isPublic: false });
      await loadLibrary();
      return playlist;
    },
    [streaming, loadLibrary],
  );

  return { library, playlists, isLoading, error, toggleFavorite, createPlaylist, refresh: loadLibrary };
}
