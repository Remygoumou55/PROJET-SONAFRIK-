"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getAdminServiceForAction, formatAdminActionError } from "@/features/admin/lib/getAdminActionContext";

export async function toggleFeatureFlagAction(
  name: string,
  enabled: boolean,
): Promise<{ error?: string }> {
  const ctx = await getAdminServiceForAction();
  if (!ctx.ok) return { error: ctx.error };

  try {
    await ctx.service.toggleFeatureFlag(name, enabled);
    revalidatePath("/admin/flags");
    return {};
  } catch (err) {
    return { error: formatAdminActionError(err, "Impossible de modifier le flag.") };
  }
}

// Contraintes métier par clé — empêche de sauver revenue_pool_percent=200 ou target=0
const SETTING_SCHEMAS: Record<string, z.ZodTypeAny> = {
  revenue_pool_percent:         z.number().min(0).max(100),
  tip_commission_percent:       z.number().min(0).max(100),
  beat_store_commission_percent:z.number().min(0).max(100),
  launch_subscriber_target:     z.number().int().min(1),
  grace_period_days:            z.number().int().min(0),
  min_withdrawal_gnf:           z.number().int().min(0),
  max_stream_sessions:          z.number().int().min(1),
};

export async function triggerRoyaltyCycleAction(
  input: {
    periodStart: string;
    periodEnd: string;
    totalRevenueGnf: number;
    revenuePoolPercent?: number;
  },
): Promise<{ error?: string; artistCount?: number; totalDistributed?: number; cycleId?: string }> {
  const ctx = await getAdminServiceForAction();
  if (!ctx.ok) return { error: ctx.error };

  try {
    const result = await ctx.service.triggerRoyaltyCycle({
      ...input,
      revenuePoolPercent: input.revenuePoolPercent ?? 65,
    });
    revalidatePath("/admin/finance");
    revalidatePath("/admin/revenue");
    return {
      cycleId: result.cycleId,
      artistCount: result.calculation.artist_count,
      totalDistributed: result.distribution.total_gnf,
    };
  } catch (err) {
    return { error: formatAdminActionError(err, "Impossible de déclencher le cycle royalties.") };
  }
}

export async function updateSystemSettingAction(
  key: string,
  value: string,
): Promise<{ error?: string }> {
  const ctx = await getAdminServiceForAction();
  if (!ctx.ok) return { error: ctx.error };

  try {
    // Les valeurs sont stockées en JSONB — on tente le parse JSON, sinon string brute
    let parsedValue: unknown = value;
    try {
      parsedValue = JSON.parse(value);
    } catch {
      parsedValue = value;
    }

    const schema = SETTING_SCHEMAS[key];
    if (schema) {
      const result = schema.safeParse(parsedValue);
      if (!result.success) {
        return { error: `Valeur invalide pour « ${key} » : ${result.error.issues[0]?.message ?? "format incorrect"}.` };
      }
      parsedValue = result.data;
    }

    await ctx.service.updateSystemSetting(key, parsedValue);
    revalidatePath("/admin/settings");
    return {};
  } catch (err) {
    return { error: formatAdminActionError(err, "Impossible de mettre à jour le paramètre.") };
  }
}
