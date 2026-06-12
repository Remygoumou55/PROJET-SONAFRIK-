import type { SonafrikSupabaseClient } from "@sonafrik/database";
import type {
  RoyaltyCalculationResult,
  RoyaltyDistributionResult,
  RoyaltyCycleSummary,
  CreatorRoyaltyHistoryEntry,
  ActiveRoyaltyCycle,
} from "@sonafrik/types";

export class RoyaltyRepository {
  constructor(private readonly client: SonafrikSupabaseClient) {}

  async openRoyaltyCycle(
    periodStart: string,
    periodEnd: string,
    totalRevenueGnf: number,
    revenuePoolPercent: number,
  ): Promise<string> {
    const { data, error } = await this.client.rpc(
      "open_royalty_cycle" as never,
      {
        p_period_start:         periodStart,
        p_period_end:           periodEnd,
        p_total_revenue_gnf:    totalRevenueGnf,
        p_revenue_pool_percent: revenuePoolPercent,
      } as never,
    );
    if (error) throw error;
    return data as string;
  }

  async calculateRoyalties(cycleId: string): Promise<RoyaltyCalculationResult> {
    const { data, error } = await this.client.rpc(
      "calculate_royalties" as never,
      { p_cycle_id: cycleId } as never,
    );
    if (error) throw error;
    return data as RoyaltyCalculationResult;
  }

  async distributeRoyalties(cycleId: string): Promise<RoyaltyDistributionResult> {
    const { data, error } = await this.client.rpc(
      "distribute_royalties" as never,
      { p_cycle_id: cycleId } as never,
    );
    if (error) throw error;
    return data as RoyaltyDistributionResult;
  }

  async getRoyaltyCycleSummary(cycleId: string): Promise<RoyaltyCycleSummary | null> {
    const { data, error } = await this.client.rpc(
      "get_royalty_cycle_summary" as never,
      { p_cycle_id: cycleId } as never,
    );
    if (error) throw error;
    return data as RoyaltyCycleSummary | null;
  }

  async getCreatorRoyaltyHistory(
    creatorId: string,
    limit: number,
  ): Promise<CreatorRoyaltyHistoryEntry[]> {
    const { data, error } = await this.client.rpc(
      "get_creator_royalty_history" as never,
      { p_creator_id: creatorId, p_limit: limit } as never,
    );
    if (error) throw error;
    return (data as CreatorRoyaltyHistoryEntry[]) ?? [];
  }

  async getActiveRoyaltyCycle(): Promise<ActiveRoyaltyCycle | null> {
    const { data, error } = await this.client.rpc(
      "get_active_royalty_cycle" as never,
      {} as never,
    );
    if (error) throw error;
    return data as ActiveRoyaltyCycle | null;
  }
}
