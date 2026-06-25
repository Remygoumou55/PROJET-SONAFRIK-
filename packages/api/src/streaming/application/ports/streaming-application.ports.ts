import type { StreamingRuntimeCoordinator } from "../../runtime";
import type { StreamingRuntimeConfig } from "../../integration/feature-flags";
import type { SessionRepositoryContract } from "../../contracts";

export interface StreamingApplicationPorts {
  readonly coordinator: StreamingRuntimeCoordinator;
  readonly config: StreamingRuntimeConfig;
  readonly sessionRepository?: SessionRepositoryContract;
}
