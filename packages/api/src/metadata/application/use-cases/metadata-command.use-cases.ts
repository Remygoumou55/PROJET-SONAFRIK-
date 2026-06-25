import type { MetadataDomainRecord, MetadataID, VersionID } from "@sonafrik/types";
import { METADATA_STATUS, METADATA_VALIDATION_STATE } from "@sonafrik/types";
import type { CreateMetadataCommand, UpdateMetadataCommand } from "../commands";
import type { MetadataRecordDto } from "../dto";
import { ApplicationNotFoundError, mapPersistenceToApplication } from "../errors";
import { metadataArchivedEvent, metadataCreatedEvent, metadataRestoredEvent, metadataValidatedEvent } from "../events";
import { toMetadataRecordDto } from "../mappers";
import type { ApplicationContext, ApplicationEventPublisher, MetadataApplicationPorts } from "../ports";
import { assertActor, toMetadataContext, toPersistenceContext } from "../ports";
import { inputToDomainRecord, validateMetadataInput } from "../validators";

export interface UseCaseDeps {
  readonly ports: MetadataApplicationPorts;
  readonly events: ApplicationEventPublisher;
}

export async function executeCreateMetadata(
  deps: UseCaseDeps,
  ctx: ApplicationContext,
  command: CreateMetadataCommand,
): Promise<MetadataRecordDto> {
  assertActor(ctx);
  try {
    const input = validateMetadataInput(command.payload);
    const record = inputToDomainRecord(input);
    const saved = await deps.ports.repositories.metadata.save(record, toPersistenceContext(ctx));
    await deps.events.publish(metadataCreatedEvent(ctx.actorId, ctx.correlationId, saved.id as string));
    return toMetadataRecordDto(saved);
  } catch (e) {
    throw mapPersistenceToApplication(e);
  }
}

export async function executeUpdateMetadata(
  deps: UseCaseDeps,
  ctx: ApplicationContext,
  command: UpdateMetadataCommand,
): Promise<MetadataRecordDto> {
  assertActor(ctx);
  try {
    const input = validateMetadataInput(command.payload);
    const record = inputToDomainRecord({ ...input, version: input.version + 1 });
    const saved = await deps.ports.repositories.metadata.save(record, toPersistenceContext(ctx));
    return toMetadataRecordDto(saved);
  } catch (e) {
    throw mapPersistenceToApplication(e);
  }
}

export async function executeArchiveMetadata(
  deps: UseCaseDeps,
  ctx: ApplicationContext,
  metadataId: string,
): Promise<void> {
  assertActor(ctx);
  try {
    await deps.ports.repositories.metadata.archive(metadataId as MetadataID, toPersistenceContext(ctx));
    await deps.events.publish(metadataArchivedEvent(ctx.actorId, ctx.correlationId, metadataId));
  } catch (e) {
    throw mapPersistenceToApplication(e);
  }
}

export async function executeValidateMetadata(
  deps: UseCaseDeps,
  ctx: ApplicationContext,
  metadataId: string,
): Promise<MetadataRecordDto> {
  assertActor(ctx);
  try {
    const existing = await deps.ports.repositories.metadata.findById(
      metadataId as MetadataID,
      toMetadataContext(ctx),
    );
    if (!existing) throw new ApplicationNotFoundError();
    const validated: MetadataDomainRecord = {
      ...existing,
      status: METADATA_STATUS.VALIDATED,
      validationState: METADATA_VALIDATION_STATE.PASSED,
      updatedAt: new Date().toISOString(),
      version: existing.version + 1,
    };
    const saved = await deps.ports.repositories.metadata.save(validated, toPersistenceContext(ctx));
    await deps.events.publish(metadataValidatedEvent(ctx.actorId, ctx.correlationId, metadataId));
    return toMetadataRecordDto(saved);
  } catch (e) {
    throw mapPersistenceToApplication(e);
  }
}

export async function executeRestoreMetadata(
  deps: UseCaseDeps,
  ctx: ApplicationContext,
  versionId: string,
): Promise<MetadataRecordDto> {
  assertActor(ctx);
  try {
    const version = await deps.ports.repositories.version.restore(
      versionId as VersionID,
      toPersistenceContext(ctx),
    );
    await deps.events.publish(
      metadataRestoredEvent(ctx.actorId, ctx.correlationId, version.entityId),
    );
    const record = await deps.ports.repositories.metadata.findById(
      version.entityId as MetadataID,
      toMetadataContext(ctx),
    );
    if (!record) throw mapPersistenceToApplication(new Error("not found"));
    return toMetadataRecordDto(record);
  } catch (e) {
    throw mapPersistenceToApplication(e);
  }
}
