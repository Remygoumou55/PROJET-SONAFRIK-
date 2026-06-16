"use server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { createTipsService } from "@sonafrik/api/tips";

export async function sendTipAction(
  recipientId: string,
  amountGnf: number,
  message?: string,
): Promise<{ error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    const service = createTipsService(supabase);
    await service.sendTip({ recipientId, amountGnf, message });
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Une erreur est survenue." };
  }
}
