import type {
  AlbumID,
  ArtistMetadataID,
  AuditMetadataID,
  CountryCode,
  DeliveryID,
  DistributionID,
  FingerprintID,
  ISRCValue,
  LanguageCode,
  MetadataID,
  ReleaseID,
  RoyaltyID,
  StorageID,
  TrackID,
  UPCValue,
  VersionID,
} from "./ids";
import type {
  DistributionStatus,
  FingerprintStatus,
  MetadataReleaseType,
  MetadataSource,
  MetadataStatus,
  MetadataValidationState,
  MetadataVersionAction,
  MetadataVisibility,
  MetadataEntityType,
  RoyaltyBindingStatus,
} from "./enums";

/** Base fields shared by all metadata domain records */
export interface MetadataRecordBase {
  id: MetadataID;
  status: MetadataStatus;
  source: MetadataSource;
  visibility: MetadataVisibility;
  validationState: MetadataValidationState;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface TrackMetadata extends MetadataRecordBase {
  trackId: TrackID;
  title: string;
  isrc: ISRCValue | null;
  durationSeconds: number | null;
  language: LanguageCode | null;
  explicit: boolean;
  genreIds: readonly string[];
}

export interface AlbumMetadata extends MetadataRecordBase {
  albumId: AlbumID;
  title: string;
  upc: UPCValue | null;
  releaseType: MetadataReleaseType;
  releaseDate: string | null;
  genreIds: readonly string[];
}

export interface ArtistMetadata extends MetadataRecordBase {
  artistMetadataId: ArtistMetadataID;
  creatorId: string;
  stageName: string;
  bio: string | null;
  countryCode: CountryCode | null;
  genreIds: readonly string[];
}

export interface ReleaseMetadata extends MetadataRecordBase {
  releaseId: ReleaseID;
  albumId: AlbumID | null;
  trackIds: readonly TrackID[];
  releaseType: MetadataReleaseType;
  releaseDate: string | null;
  territoryCodes: readonly CountryCode[];
}

export interface RoyaltyMetadata extends MetadataRecordBase {
  royaltyId: RoyaltyID;
  trackId: TrackID | null;
  albumId: AlbumID | null;
  bindingStatus: RoyaltyBindingStatus;
  poolSharePercent: number | null;
}

export interface DistributionMetadata extends MetadataRecordBase {
  distributionId: DistributionID;
  releaseId: ReleaseID;
  deliveryId: DeliveryID | null;
  distributionStatus: DistributionStatus;
  territoryCodes: readonly CountryCode[];
}

export interface FingerprintMetadata extends MetadataRecordBase {
  fingerprintId: FingerprintID;
  trackId: TrackID;
  fingerprintStatus: FingerprintStatus;
  hash: string | null;
  duplicateTrackId: TrackID | null;
}

export interface VersionMetadata extends MetadataRecordBase {
  versionId: VersionID;
  entityType: MetadataEntityType;
  entityId: string;
  action: MetadataVersionAction;
  snapshot: Readonly<Record<string, unknown>>;
}

export interface AuditMetadata extends MetadataRecordBase {
  auditMetadataId: AuditMetadataID;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  payload: Readonly<Record<string, unknown>>;
}

export interface StorageMetadata extends MetadataRecordBase {
  storageId: StorageID;
  bucket: string;
  path: string;
  mimeType: string;
  byteSize: number;
  checksum: string | null;
}

export interface DeliveryMetadata extends MetadataRecordBase {
  deliveryId: DeliveryID;
  distributionId: DistributionID;
  partnerCode: string;
  payloadFormat: string;
  deliveredAt: string | null;
}

/** Union of all metadata domain records — registry and repository contracts */
export type MetadataDomainRecord =
  | TrackMetadata
  | AlbumMetadata
  | ArtistMetadata
  | ReleaseMetadata
  | RoyaltyMetadata
  | DistributionMetadata
  | FingerprintMetadata
  | VersionMetadata
  | AuditMetadata
  | StorageMetadata
  | DeliveryMetadata;
