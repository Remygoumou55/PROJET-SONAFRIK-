import { describe, expect, it } from "vitest";
import type { StreamSession } from "@sonafrik/types";
import { deriveClosedSubtype, deriveSessionState, isFirstHeartbeat } from "./session-state";

function baseSession(overrides: Partial<StreamSession> = {}): StreamSession {
  const now = new Date().toISOString();
  return {
    id: "sess-1",
    user_id: "user-1",
    track_id: "track-1",
    track_file_id: null,
    device_id: null,
    platform: "web",
    quality_kbps: 128,
    started_at: now,
    last_heartbeat_at: now,
    completed_at: null,
    total_listened_seconds: 0,
    total_duration_seconds: 180,
    listen_percentage: 0,
    is_valid_listen: false,
    fraud_flags: [],
    ip_address: null,
    user_agent: null,
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

describe("deriveSessionState", () => {
  it("retourne Closed si completed_at présent", () => {
    expect(deriveSessionState(baseSession({ completed_at: new Date().toISOString() }))).toBe(
      "Closed",
    );
  });

  it("retourne Expired si heartbeat trop ancien", () => {
    const orphanMs = 5 * 60 * 1000;
    const old = new Date(Date.now() - orphanMs - 1000).toISOString();
    expect(deriveSessionState(baseSession({ last_heartbeat_at: old }))).toBe("Expired");
  });

  it("retourne Created avant premier heartbeat dans la fenêtre start", () => {
    expect(deriveSessionState(baseSession())).toBe("Created");
  });

  it("retourne Active après écoute", () => {
    expect(deriveSessionState(baseSession({ total_listened_seconds: 30 }))).toBe("Active");
  });

  it("respecte overlay Suspended", () => {
    expect(
      deriveSessionState(baseSession({ total_listened_seconds: 30 }), { suspended: true }),
    ).toBe("Suspended");
  });

  it("retourne FraudReview si fraud_flags", () => {
    expect(deriveSessionState(baseSession({ fraud_flags: ["velocity"] }))).toBe("FraudReview");
  });

  it("Created expire après SESSION_START_TIMEOUT_MS sans heartbeat", () => {
    const startTimeoutMs = 30_000;
    const started = new Date(Date.now() - startTimeoutMs - 1000).toISOString();
    const oldHb = started;
    expect(
      deriveSessionState(
        baseSession({ started_at: started, last_heartbeat_at: oldHb }),
        {},
        Date.now(),
      ),
    ).toBe("Expired");
  });

  it("deriveClosedSubtype identifie les sous-types", () => {
    const now = new Date().toISOString();
    const base = baseSession();
    expect(deriveClosedSubtype({ ...base, is_valid_listen: true, completed_at: now })).toBe(
      "Completed_Valid",
    );
    expect(
      deriveClosedSubtype({ ...base, fraud_flags: ["x"], completed_at: now }),
    ).toBe("Invalidated");
    expect(
      deriveClosedSubtype({ ...base, listen_percentage: 0, completed_at: now }),
    ).toBe("Skipped");
    expect(
      deriveClosedSubtype({ ...base, listen_percentage: 40, completed_at: now }),
    ).toBe("Completed_Invalid");
  });

  it("retourne overlay Heartbeat et Active", () => {
    const active = baseSession({ total_listened_seconds: 10 });
    expect(deriveSessionState(active, { runtimeState: "Heartbeat" })).toBe("Heartbeat");
    expect(deriveSessionState(active, { runtimeState: "Active" })).toBe("Active");
    expect(deriveSessionState(active, { runtimeState: "Authenticated" })).toBe("Authenticated");
  });

  it("retourne Expired pour orphaned_session flag", () => {
    expect(
      deriveSessionState(baseSession({ fraud_flags: ["orphaned_session"] })),
    ).toBe("Expired");
  });

  it("retourne overlay Created", () => {
    expect(deriveSessionState(baseSession(), { runtimeState: "Created" })).toBe("Created");
  });

  it("expose helpers de subtype et first heartbeat", () => {
    expect(isFirstHeartbeat(baseSession())).toBe(true);
    expect(isFirstHeartbeat(baseSession({ total_listened_seconds: 1 }))).toBe(false);
  });
});
