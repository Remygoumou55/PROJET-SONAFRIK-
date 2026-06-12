import type { SonafrikSupabaseClient } from "@sonafrik/database";
import type {
  RoyaltyCalculationResult,
  RoyaltyDistributionResult,
  RoyaltyCycleSummary,
  CreatorRoyaltyHistoryEntry,
  ActiveRoyaltyCycle,
} from "@sonafrik/types";
import { RoyaltyEngineError } from "./errors";
import { RoyaltyRepository } from "./royalty.repository";
import {
  openCycleSchema,
  cycleIdSchema,
  creatorRoyaltyHistorySchema,
  type OpenCycleInput,
  type CycleIdInput,
  type CreatorRoyaltyHistoryInput,
} from "./schemas";

export class RoyaltyService {
  private readonly repository: RoyaltyRepository;

  constructor(private readonly client: SonafrikSupabaseClient) {
    this.repository = new RoyaltyRepository(client);
  }

  async openCycle(input: OpenCycleInput): Promise<string> {
    const parsed = openCycleSchema.safeParse(input);
    if (!parsed.success) throw new RoyaltyEngineError("cycle_open_failed");
    try {
      return await this.repository.openRoyaltyCycle(
        parsed.data.periodStart,
        parsed.data.periodEnd,
        parsed.data.totalRevenueGnf,
        parsed.data.revenuePoolPercent,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("chevauche")) throw new RoyaltyEngineError("cycle_overlap");
      throw new RoyaltyEngineError("cycle_open_failed");
    }
  }

  async calculateRoyalties(input: CycleIdInput): Promise<RoyaltyCalculationResult> {
    const parsed = cycleIdSchema.safeParse(input);
    if (!parsed.success) throw new RoyaltyEngineError("calculate_failed");
    try {
      return await this.repository.calculateRoyalties(parsed.data.cycleId);
    } catch {
      throw new RoyaltyEngineError("calculate_failed");
    }
  }

  async distributeRoyalties(input: CycleIdInput): Promise<RoyaltyDistributionResult> {
    const parsed = cycleIdSchema.safeParse(input);
    if (!parsed.success) throw new RoyaltyEngineError("distribute_failed");
    try {
      return await this.repository.distributeRoyalties(parsed.data.cycleId);
    } catch {
      throw new RoyaltyEngineError("distribute_failed");
    }
  }

  async getCycleSummary(input: CycleIdInput): Promise<RoyaltyCycleSummary | null> {
    const parsed = cycleIdSchema.safeParse(input);
    if (!parsed.success) throw new RoyaltyEngineError("cycle_not_found");
    try {
      return await this.repository.getRoyaltyCycleSummary(parsed.data.cycleId);
    } catch {
      throw new RoyaltyEngineError("cycle_not_found");
    }
  }

  async getCreatorRoyaltyHistory(
    input: CreatorRoyaltyHistoryInput,
  ): Promise<CreatorRoyaltyHistoryEntry[]> {
    const parsed = creatorRoyaltyHistorySchema.safeParse(input);
    if (!parsed.success) throw new RoyaltyEngineError("history_failed");
    try {
      return await this.repository.getCreatorRoyaltyHistory(
        parsed.data.creatorId,
        parsed.data.limit,
      );
    } catch {
      throw new RoyaltyEngineError("history_failed");
    }
  }

  async getActiveRoyaltyCycle(): Promise<ActiveRoyaltyCycle | null> {
    try {
      return await this.repository.getActiveRoyaltyCycle();
    } catch {
      throw new RoyaltyEngineError("active_cycle_failed");
    }
  }
}

export function createRoyaltyService(client: SonafrikSupabaseClient): RoyaltyService {
  return new RoyaltyService(client);
}
