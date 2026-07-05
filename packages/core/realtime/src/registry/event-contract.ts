import type { EventRegistry } from "./event-registry";
import type { SrtspEvent, SrtspEventType, SrtspPublishInput } from "../types";

let eventCounter = 0;

export function createSrtspEventId(): string {
  eventCounter += 1;
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `srtsp_${Date.now()}_${eventCounter}`;
}

export function resetSrtspEventIdCounterForTests(): void {
  eventCounter = 0;
}

function resolveEventType(name: string, override?: SrtspEventType): SrtspEventType {
  if (override) return override;
  if (name.startsWith("system.")) return "heartbeat";
  if (name.endsWith(".invalidate")) return "control";
  return "domain";
}

/** SSOT — construction contrat événement Enterprise v1.1. */
export function buildSrtspEventContract<TPayload extends Record<string, unknown>>(
  registry: EventRegistry,
  input: SrtspPublishInput<TPayload>,
  validatedPayload: TPayload,
  id = createSrtspEventId(),
): SrtspEvent<TPayload> {
  const name = input.name;
  return {
    id,
    name,
    type: resolveEventType(name, input.type),
    version: registry.resolveVersion(name, input.version),
    payload: validatedPayload,
    source: input.source ?? registry.resolveSource(name),
    destinations: registry.resolveDestinations(name, input.destinations),
    timestamp: Date.now(),
    metadata: input.metadata,
    dedupeKey: input.dedupeKey ?? `${name}:${JSON.stringify(validatedPayload)}`,
    actor: input.actor,
  };
}
