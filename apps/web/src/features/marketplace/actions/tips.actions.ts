"use server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { createTipsService } from "@sonafrik/api/tips";

export async function sendTipAction(
  receiverCreatorId: string,
  amountGnf: 5000 | 10000 | 20000,
): Promise<{ error?: string; receiverName?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    const service = createTipsService(supabase);
    const result = await service.sendTip({ receiverCreatorId, amountGnf });
    return { receiverName: result.receiverName };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Une erreur est survenue." };
  }
}
