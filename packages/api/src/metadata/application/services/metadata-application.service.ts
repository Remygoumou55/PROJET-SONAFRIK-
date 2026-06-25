import { PersistenceContainer } from "@sonafrik/persistence";
import type { MetadataCommand } from "../commands";
import type { MetadataRecordDto, MetadataSearchResultDto, MetadataStatusDto, ISRCReservationDto } from "../dto";
import type { MetadataQuery } from "../queries";
import type { ApplicationContext, ApplicationEventPublisher } from "../ports";
import { InMemoryApplicationEventPublisher } from "../ports";
import {
  createUseCaseDeps,
  executeArchiveMetadata,
  executeCreateMetadata,
  executeFindMetadata,
  executeGetMetadataById,
  executeGetMetadataStatus,
  executeReleaseISRC,
  executeReserveISRC,
  executeRestoreMetadata,
  executeSearchMetadata,
  executeUpdateMetadata,
  executeValidateMetadata,
} from "../use-cases";

/** Sole authorized entry point to Metadata Platform from packages/api */
export class MetadataApplicationService {
  private readonly deps;

  constructor(
    container: PersistenceContainer,
    private readonly events: ApplicationEventPublisher = new InMemoryApplicationEventPublisher(),
  ) {
    this.deps = createUseCaseDeps(
      {
        repositories: container.getRepositories(),
        transactionManager: container.getTransactionManager(),
      },
      events,
    );
  }

  async executeCommand(
    ctx: ApplicationContext,
    command: MetadataCommand,
  ): Promise<MetadataRecordDto | ISRCReservationDto | void> {
    switch (command.type) {
      case "CreateMetadata":
        return executeCreateMetadata(this.deps, ctx, command);
      case "UpdateMetadata":
        return executeUpdateMetadata(this.deps, ctx, command);
      case "ValidateMetadata":
        return executeValidateMetadata(this.deps, ctx, command.metadataId);
      case "ReserveISRC":
        return executeReserveISRC(this.deps, ctx, command.isrc);
      case "ReleaseISRC":
        return executeReleaseISRC(this.deps, ctx, command.isrc);
      case "ArchiveMetadata":
        return executeArchiveMetadata(this.deps, ctx, command.metadataId);
      case "RestoreMetadata":
        return executeRestoreMetadata(this.deps, ctx, command.versionId);
      default: {
        const _exhaustive: never = command;
        return _exhaustive;
      }
    }
  }

  async executeQuery(
    ctx: ApplicationContext,
    query: MetadataQuery,
  ): Promise<MetadataRecordDto | MetadataRecordDto[] | MetadataSearchResultDto | MetadataStatusDto | null> {
    switch (query.type) {
      case "FindMetadata": {
        const result = await executeFindMetadata(
          this.deps.ports,
          ctx,
          query.entityType,
          query.entityId,
        );
        return result;
      }
      case "SearchMetadata":
        return executeSearchMetadata(this.deps.ports, ctx, query.filter);
      case "GetMetadataById":
        return executeGetMetadataById(this.deps.ports, ctx, query.metadataId);
      case "GetMetadataStatus":
        return executeGetMetadataStatus(this.deps.ports, ctx, query.metadataId);
      default: {
        const _exhaustive: never = query;
        return _exhaustive;
      }
    }
  }

  getEventPublisher(): ApplicationEventPublisher {
    return this.events;
  }
}

export function createMetadataApplicationService(
  container: PersistenceContainer,
  events?: ApplicationEventPublisher,
): MetadataApplicationService {
  return new MetadataApplicationService(container, events);
}
