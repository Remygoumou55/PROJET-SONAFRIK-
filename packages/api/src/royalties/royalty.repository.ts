import type { SonafrikSupabaseClient } from "@sonafrik/database";
import type {
  RoyaltyCalculationResult,
  RoyaltyDistributionResult,
  RoyaltyCycleSummary,
  CreatorRoyaltyHistoryEntry,
  ActiveRoyaltyCycle,
  RoyaltyCycle,
} from "@sonafrik/types";

export class RoyaltyRepository {
  constructor(private readonly client: SonafrikSupabaseClient) {}

  async openRoyaltyCycle(
    periodStart: string,
    periodEnd: string,
    totalRevenueGnf: number,
    revenuePoolPercent: number,
  ): Promise<string> {
    const { data, error } = await this.client.rpc("open_royalty_cycle", {
      p_period_start:         periodStart,
      p_period_end:           periodEnd,
      p_total_revenue_gnf:    totalRevenueGnf,
      p_revenue_pool_percent: revenuePoolPercent,
    });
    if (error) throw error;
    return data as string;
  }

  async calculateRoyalties(cycleId: string): Promise<RoyaltyCalculationResult> {
    const { data, error } = await this.client.rpc("calculate_royalties", {
      p_cycle_id: cycleId,
    });
    if (error) throw error;
    return data as unknown as RoyaltyCalculationResult;
  }

  async distributeRoyalties(cycleId: string): Promise<RoyaltyDistributionResult> {
    const { data, error } = await this.client.rpc("distribute_royalties", {
      p_cycle_id: cycleId,
    });
    if (error) throw error;
    return data as unknown as RoyaltyDistributionResult;
  }

  async getRoyaltyCycleSummary(cycleId: string): Promise<RoyaltyCycleSummary | null> {
    const { data, error } = await this.client.rpc("get_royalty_cycle_summary", {
      p_cycle_id: cycleId,
    });
    if (error) throw error;
    return data as unknown as RoyaltyCycleSummary | null;
  }

  async getCreatorRoyaltyHistory(
    creatorId: string,
    limit: number,
  ): Promise<CreatorRoyaltyHistoryEntry[]> {
    const { data, error } = await this.client.rpc("get_creator_royalty_history", {
      p_creator_id: creatorId,
      p_limit: limit,
    });
    if (error) throw error;
    return (data as unknown as CreatorRoyaltyHistoryEntry[]) ?? [];
  }

  async getActiveRoyaltyCycle(): Promise<ActiveRoyaltyCycle | null> {
    const { data, error } = await this.client.rpc("get_active_royalty_cycle");
    if (error) throw error;
    return data as unknown as ActiveRoyaltyCycle | null;
  }

  async listRoyaltyCycles(limit = 12): Promise<RoyaltyCycle[]> {
    const { data, error } = await this.client
      .from("royalty_cycles")
      .select("*")
      .order("period_start", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data as RoyaltyCycle[]) ?? [];
  }
}
