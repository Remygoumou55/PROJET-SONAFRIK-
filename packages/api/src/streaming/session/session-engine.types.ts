import type { SessionStateId } from "@sonafrik/types";
import type { StreamingDomainEventType } from "../events";

export interface SessionCommandResult {
  readonly sessionId?: string;
  readonly state: SessionStateId;
  readonly events: readonly StreamingDomainEventType[];
  readonly isValidListen?: boolean;
}
