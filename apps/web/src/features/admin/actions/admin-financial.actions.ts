"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { createPayoutService } from "@sonafrik/api/payout";
import { verifyAdminForAction } from "@/features/admin/lib/requireAdmin";

export async function adminApproveWithdrawalAction(
  withdrawalId: string,
): Promise<{ error?: string }> {
  const auth = await verifyAdminForAction();
  if (!auth.ok) return { error: auth.error };

  try {
    const supabase = getSupabaseAdminClient({ adminVerified: true });
    const payout = createPayoutService(supabase);
    await payout.approvePayoutRequest({ withdrawalId });
    revalidatePath("/admin/withdrawals");
    revalidatePath("/admin/finance");
    revalidatePath("/admin");
    return {};
  } catch {
    return { error: "Impossible d'approuver ce retrait." };
  }
}

export async function adminRejectWithdrawalAction(
  withdrawalId: string,
  reason: string,
): Promise<{ error?: string }> {
  const auth = await verifyAdminForAction();
  if (!auth.ok) return { error: auth.error };

  const trimmed = reason.trim();
  if (!trimmed) return { error: "Le motif de refus est obligatoire." };

  try {
    const supabase = getSupabaseAdminClient({ adminVerified: true });
    const payout = createPayoutService(supabase);
    await payout.rejectPayoutRequest({ withdrawalId, reason: trimmed });
    revalidatePath("/admin/withdrawals");
    revalidatePath("/admin/finance");
    revalidatePath("/admin");
    return {};
  } catch {
    return { error: "Impossible de refuser ce retrait." };
  }
}
