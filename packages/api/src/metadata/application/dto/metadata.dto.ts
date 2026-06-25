/** Application DTOs — never expose domain entities directly */

export interface MetadataRecordDto {
  readonly id: string;
  readonly entityType: string;
  readonly entityId: string;
  readonly status: string;
  readonly source: string;
  readonly visibility: string;
  readonly validationState: string;
  readonly version: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface MetadataStatusDto {
  readonly id: string;
  readonly status: string;
  readonly validationState: string;
  readonly version: number;
}

export interface MetadataSearchResultDto {
  readonly items: readonly MetadataRecordDto[];
  readonly total: number;
}

export interface ISRCReservationDto {
  readonly isrc: string;
  readonly status: string;
  readonly reservedBy: string | null;
  readonly reservedAt: string | null;
  readonly updatedAt: string;
}
