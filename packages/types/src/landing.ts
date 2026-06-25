/** Données publiques affichées sur la landing (aucune PII). */

export interface LandingFounderArtist {
  creatorId: string;
  stageName: string;
  slug: string;
  genre: string;
  initials: string;
  paletteIndex: number;
}

export interface LandingArtistsSection {
  artists: LandingFounderArtist[];
  trackCount: number;
  featuredTrack: {
    title: string;
    artistName: string;
    initials: string;
  } | null;
}
