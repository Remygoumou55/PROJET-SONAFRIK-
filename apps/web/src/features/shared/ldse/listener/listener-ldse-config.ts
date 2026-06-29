/** Clés cache LDSE — domaine listener (scaffold v1). */
export const LISTENER_LDSE_KEYS = {
  sidebar: (userId: string) => `listener:${userId}:sidebar`,
  libraryCounts: (userId: string) => `listener:${userId}:library-counts`,
  queue: (userId: string) => `listener:${userId}:queue`,
} as const;

/** Événements métier listener — Event Bus LDSE */
export const LISTENER_LDSE_EVENTS = {
  favoriteToggled: "listener.favorite.toggled",
  playlistUpdated: "listener.playlist.updated",
  playbackStarted: "listener.playback.started",
  libraryInvalidate: "listener.library.invalidate",
} as const;
