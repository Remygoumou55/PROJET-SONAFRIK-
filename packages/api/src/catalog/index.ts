export { CatalogService, createCatalogService } from "./catalog.service";
export { CatalogRepository } from "./catalog.repository";
export { CatalogError } from "./errors";
export {
  createAlbumSchema,
  updateAlbumSchema,
  createTrackSchema,
  updateTrackSchema,
  catalogAssetUploadSchema,
} from "./schemas";
export type {
  CreateAlbumInput,
  UpdateAlbumInput,
  CreateTrackInput,
  UpdateTrackInput,
  CatalogAssetUploadInput,
} from "./schemas";
