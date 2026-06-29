import type { AdminRepoClient } from "./admin.shared";
import { fetchStageNamesByCreatorIds } from "../common/stage-name.helpers";
import type {
  AdminAwardCategory,
  AdminAwardEdition,
  AdminAwardFundEntry,
  AdminAwardsDashboard,
  AdminAwardNominee,
} from "./types";

type NomineeRow = {
  id: string;
  category_id: string;
  vote_count: number;
  score_calculated: number | null;
  rank_position: number | null;
  creator_id: string;
  award_categories: { name: string; prize_amount_gnf: number } | null;
};

export class AdminAwardsRepository {
  constructor(private readonly client: AdminRepoClient) {}

  async getDashboard(): Promise<AdminAwardsDashboard> {
    const [
      activeEditionRes,
      nomineesRes,
      fundRes,
      pastEditionsRes,
      categoriesRes,
    ] = await Promise.all([
      this.client
        .from("award_editions")
        .select("*")
        .eq("status", "active")
        .maybeSingle(),
      this.client
        .from("award_nominees")
        .select(`
          id,
          category_id,
          vote_count,
          score_calculated,
          rank_position,
          creator_id,
          award_categories!inner (
            name,
            prize_amount_gnf
          )
        `)
        .order("vote_count", { ascending: false })
        .limit(50),
      this.client
        .from("award_fund_ledger")
        .select("amount_gnf, direction, created_at, source")
        .order("created_at", { ascending: false })
        .limit(12),
      this.client
        .from("award_editions")
        .select("*")
        .eq("status", "completed")
        .order("ceremony_date", { ascending: false })
        .limit(5),
      this.client
        .from("award_categories")
        .select("*")
        .order("prize_amount_gnf", { ascending: false }),
    ]);

    if (nomineesRes.error) throw nomineesRes.error;
    if (fundRes.error) throw fundRes.error;
    if (pastEditionsRes.error) throw pastEditionsRes.error;
    if (categoriesRes.error) throw categoriesRes.error;

    const fundHistory = (fundRes.data ?? []) as AdminAwardFundEntry[];
    const fundBalance = fundHistory.reduce((sum, entry) => {
      return sum + (entry.direction === "credit" ? entry.amount_gnf : -entry.amount_gnf);
    }, 0);

    const nominees = (nomineesRes.data ?? []) as unknown as NomineeRow[];
    const creatorIds = [...new Set(nominees.map((n) => n.creator_id))];
    const stageNames = await fetchStageNamesByCreatorIds(this.client, creatorIds);
    const cleanNominees: AdminAwardNominee[] = nominees.map((n) => ({
      id: n.id,
      categoryId: n.category_id,
      categoryName: n.award_categories?.name ?? "Autre",
      prizeAmountGnf: Number(n.award_categories?.prize_amount_gnf ?? 0),
      voteCount: n.vote_count,
      scoreCalculated: n.score_calculated,
      rankPosition: n.rank_position,
      creatorId: n.creator_id,
      stageName: stageNames.get(n.creator_id) ?? "—",
      avatarPath: null,
    }));

    const nomineesByCategory: Record<string, AdminAwardNominee[]> = {};
    for (const nominee of cleanNominees) {
      const cat = nominee.categoryName;
      if (!nomineesByCategory[cat]) nomineesByCategory[cat] = [];
      nomineesByCategory[cat].push(nominee);
    }

    return {
      activeEdition: (activeEditionRes.data as AdminAwardEdition | null) ?? null,
      nomineesByCategory,
      totalNominees: cleanNominees.length,
      fundBalance,
      fundHistory,
      pastEditions: (pastEditionsRes.data ?? []) as AdminAwardEdition[],
      categories: (categoriesRes.data ?? []) as AdminAwardCategory[],
    };
  }

  async closeVotes(editionId: string): Promise<void> {
    const { error } = await this.client.rpc("admin_close_award_votes", {
      p_edition_id: editionId,
    });
    if (error) throw error;
  }

  async distributePrizes(editionId: string, adminNote = ""): Promise<void> {
    const { error } = await this.client.rpc("admin_distribute_awards_prizes", {
      p_edition_id: editionId,
      p_admin_note: adminNote,
    });
    if (error) throw error;
  }
}
