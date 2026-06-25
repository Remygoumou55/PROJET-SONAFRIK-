import type { MetadataRecordInput } from "../validators";

/** Commands — mutate state only */
export interface CreateMetadataCommand {
  readonly type: "CreateMetadata";
  readonly payload: MetadataRecordInput;
}

export interface UpdateMetadataCommand {
  readonly type: "UpdateMetadata";
  readonly payload: MetadataRecordInput;
}

export interface ValidateMetadataCommand {
  readonly type: "ValidateMetadata";
  readonly metadataId: string;
}

export interface ReserveISRCCommand {
  readonly type: "ReserveISRC";
  readonly isrc: string;
}

export interface ReleaseISRCCommand {
  readonly type: "ReleaseISRC";
  readonly isrc: string;
}

export interface ArchiveMetadataCommand {
  readonly type: "ArchiveMetadata";
  readonly metadataId: string;
}

export interface RestoreMetadataCommand {
  readonly type: "RestoreMetadata";
  readonly versionId: string;
}

export type MetadataCommand =
  | CreateMetadataCommand
  | UpdateMetadataCommand
  | ValidateMetadataCommand
  | ReserveISRCCommand
  | ReleaseISRCCommand
  | ArchiveMetadataCommand
  | RestoreMetadataCommand;
