import type { MetadataID } from "@sonafrik/types";
import type { MetadataRecordDto, MetadataSearchResultDto, MetadataStatusDto } from "../dto";
import { mapPersistenceToApplication } from "../errors";
import { toMetadataRecordDto, toMetadataRecordDtos, toMetadataStatusDto } from "../mappers";
import type { ApplicationContext, MetadataApplicationPorts } from "../ports";
import { assertActor, toMetadataContext, toPersistenceContext } from "../ports";
import { validateSearchInput } from "../validators";

export async function executeFindMetadata(
  ports: MetadataApplicationPorts,
  ctx: ApplicationContext,
  entityType: string,
  entityId: string,
): Promise<MetadataRecordDto | null> {
  assertActor(ctx);
  try {
    const metaCtx = toMetadataContext(ctx);
    let record = null;
    if (entityType === "track") {
      record = await ports.repositories.metadata.findTrackMetadata(entityId, metaCtx);
    } else if (entityType === "album") {
      record = await ports.repositories.metadata.findAlbumMetadata(entityId, metaCtx);
    } else {
      const results = await ports.repositories.metadata.search(
        { entity_type: entityType, entity_id: entityId },
        toPersistenceContext(ctx),
        { limit: 1 },
      );
      record = results[0] ?? null;
    }
    return record ? toMetadataRecordDto(record) : null;
  } catch (e) {
    throw mapPersistenceToApplication(e);
  }
}

export async function executeSearchMetadata(
  ports: MetadataApplicationPorts,
  ctx: ApplicationContext,
  filter: unknown,
): Promise<MetadataSearchResultDto> {
  assertActor(ctx);
  try {
    const validated = validateSearchInput(filter);
    const queryFilter: Record<string, unknown> = {};
    if (validated.status) queryFilter.status = validated.status;
    if (validated.entityType) queryFilter.entity_type = validated.entityType;
    if (validated.creatorId) queryFilter.creator_id = validated.creatorId;
    const items = await ports.repositories.metadata.search(queryFilter, toPersistenceContext(ctx), {
      limit: validated.limit,
      offset: validated.offset,
    });
    const dtos = toMetadataRecordDtos(items);
    return { items: dtos, total: dtos.length };
  } catch (e) {
    throw mapPersistenceToApplication(e);
  }
}

export async function executeGetMetadataById(
  ports: MetadataApplicationPorts,
  ctx: ApplicationContext,
  metadataId: string,
): Promise<MetadataRecordDto | null> {
  assertActor(ctx);
  try {
    const record = await ports.repositories.metadata.findById(
      metadataId as MetadataID,
      toMetadataContext(ctx),
    );
    return record ? toMetadataRecordDto(record) : null;
  } catch (e) {
    throw mapPersistenceToApplication(e);
  }
}

export async function executeGetMetadataStatus(
  ports: MetadataApplicationPorts,
  ctx: ApplicationContext,
  metadataId: string,
): Promise<MetadataStatusDto | null> {
  assertActor(ctx);
  try {
    const record = await ports.repositories.metadata.findById(
      metadataId as MetadataID,
      toMetadataContext(ctx),
    );
    return record ? toMetadataStatusDto(record) : null;
  } catch (e) {
    throw mapPersistenceToApplication(e);
  }
}
