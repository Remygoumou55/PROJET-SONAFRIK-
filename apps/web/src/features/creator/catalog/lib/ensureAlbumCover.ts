import {
  generateDefaultArtwork,
  type CatalogService,
} from "@sonafrik/api/catalog";

export async function ensureAlbumHasCover(
  catalog: CatalogService,
  input: {
    albumId: string;
    creatorId: string;
    trackTitle: string;
    artistName: string;
  },
): Promise<void> {
  const album = await catalog.getAlbum(input.albumId);
  if (album.cover_path?.trim()) return;

  const { blob, contentType } = await generateDefaultArtwork({
    trackTitle: input.trackTitle,
    artistName: input.artistName,
  });

  await catalog.uploadCoverBlob({
    creatorId: input.creatorId,
    albumId: input.albumId,
    blob,
    contentType,
    source: "auto",
  });
}
