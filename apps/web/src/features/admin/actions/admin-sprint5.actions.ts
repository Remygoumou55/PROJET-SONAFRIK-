"use server";

import { revalidatePath } from "next/cache";
import {
  adminAwardEditionActionSchema,
  adminBeatActionSchema,
  adminRejectBeatSchema,
} from "@sonafrik/api/admin";
import {
  formatAdminActionError,
  getAdminServiceForAction,
  type AdminActionResult,
} from "@/features/admin/lib/getAdminActionContext";

export async function adminCloseAwardVotesAction(input: {
  editionId: string;
}): Promise<AdminActionResult> {
  const parsed = adminAwardEditionActionSchema.safeParse(input);
  if (!parsed.success) return { error: "Données invalides." };

  const ctx = await getAdminServiceForAction();
  if (!ctx.ok) return { error: ctx.error };

  try {
    await ctx.service.closeAwardVotes(parsed.data.editionId);
    revalidatePath("/admin/awards");
    return {};
  } catch (err) {
    return { error: formatAdminActionError(err, "Impossible de fermer les votes.") };
  }
}

export async function adminDistributeAwardPrizesAction(input: {
  editionId: string;
  adminNote?: string;
}): Promise<AdminActionResult> {
  const parsed = adminAwardEditionActionSchema.safeParse(input);
  if (!parsed.success) return { error: "Données invalides." };

  const ctx = await getAdminServiceForAction();
  if (!ctx.ok) return { error: ctx.error };

  try {
    await ctx.service.distributeAwardPrizes(
      parsed.data.editionId,
      parsed.data.adminNote ?? "Versement déclenché depuis le back-office",
    );
    revalidatePath("/admin/awards");
    return {};
  } catch (err) {
    return { error: formatAdminActionError(err, "Impossible de verser les prix.") };
  }
}

export async function adminApproveBeatAction(input: { beatId: string }): Promise<AdminActionResult> {
  const parsed = adminBeatActionSchema.safeParse(input);
  if (!parsed.success) return { error: "Données invalides." };

  const ctx = await getAdminServiceForAction();
  if (!ctx.ok) return { error: ctx.error };

  try {
    await ctx.service.approveBeat(parsed.data.beatId);
    revalidatePath("/admin/beatstore");
    return {};
  } catch (err) {
    return { error: formatAdminActionError(err, "Impossible d'approuver ce beat.") };
  }
}

export async function adminRejectBeatAction(input: {
  beatId: string;
  reason: string;
}): Promise<AdminActionResult> {
  const parsed = adminRejectBeatSchema.safeParse(input);
  if (!parsed.success) return { error: "Motif obligatoire (3 caractères minimum)." };

  const ctx = await getAdminServiceForAction();
  if (!ctx.ok) return { error: ctx.error };

  try {
    await ctx.service.rejectBeat(parsed.data.beatId, parsed.data.reason);
    revalidatePath("/admin/beatstore");
    return {};
  } catch (err) {
    return { error: formatAdminActionError(err, "Impossible de refuser ce beat.") };
  }
}

export async function adminDeleteBeatAction(input: { beatId: string }): Promise<AdminActionResult> {
  const parsed = adminBeatActionSchema.safeParse(input);
  if (!parsed.success) return { error: "Données invalides." };

  const ctx = await getAdminServiceForAction();
  if (!ctx.ok) return { error: ctx.error };

  try {
    await ctx.service.deleteBeat(parsed.data.beatId);
    revalidatePath("/admin/beatstore");
    return {};
  } catch (err) {
    return { error: formatAdminActionError(err, "Impossible de supprimer ce beat.") };
  }
}
