/** Branded identifiers — Metadata Engine Phase 1 */

export type MetadataID = string & { readonly __brand: "MetadataID" };
export type TrackID = string & { readonly __brand: "TrackID" };
export type AlbumID = string & { readonly __brand: "AlbumID" };
export type ReleaseID = string & { readonly __brand: "ReleaseID" };
export type DistributionID = string & { readonly __brand: "DistributionID" };
export type RoyaltyID = string & { readonly __brand: "RoyaltyID" };
export type VersionID = string & { readonly __brand: "VersionID" };
export type FingerprintID = string & { readonly __brand: "FingerprintID" };
export type DeliveryID = string & { readonly __brand: "DeliveryID" };
export type StorageID = string & { readonly __brand: "StorageID" };
export type ArtistMetadataID = string & { readonly __brand: "ArtistMetadataID" };
export type AuditMetadataID = string & { readonly __brand: "AuditMetadataID" };

export type ISRCValue = string & { readonly __brand: "ISRCValue" };
export type UPCValue = string & { readonly __brand: "UPCValue" };
export type CountryCode = string & { readonly __brand: "CountryCode" };
export type LanguageCode = string & { readonly __brand: "LanguageCode" };
