import { describe, expect, it } from "vitest";
import type { SessionStateId, SessionTransitionTrigger } from "@sonafrik/types";
import {
  allSessionTransitionTriggers,
  isTerminalSessionState,
  transitionSessionState,
} from "./session-state-machine";

/** Matrice STATE_MACHINE.md §5.2 — transitions autorisées */
const AUTHORIZED: Array<[SessionStateId | "Initial", SessionTransitionTrigger, SessionStateId]> = [
  ["Initial", "AuthValidated", "Authenticated"],
  ["Authenticated", "OpenSession", "Created"],
  ["Created", "FirstHeartbeat", "Active"],
  ["Created", "StartTimeout", "Expired"],
  ["Active", "HeartbeatRecorded", "Heartbeat"],
  ["Heartbeat", "HeartbeatRecorded", "Heartbeat"],
  ["Active", "PauseRecorded", "Suspended"],
  ["Suspended", "ResumeRecorded", "Active"],
  ["Active", "CompleteValid", "Closed"],
  ["Active", "CompleteInvalid", "Closed"],
  ["Suspended", "CompleteValid", "Closed"],
  ["Suspended", "CompleteInvalid", "Closed"],
  ["Active", "FraudSuspected", "FraudReview"],
  ["Heartbeat", "FraudSuspected", "FraudReview"],
  ["FraudReview", "FraudConfirmed", "Closed"],
  ["FraudReview", "FraudCleared", "Active"],
  ["Active", "HeartbeatTimeout", "Expired"],
  ["Suspended", "HeartbeatTimeout", "Expired"],
  ["Heartbeat", "HeartbeatTimeout", "Expired"],
];

describe("session-state-machine", () => {
  it("expose tous les triggers documentés", () => {
    expect(allSessionTransitionTriggers().length).toBeGreaterThanOrEqual(13);
  });

  it.each(AUTHORIZED)(
    "autorise %s + %s → %s",
    (from, trigger, expected) => {
      const result = transitionSessionState(from, trigger);
      expect(result.allowed).toBe(true);
      expect(result.nextState).toBe(expected);
    },
  );

  it("refuse toute transition depuis Closed", () => {
    for (const trigger of allSessionTransitionTriggers()) {
      expect(transitionSessionState("Closed", trigger).allowed).toBe(false);
    }
  });

  it("refuse toute transition depuis Expired", () => {
    for (const trigger of allSessionTransitionTriggers()) {
      expect(transitionSessionState("Expired", trigger).allowed).toBe(false);
    }
  });

  it("refuse RecoverSession sans transition valide", () => {
    expect(transitionSessionState("Active", "RecoverSession").allowed).toBe(false);
  });

  it("identifie les états terminaux", () => {
    expect(isTerminalSessionState("Closed")).toBe(true);
    expect(isTerminalSessionState("Expired")).toBe(true);
    expect(isTerminalSessionState("Active")).toBe(false);
  });
});
