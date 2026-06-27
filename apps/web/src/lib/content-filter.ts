/** Filtre les contenus seed / test — masqués sur l’UI publique /listen. */
export function isValidContentName(name: string | null | undefined): boolean {
  if (!name || name.trim().length < 2) return false;

  const normalized = name.trim().toLowerCase();

  const testPatterns = [
    /^s12b?\s*\d*$/i,
    /^s\d+b?\s*(track|artiste|artiste live)?\s*\d*$/i,
    /^\d{8,}$/,
    /^(upd|test|seed|dev|dummy|fake|sample|placeholder)$/i,
    /^c\d+\s*[a-z]$/i,
    /^s12\s+track\s+\d+$/i,
    /^artiste\s+(test|live|seed)$/i,
  ];

  return !testPatterns.some((pattern) => pattern.test(normalized));
}

export function filterValidTracks<
  T extends { title?: string | null; artist_name?: string | null },
>(tracks: T[]): T[] {
  return tracks.filter((track) => {
    const titleValid = isValidContentName(track.title);
    const artistValid = !track.artist_name || isValidContentName(track.artist_name);
    return titleValid && artistValid;
  });
}

export function filterValidArtists<T extends { stage_name?: string | null }>(artists: T[]): T[] {
  return artists.filter((artist) => isValidContentName(artist.stage_name));
}

export function filterValidAlbums<T extends { title?: string | null }>(albums: T[]): T[] {
  return albums.filter((album) => isValidContentName(album.title));
}

export function filterValidPlaylists<T extends { title?: string | null }>(playlists: T[]): T[] {
  return playlists.filter((playlist) => isValidContentName(playlist.title));
}
