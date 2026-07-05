import type { z } from "zod";
import type { SrtspEventDefinition, SrtspEventDestination, SrtspEventSource } from "../types";
import { DOMAIN_EVENT_DEFINITIONS } from "./domain-events";

type RegistryEntry = SrtspEventDefinition<z.ZodType> & {
  destinations: SrtspEventDestination[];
};

/** Registre officiel des événements SONAFRIK — SSOT typé + versionné. */
export class EventRegistry {
  private readonly definitions = new Map<string, RegistryEntry>();

  constructor(seed: readonly RegistryEntry[] = DOMAIN_EVENT_DEFINITIONS as unknown as RegistryEntry[]) {
    for (const def of seed) {
      this.register(def);
    }
  }

  register(definition: RegistryEntry): void {
    this.definitions.set(definition.name, definition);
  }

  get(name: string): RegistryEntry | undefined {
    return this.definitions.get(name);
  }

  has(name: string): boolean {
    return this.definitions.has(name);
  }

  validatePayload(name: string, payload: unknown): Record<string, unknown> {
    const def = this.definitions.get(name);
    if (!def) {
      if (typeof payload === "object" && payload !== null && !Array.isArray(payload)) {
        return payload as Record<string, unknown>;
      }
      return {};
    }
    const parsed = def.schema.safeParse(payload ?? {});
    if (!parsed.success) {
      throw new Error(`SRTSP payload invalide pour ${name}: ${parsed.error.message}`);
    }
    return parsed.data as Record<string, unknown>;
  }

  resolveDestinations(name: string, override?: SrtspEventDestination[]): SrtspEventDestination[] {
    if (override?.length) return override;
    const def = this.definitions.get(name);
    return def ? [...def.destinations] : ["*"];
  }

  resolveVersion(name: string, override?: number): number {
    if (override != null) return override;
    return this.definitions.get(name)?.version ?? 1;
  }

  resolveSource(name: string, override?: SrtspEventSource): SrtspEventSource {
    if (override) return override;
    return this.definitions.get(name)?.source ?? "system";
  }

  list(): RegistryEntry[] {
    return [...this.definitions.values()];
  }

  listByDestination(destination: SrtspEventDestination): string[] {
    return this.list()
      .filter((d) => d.destinations.includes("*") || d.destinations.includes(destination))
      .map((d) => d.name);
  }
}

let defaultRegistry: EventRegistry | null = null;

export function getEventRegistry(): EventRegistry {
  if (!defaultRegistry) defaultRegistry = new EventRegistry();
  return defaultRegistry;
}

export function resetEventRegistryForTests(): void {
  defaultRegistry = null;
}
