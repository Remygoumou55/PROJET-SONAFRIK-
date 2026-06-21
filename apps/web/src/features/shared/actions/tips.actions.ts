"use server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { createTipsService } from "@sonafrik/api/tips";
import type { TipAmount } from "@sonafrik/types";

export async function sendTipAction(
  creatorId: string,
  amountGnf: TipAmount,
): Promise<{ error?: string; receiverName?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    const service = createTipsService(supabase);
    const result = await service.sendTip({ receiverCreatorId: creatorId, amountGnf });
    return { receiverName: result.receiverName };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Une erreur est survenue." };
  }
}
