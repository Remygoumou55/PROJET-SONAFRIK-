import { PersistenceContainer } from "@sonafrik/persistence";
import type { ApplicationEventPublisher } from "../ports";
import { createMetadataApplicationService, MetadataApplicationService } from "./metadata-application.service";

export function createInMemoryMetadataApplicationService(
  events?: ApplicationEventPublisher,
): MetadataApplicationService {
  const container = new PersistenceContainer({ provider: "memory" });
  return createMetadataApplicationService(container, events);
}

export { createMetadataApplicationService, MetadataApplicationService } from "./metadata-application.service";
