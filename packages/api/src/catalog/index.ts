export { CatalogService, createCatalogService } from "./catalog.service";
export { CatalogRepository } from "./catalog.repository";
export { CatalogError } from "./errors";
export {
  createAlbumSchema,
  updateAlbumSchema,
  createTrackSchema,
  updateTrackSchema,
  catalogAssetUploadSchema,
  setTrackCreditsSchema,
  trackCreditItemSchema,
} from "./schemas";
export type {
  CreateAlbumInput,
  UpdateAlbumInput,
  CreateTrackInput,
  UpdateTrackInput,
  CatalogAssetUploadInput,
  SetTrackCreditsInput,
  TrackCreditItem,
} from "./schemas";
