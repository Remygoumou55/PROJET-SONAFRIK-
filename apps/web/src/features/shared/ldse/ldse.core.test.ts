import { describe, expect, it, beforeEach } from "vitest";
import { ldseCache } from "./cache";
import { ldseEventBus } from "./event-bus";
import { registerLdseInvalidationRule, resolveInvalidationKeys, _resetInvalidationRulesForTests } from "./invalidate-map";

describe("ldseCache", () => {
  beforeEach(() => {
    ldseCache._resetForTests();
  });

  it("stores and retrieves within TTL", () => {
    ldseCache.set("test:key", { n: 1 }, 60_000);
    expect(ldseCache.get<{ n: number }>("test:key")).toEqual({ n: 1 });
  });

  it("invalidates by exact key", () => {
    ldseCache.set("a", 1);
    ldseCache.set("b", 2);
    expect(ldseCache.invalidate("a")).toBe(1);
    expect(ldseCache.get("a")).toBeUndefined();
    expect(ldseCache.get("b")).toBe(2);
  });

  it("invalidates by regex pattern", () => {
    ldseCache.set("admin:nav", 1);
    ldseCache.set("admin:fraud", 2);
    ldseCache.set("listener:1", 3);
    expect(ldseCache.invalidate(/^admin:/)).toBe(2);
    expect(ldseCache.get("listener:1")).toBe(3);
  });
});

describe("ldseEventBus", () => {
  beforeEach(() => {
    ldseEventBus._resetForTests();
  });

  it("delivers typed events to subscribers", () => {
    const received: string[] = [];
    const unsub = ldseEventBus.subscribe("fraud.updated", (e) => {
      received.push(e.type);
    });
    ldseEventBus.publish("fraud.updated");
    ldseEventBus.publish("other.event");
    unsub();
    expect(received).toEqual(["fraud.updated"]);
  });

  it("tracks publish stats", () => {
    ldseEventBus.publish("a");
    ldseEventBus.publish("a");
    ldseEventBus.publish("b");
    const stats = ldseEventBus.getStats();
    expect(stats.eventsPublished).toBe(3);
    expect(stats.eventsByType.a).toBe(2);
  });
});

describe("invalidate-map", () => {
  beforeEach(() => {
    ldseCache._resetForTests();
    ldseEventBus._resetForTests();
    _resetInvalidationRulesForTests();
  });

  it("resolves keys for registered rules", () => {
    registerLdseInvalidationRule({
      event: "admin.catalog.updated",
      keys: ["admin:nav-badges", "admin:moderation-metrics"],
    });
    const keys = resolveInvalidationKeys("admin.catalog.updated");
    expect(keys).toContain("admin:nav-badges");
    expect(keys).toContain("admin:moderation-metrics");
  });
});
