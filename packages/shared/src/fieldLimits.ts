/** Limites de longueur des champs — import direct pour éviter le barrel webpack client. */
export const FIELD_LIMITS = {
  FULL_NAME: 80,
  BIO: 300,
  STAGE_NAME: 100,
  ARTIST_BIO: 300,
  ALBUM_TITLE: 100,
  TRACK_TITLE: 100,
  LABEL_NAME: 80,
  LABEL_DESCRIPTION: 300,
  CITY: 80,
  PLAYLIST_TITLE: 60,
  PLAYLIST_DESCRIPTION: 200,
} as const;
