export interface ListenerHomepageCurated {
  playlists: Array<{ id: string; title: string; track_count: number }>;
  artists: Array<{ creator_id: string; stage_name: string; genres: string[] }>;
  genres: Array<{ id: string; name: string }>;
}

export interface ListenerAlbumMeta {
  title: string;
  artistName: string | null;
}

export interface ListenerAlbumDetail {
  id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  release_type: string;
  release_date: string | null;
  creator_id: string;
  artist_name: string | null;
  artist_creator_id: string;
}

export interface ListenerArtistProfile {
  creator_id: string;
  stage_name: string;
  bio: string | null;
  genres: string[];
  cover_path: string | null;
  banner_path: string | null;
  verified: boolean;
}

export interface ListenerArtistRelease {
  id: string;
  title: string;
  release_type: string;
  cover_url: string | null;
  release_date: string | null;
}

export interface ListenerPlaylistTrackRow {
  track_id: string;
  position: number;
  added_at: string;
  added_by: string | null;
  track: {
    id: string;
    title: string;
    duration_seconds: number | null;
    creator_id: string;
    album_id: string | null;
  } | null;
}
