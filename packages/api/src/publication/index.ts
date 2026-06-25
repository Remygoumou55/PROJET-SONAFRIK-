import { PersistenceContainer } from "@sonafrik/persistence";
import {
  createMetadataApplicationService,
  type MetadataApplicationService,
} from "../metadata/application/services";
import { createPublicationOrchestrator, PublicationOrchestrator } from "./orchestrator";
import type { PublicationPipelineStepHandler } from "./pipeline";
import type {
  IdempotencyStore,
  PublicationEventPublisher,
  PublicationOrchestratorPorts,
} from "./ports";
import { InMemoryPublicationEventPublisher } from "./ports";

function metadataPortsFromContainer(container: PersistenceContainer) {
  return {
    repositories: container.getRepositories(),
    transactionManager: container.getTransactionManager(),
  };
}

export function createPublicationOrchestratorFromContainer(
  container: PersistenceContainer,
  events?: PublicationEventPublisher,
): PublicationOrchestrator {
  const metadataService = createMetadataApplicationService(container);
  return createPublicationOrchestrator(
    { metadataService },
    metadataPortsFromContainer(container),
    events,
  );
}

export function createInMemoryPublicationOrchestrator(
  events?: PublicationEventPublisher,
): PublicationOrchestrator {
  const container = new PersistenceContainer({ provider: "memory" });
  const metadataService = createMetadataApplicationService(container);
  return createPublicationOrchestrator(
    { metadataService },
    metadataPortsFromContainer(container),
    events ?? new InMemoryPublicationEventPublisher(),
  );
}

export function createPublicationOrchestratorWithService(
  metadataService: MetadataApplicationService,
  container: PersistenceContainer,
  events?: PublicationEventPublisher,
  idempotency?: IdempotencyStore,
  extraSteps?: readonly PublicationPipelineStepHandler[],
): PublicationOrchestrator {
  const ports: PublicationOrchestratorPorts = { metadataService };
  return createPublicationOrchestrator(
    ports,
    metadataPortsFromContainer(container),
    events,
    idempotency,
    extraSteps,
  );
}

export * from "./orchestrator";
export * from "./workflow";
export * from "./pipeline";
export * from "./transactions";
export * from "./errors";
export * from "./events";
export * from "./dto";
export * from "./ports";
export * from "./validators";
export * from "./integration";
export * from "./observability";
