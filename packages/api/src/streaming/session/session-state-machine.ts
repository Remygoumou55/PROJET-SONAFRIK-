import type { SessionStateId, SessionTransitionTrigger } from "@sonafrik/types";

export interface SessionTransitionResult {
  readonly allowed: boolean;
  readonly nextState: SessionStateId | null;
}

const TERMINAL: ReadonlySet<SessionStateId> = new Set(["Closed", "Expired"]);

/** Authorized transitions — STATE_MACHINE.md §5.2 */
const TRANSITIONS: Readonly<
  Record<SessionStateId | "Initial", Partial<Record<SessionTransitionTrigger, SessionStateId>>>
> = {
  Initial: {
    AuthValidated: "Authenticated",
  },
  Authenticated: {
    OpenSession: "Created",
  },
  Created: {
    FirstHeartbeat: "Active",
    StartTimeout: "Expired",
  },
  Active: {
    HeartbeatRecorded: "Heartbeat",
    PauseRecorded: "Suspended",
    CompleteValid: "Closed",
    CompleteInvalid: "Closed",
    FraudSuspected: "FraudReview",
    HeartbeatTimeout: "Expired",
  },
  Heartbeat: {
    HeartbeatRecorded: "Heartbeat",
    PauseRecorded: "Suspended",
    CompleteValid: "Closed",
    CompleteInvalid: "Closed",
    FraudSuspected: "FraudReview",
    HeartbeatTimeout: "Expired",
  },
  Suspended: {
    ResumeRecorded: "Active",
    CompleteValid: "Closed",
    CompleteInvalid: "Closed",
    HeartbeatTimeout: "Expired",
  },
  FraudReview: {
    FraudConfirmed: "Closed",
    FraudCleared: "Active",
  },
  Expired: {},
  Closed: {},
};

export function isTerminalSessionState(state: SessionStateId): boolean {
  return TERMINAL.has(state);
}

export function transitionSessionState(
  current: SessionStateId | "Initial",
  trigger: SessionTransitionTrigger,
): SessionTransitionResult {
  if (current !== "Initial" && isTerminalSessionState(current)) {
    return { allowed: false, nextState: null };
  }

  const next = TRANSITIONS[current]?.[trigger] ?? null;
  if (!next) {
    return { allowed: false, nextState: null };
  }

  return { allowed: true, nextState: next };
}

export function allSessionTransitionTriggers(): SessionTransitionTrigger[] {
  return [
    "AuthValidated",
    "OpenSession",
    "FirstHeartbeat",
    "StartTimeout",
    "HeartbeatRecorded",
    "PauseRecorded",
    "ResumeRecorded",
    "CompleteValid",
    "CompleteInvalid",
    "FraudSuspected",
    "FraudConfirmed",
    "FraudCleared",
    "HeartbeatTimeout",
    "RecoverSession",
  ];
}
