import type { SearchMetadataInput } from "../validators";

/** Queries — read-only */
export interface FindMetadataQuery {
  readonly type: "FindMetadata";
  readonly entityType: string;
  readonly entityId: string;
}

export interface SearchMetadataQuery {
  readonly type: "SearchMetadata";
  readonly filter: SearchMetadataInput;
}

export interface GetMetadataByIdQuery {
  readonly type: "GetMetadataById";
  readonly metadataId: string;
}

export interface GetMetadataStatusQuery {
  readonly type: "GetMetadataStatus";
  readonly metadataId: string;
}

export type MetadataQuery =
  | FindMetadataQuery
  | SearchMetadataQuery
  | GetMetadataByIdQuery
  | GetMetadataStatusQuery;
