import type { ISRCSequenceKey, ISRCSequenceProvider } from "@sonafrik/types";
import { ISRCGenerationError } from "../errors/ISRCError";
import { sequenceKeyString } from "../utils/formatHelpers";
import { AsyncMutex } from "../utils/mutex";
import type { ISRCFormattingProvider } from "@sonafrik/types";

interface SequenceState {
  key: ISRCSequenceKey;
  lastDesignation: number;
  updatedAt: string;
}

/** In-memory sequence provider — configurable min/max from formatting provider */
export class ConfigSequenceProvider implements ISRCSequenceProvider {
  private readonly sequences = new Map<string, SequenceState>();
  private readonly mutex = new AsyncMutex();

  constructor(private readonly formatting: ISRCFormattingProvider) {}

  getMinDesignation(): number {
    return this.formatting.getMinDesignation();
  }

  getMaxDesignation(): number {
    return this.formatting.getMaxDesignation();
  }

  async peek(key: ISRCSequenceKey): Promise<number> {
    const state = this.sequences.get(this.keyOf(key));
    return (state?.lastDesignation ?? 0) + 1;
  }

  async getNextDesignation(key: ISRCSequenceKey): Promise<number> {
    return this.mutex.run(async () => {
      const mapKey = this.keyOf(key);
      const current = this.sequences.get(mapKey);
      const next = (current?.lastDesignation ?? 0) + 1;
      const max = this.getMaxDesignation();

      if (next > max) {
        throw new ISRCGenerationError("Séquence ISRC épuisée pour cette clé");
      }

      this.sequences.set(mapKey, {
        key,
        lastDesignation: next,
        updatedAt: new Date().toISOString(),
      });

      return next;
    });
  }

  async reset(key: ISRCSequenceKey, startAt = 0): Promise<void> {
    return this.mutex.run(async () => {
      this.sequences.set(this.keyOf(key), {
        key,
        lastDesignation: startAt,
        updatedAt: new Date().toISOString(),
      });
    });
  }

  private keyOf(key: ISRCSequenceKey): string {
    return sequenceKeyString(key.countryCode, key.registrantCode, key.yearOfReference);
  }
}
