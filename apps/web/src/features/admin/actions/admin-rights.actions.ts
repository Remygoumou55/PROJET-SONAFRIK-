"use server";

import { revalidatePath } from "next/cache";
import type { RightsClaimStatus } from "@sonafrik/types";
import {
  getAdminServiceForAction,
  formatAdminActionError,
  type AdminActionResult,
} from "@/features/admin/lib/getAdminActionContext";

const ALLOWED: RightsClaimStatus[] = ["accepted", "rejected", "escalated", "pending"];

export async function adminUpdateRightsClaimAction(input: {
  claimId: string;
  status: RightsClaimStatus;
  notes?: string;
}): Promise<AdminActionResult> {
  if (!input.claimId || !ALLOWED.includes(input.status)) {
    return { error: "Données invalides." };
  }

  const ctx = await getAdminServiceForAction();
  if (!ctx.ok) return { error: ctx.error };

  try {
    await ctx.service.updateRightsClaim(input.claimId, input.status, input.notes?.trim());
    revalidatePath("/admin/rights");
    revalidatePath("/admin");
    return {};
  } catch (err) {
    return { error: formatAdminActionError(err, "Impossible de mettre à jour la revendication.") };
  }
}
