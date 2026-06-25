import type { StreamingRuntimePorts } from "../ports";
import type { DomainEventPublisherPort } from "../ports";
import type { StreamingRuntimeConfig } from "../integration/feature-flags";
import { RuntimePipelineRegistry } from "./pipeline";

/** Dependency injection container for Streaming Runtime */
export interface StreamingRuntimeDependencies {
  readonly ports: StreamingRuntimePorts;
  readonly events: DomainEventPublisherPort;
  readonly pipeline: RuntimePipelineRegistry;
  readonly config: StreamingRuntimeConfig;
}

export function createRuntimeDependencies(
  deps: StreamingRuntimeDependencies,
): StreamingRuntimeDependencies {
  return deps;
}
