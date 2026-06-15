"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { createAdminService } from "@sonafrik/api/admin";

export async function toggleFeatureFlagAction(
  name: string,
  enabled: boolean,
): Promise<{ error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    const service = createAdminService(supabase);
    await service.toggleFeatureFlag(name, enabled);
    revalidatePath("/admin/flags");
    return {};
  } catch {
    return { error: "Impossible de modifier le flag." };
  }
}

export async function updateSystemSettingAction(
  key: string,
  value: string,
): Promise<{ error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    const service = createAdminService(supabase);
    // Les valeurs sont stockées en JSONB — on tente le parse JSON, sinon string brute
    let parsedValue: unknown = value;
    try {
      parsedValue = JSON.parse(value);
    } catch {
      parsedValue = value;
    }
    await service.updateSystemSetting(key, parsedValue);
    revalidatePath("/admin/settings");
    return {};
  } catch {
    return { error: "Impossible de mettre à jour le paramètre." };
  }
}
