import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@sonafrik/database";
import type { SubscriptionPlan } from "@sonafrik/types";

export class SubscriptionPlansRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async listActive(): Promise<SubscriptionPlan[]> {
    const { data, error } = await this.client
      .from("subscription_plans")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) throw error;
    return (data ?? []).map((row) => ({
      ...row,
      features: (typeof row.features === "object" && row.features !== null && !Array.isArray(row.features)
        ? row.features
        : {}) as Record<string, unknown>,
    })) as SubscriptionPlan[];
  }
}
