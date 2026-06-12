"use client";

import { useCallback, useEffect, useState } from "react";
import type { Favorite, LibraryItem, Playlist } from "@sonafrik/types";
import { useStreamingService } from "./useStreaming";

export function useLibrary() {
  const streaming = useStreamingService();
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
    async (title: string, description?: string, isPublic = false) => {
      try {
        const playlist = await streaming.createPlaylist({ title, description, isPublic });
        await loadLibrary();
        return playlist;
      } catch (err) {
        throw new Error(err instanceof Error ? err.message : "Impossible de créer la playlist.");
      }
    },
    [streaming, loadLibrary],
  );

  const deletePlaylist = useCallback(
    async (playlistId: string) => {
      try {
        await streaming.deletePlaylist(playlistId);
        await loadLibrary();
      } catch (err) {
        throw new Error(err instanceof Error ? err.message : "Impossible de supprimer la playlist.");
      }
    },
    [streaming, loadLibrary],
  );

  return {
    library,
    playlists,
    isLoading,
    error,
    toggleFavorite,
    createPlaylist,
    deletePlaylist,
    refresh: loadLibrary,
  };
}
