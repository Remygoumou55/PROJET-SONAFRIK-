import type { ISRCValue } from "@sonafrik/types";
import { ISRC_REGISTRY_STATUS } from "@sonafrik/types";
import type { ISRCRegistryImpl } from "./ISRCRegistry";

export interface ISRCPool {
  add(isrc: ISRCValue): Promise<void>;
  addMany(isrcs: readonly ISRCValue[]): Promise<void>;
  take(): Promise<ISRCValue | null>;
  size(): number;
  contains(isrc: ISRCValue): boolean;
}

/** Pre-allocated pool of available ISRC values — headless only */
export class ISRCPoolImpl implements ISRCPool {
  private readonly available: ISRCValue[] = [];
  private readonly seen = new Set<string>();

  constructor(private readonly registry?: ISRCRegistryImpl) {}

  async add(isrc: ISRCValue): Promise<void> {
    const key = isrc as string;
    if (this.seen.has(key)) return;
    this.seen.add(key);
    this.available.push(isrc);

    if (this.registry) {
      const existing = await this.registry.lookup(isrc);
      if (!existing) {
        await this.registry.register(isrc, { status: ISRC_REGISTRY_STATUS.AVAILABLE });
      }
    }
  }

  async addMany(isrcs: readonly ISRCValue[]): Promise<void> {
    for (const isrc of isrcs) {
      await this.add(isrc);
    }
  }

  async take(): Promise<ISRCValue | null> {
    return this.available.shift() ?? null;
  }

  size(): number {
    return this.available.length;
  }

  contains(isrc: ISRCValue): boolean {
    return this.seen.has(isrc as string);
  }
}
