import type { RoyaltyCycle } from "@sonafrik/types";
import { fetchStageNamesByCreatorIds } from "../common/stage-name.helpers";
import { countQuery, type AdminRepoClient } from "./admin.shared";
import {
  bucketMonthlyWalletCredits,
  buildMonthKeys,
  computeRevenueChangePercent,
  formatMonthKeyLabel,
  sumWalletCreditGnf,
} from "./admin.dashboard.utils";
import type {
  AdminRevenueArtistRow,
  AdminRevenueDashboardData,
  AdminWithdrawalAlertRow,
  AdminWithdrawalsDashboardMeta,
} from "./types";

export type {
  AdminRevenueArtistRow,
  AdminRevenueDashboardData,
  AdminWithdrawalAlertRow,
  AdminWithdrawalsDashboardMeta,
};

const LARGE_WITHDRAWAL_GNF = 1_000_000;
const CYCLE_OVERDUE_DAYS = 35;
const OVERDUE_HOURS = 48;

function groupCreditsByReason(
  rows: ReadonlyArray<{ reason: string; amount_gnf: number }>,
): Record<string, number> {
  const map: Record<string, number> = {};
  for (const row of rows) {
    const key = row.reason?.trim() || "other";
    map[key] = (map[key] ?? 0) + (row.amount_gnf ?? 0);
  }
  return map;
}

export class AdminFinancialRepository {
  constructor(private readonly client: AdminRepoClient) {}

  async getRevenueDashboardData(): Promise<AdminRevenueDashboardData> {
    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1).toISOString();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999).toISOString();

    const [
      ledgerYearRes,
      thisMonthRes,
      lastMonthRes,
      typeMonthRes,
      walletsRes,
      creatorsRes,
      profilesRes,
      cyclesRes,
      lastCycleRes,
      negativeBalanceCount,
    ] = await Promise.all([
      this.client
        .from("wallet_ledger")
        .select("amount_gnf, created_at")
        .eq("entry_type", "credit")
        .gte("created_at", twelveMonthsAgo),
      this.client
        .from("wallet_ledger")
        .select("amount_gnf")
        .eq("entry_type", "credit")
        .gte("created_at", startOfMonth),
      this.client
        .from("wallet_ledger")
        .select("amount_gnf")
        .eq("entry_type", "credit")
        .gte("created_at", startOfLastMonth)
        .lte("created_at", endOfLastMonth),
      this.client
        .from("wallet_ledger")
        .select("reason, amount_gnf")
        .eq("entry_type", "credit")
        .gte("created_at", startOfMonth),
      this.client
        .from("wallets")
        .select("user_id, balance_gnf, total_credited_gnf")
        .order("total_credited_gnf", { ascending: false })
        .limit(10),
      this.client.from("creators").select("id, owner_id").is("deleted_at", null),
      this.client.from("profiles").select("id, full_name").is("deleted_at", null),
      this.client
        .from("royalty_cycles")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(12),
      this.client
        .from("royalty_cycles")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      countQuery(
        this.client
          .from("wallets")
          .select("*", { count: "exact", head: true })
          .lt("balance_gnf", 0),
      ),
    ]);

    if (ledgerYearRes.error) throw ledgerYearRes.error;
    if (thisMonthRes.error) throw thisMonthRes.error;
    if (lastMonthRes.error) throw lastMonthRes.error;
    if (typeMonthRes.error) throw typeMonthRes.error;
    if (walletsRes.error) throw walletsRes.error;
    if (creatorsRes.error) throw creatorsRes.error;
    if (profilesRes.error) throw profilesRes.error;
    if (cyclesRes.error) throw cyclesRes.error;
    if (lastCycleRes.error) throw lastCycleRes.error;

    const monthKeys = buildMonthKeys(now);
    const monthlyMap = bucketMonthlyWalletCredits(ledgerYearRes.data ?? [], monthKeys);
    const monthlyRevenue = monthKeys.map((monthKey) => ({
      monthKey,
      label: formatMonthKeyLabel(monthKey),
      totalGnf: monthlyMap.get(monthKey) ?? 0,
    }));

    const thisMonthTotal = sumWalletCreditGnf(thisMonthRes.data ?? []);
    const lastMonthTotal = sumWalletCreditGnf(lastMonthRes.data ?? []);
    const revenueChange = computeRevenueChangePercent(thisMonthTotal, lastMonthTotal);

    const walletRows = walletsRes.data ?? [];
    const creators = creatorsRes.data ?? [];
    const ownerToCreator = new Map(
      creators.map((c) => [c.owner_id as string, c.id as string]),
    );
    const stageNames = await fetchStageNamesByCreatorIds(
      this.client,
      [...ownerToCreator.values()],
    );
    const profileNames = new Map(
      (profilesRes.data ?? []).map((p) => [p.id as string, p.full_name as string | null]),
    );

    const topArtists: AdminRevenueArtistRow[] = walletRows.map((w) => {
      const userId = w.user_id as string;
      const creatorId = ownerToCreator.get(userId);
      const stageName = creatorId ? stageNames.get(creatorId) : undefined;
      const profileName = profileNames.get(userId);
      return {
        userId,
        artistName: stageName ?? profileName ?? "Artiste",
        totalEarnedGnf: Number(w.total_credited_gnf ?? 0),
        balanceGnf: Number(w.balance_gnf ?? 0),
      };
    });

    const lastCycle = (lastCycleRes.data as RoyaltyCycle | null) ?? null;
    const daysSinceLastCycle = lastCycle?.created_at
      ? Math.floor((Date.now() - new Date(lastCycle.created_at).getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    return {
      monthlyRevenue,
      thisMonthTotal,
      lastMonthTotal,
      revenueChange,
      revenueByType: groupCreditsByReason(typeMonthRes.data ?? []),
      topArtists,
      royaltyCycles: (cyclesRes.data ?? []) as RoyaltyCycle[],
      lastCycle,
      alerts: {
        cycleOverdue: daysSinceLastCycle > CYCLE_OVERDUE_DAYS,
        daysSinceLastCycle,
        negativeBalanceCount,
      },
    };
  }

  async getWithdrawalsDashboardMeta(
    filter: string,
    page: number,
    limit: number,
  ): Promise<AdminWithdrawalsDashboardMeta> {
    const overdueIso = new Date(Date.now() - OVERDUE_HOURS * 60 * 60 * 1000).toISOString();

    let countQueryBuilder = this.client
      .from("withdrawals")
      .select("*", { count: "exact", head: true });

    if (filter !== "all") {
      countQueryBuilder = countQueryBuilder.eq("status", filter);
    }

    const [
      total,
      pendingRowsRes,
      largeRowsRes,
      overdueCount,
    ] = await Promise.all([
      countQuery(countQueryBuilder),
      this.client.from("withdrawals").select("net_amount_gnf").eq("status", "pending"),
      this.client
        .from("withdrawals")
        .select("id, net_amount_gnf, user_id")
        .eq("status", "pending")
        .gte("net_amount_gnf", LARGE_WITHDRAWAL_GNF)
        .order("created_at", { ascending: false })
        .limit(20),
      countQuery(
        this.client
          .from("withdrawals")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending")
          .lte("created_at", overdueIso),
      ),
    ]);

    if (pendingRowsRes.error) throw pendingRowsRes.error;
    if (largeRowsRes.error) throw largeRowsRes.error;

    const totalPendingAmount = (pendingRowsRes.data ?? []).reduce(
      (sum, row) => sum + Number(row.net_amount_gnf ?? 0),
      0,
    );

    const largeUserIds = (largeRowsRes.data ?? []).map((r) => r.user_id as string);
    const profileNames = new Map<string, string>();
    if (largeUserIds.length > 0) {
      const { data: profiles } = await this.client
        .from("profiles")
        .select("id, full_name")
        .in("id", largeUserIds);
      for (const p of profiles ?? []) {
        profileNames.set(p.id as string, (p.full_name as string) ?? "Artiste");
      }
    }

    const largeWithdrawals: AdminWithdrawalAlertRow[] = (largeRowsRes.data ?? []).map((row) => ({
      id: row.id as string,
      amountGnf: Number(row.net_amount_gnf ?? 0),
      artistLabel: profileNames.get(row.user_id as string) ?? "Artiste",
    }));

    return {
      currentFilter: filter,
      page,
      limit,
      total,
      alerts: {
        largeWithdrawals,
        overdueCount,
        totalPendingAmount,
      },
    };
  }

  async getWalletBalancesByUserIds(userIds: string[]): Promise<Record<string, number>> {
    if (userIds.length === 0) return {};

    const { data, error } = await this.client
      .from("wallets")
      .select("user_id, balance_gnf")
      .in("user_id", userIds);

    if (error) throw error;

    const balances: Record<string, number> = {};
    for (const wallet of data ?? []) {
      balances[wallet.user_id as string] = Number(wallet.balance_gnf ?? 0);
    }
    return balances;
  }
}
