export interface CreatedRelease {
  albumId: string;
  trackId: string;
  title: string;
  creatorId: string;
}

export interface WizardMetadataForm {
  genreId: string;
  language: string;
  lyrics: string;
  explicit: boolean;
}
