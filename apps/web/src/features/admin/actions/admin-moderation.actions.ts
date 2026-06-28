"use server";

import { revalidatePath } from "next/cache";
import {
  adminChangeArtistTierSchema,
  adminDeleteUserSchema,
  adminSuspendCreatorSchema,
  adminSuspendUserSchema,
  adminVerifyArtistSchema,
  adminWarnUserSchema,
} from "@sonafrik/api/admin";
import {
  getAdminServiceForAction,
  formatAdminActionError,
  type AdminActionResult,
} from "@/features/admin/lib/getAdminActionContext";

function selfTargetError(userId: string, actorId: string | null, action: string): string | null {
  if (actorId && userId === actorId) {
    return `Vous ne pouvez pas ${action} votre propre compte.`;
  }
  return null;
}

export async function adminWarnUserAction(input: {
  userId: string;
  reason?: string;
  adminNote?: string;
}): Promise<AdminActionResult> {
  const parsed = adminWarnUserSchema.safeParse(input);
  if (!parsed.success) return { error: "Données invalides." };

  const ctx = await getAdminServiceForAction();
  if (!ctx.ok) return { error: ctx.error };

  try {
    await ctx.service.warnUser(
      parsed.data.userId,
      parsed.data.reason ?? "Avertissement administrateur",
      parsed.data.adminNote ?? "",
    );
    revalidatePath("/admin/users");
    revalidatePath("/admin/artists");
    return {};
  } catch (err) {
    return { error: formatAdminActionError(err, "Impossible d'envoyer l'avertissement.") };
  }
}

export async function adminSuspendUserAction(input: {
  userId: string;
  durationDays?: number;
  reason?: string;
}): Promise<AdminActionResult> {
  const parsed = adminSuspendUserSchema.safeParse(input);
  if (!parsed.success) return { error: "Données invalides." };

  const ctx = await getAdminServiceForAction();
  if (!ctx.ok) return { error: ctx.error };

  const selfErr = selfTargetError(parsed.data.userId, ctx.userId, "suspendre");
  if (selfErr) return { error: selfErr };

  try {
    await ctx.service.suspendUser(
      parsed.data.userId,
      parsed.data.durationDays ?? 30,
      parsed.data.reason ?? "Suspension par l'administrateur",
    );
    revalidatePath("/admin/users");
    return {};
  } catch (err) {
    return { error: formatAdminActionError(err, "Impossible de suspendre le compte.") };
  }
}

export async function adminDeleteUserAction(input: {
  userId: string;
  reason?: string;
}): Promise<AdminActionResult> {
  const parsed = adminDeleteUserSchema.safeParse(input);
  if (!parsed.success) return { error: "Données invalides." };

  const ctx = await getAdminServiceForAction();
  if (!ctx.ok) return { error: ctx.error };

  const selfErr = selfTargetError(parsed.data.userId, ctx.userId, "supprimer");
  if (selfErr) return { error: selfErr };

  try {
    await ctx.service.deleteUser(
      parsed.data.userId,
      parsed.data.reason ?? "Suppression définitive par l'administrateur",
    );
    revalidatePath("/admin/users");
    return {};
  } catch (err) {
    return { error: formatAdminActionError(err, "Impossible de supprimer le compte.") };
  }
}

export async function adminVerifyArtistAction(input: {
  creatorId: string;
  approved: boolean;
  note?: string;
}): Promise<AdminActionResult> {
  const parsed = adminVerifyArtistSchema.safeParse(input);
  if (!parsed.success) return { error: "Données invalides." };

  const ctx = await getAdminServiceForAction();
  if (!ctx.ok) return { error: ctx.error };

  try {
    await ctx.service.verifyArtist(parsed.data.creatorId, parsed.data.approved, parsed.data.note ?? "");
    revalidatePath("/admin/artists");
    return {};
  } catch (err) {
    return { error: formatAdminActionError(err, "Impossible de traiter la vérification.") };
  }
}

export async function adminChangeArtistTierAction(input: {
  creatorId: string;
  newTier: "emergent" | "croissance" | "etabli";
}): Promise<AdminActionResult> {
  const parsed = adminChangeArtistTierSchema.safeParse(input);
  if (!parsed.success) return { error: "Tier invalide." };

  const ctx = await getAdminServiceForAction();
  if (!ctx.ok) return { error: ctx.error };

  try {
    await ctx.service.changeArtistTier(parsed.data.creatorId, parsed.data.newTier);
    revalidatePath("/admin/artists");
    return {};
  } catch (err) {
    return { error: formatAdminActionError(err, "Impossible de modifier le tier.") };
  }
}

export async function adminSuspendCreatorAction(input: {
  creatorId: string;
  reason?: string;
}): Promise<AdminActionResult> {
  const parsed = adminSuspendCreatorSchema.safeParse(input);
  if (!parsed.success) return { error: "Données invalides." };

  const ctx = await getAdminServiceForAction();
  if (!ctx.ok) return { error: ctx.error };

  try {
    await ctx.service.suspendCreator(
      parsed.data.creatorId,
      parsed.data.reason ?? "Suspension artiste par l'administrateur",
    );
    revalidatePath("/admin/artists");
    return {};
  } catch (err) {
    return { error: formatAdminActionError(err, "Impossible de suspendre l'artiste.") };
  }
}

export async function adminWarnCreatorAction(input: {
  ownerId: string;
  artistName: string;
}): Promise<AdminActionResult> {
  const parsed = adminWarnUserSchema.safeParse({
    userId: input.ownerId,
    reason: "Avertissement artiste",
    adminNote: `Avertissement envoyé à ${input.artistName}`,
  });
  if (!parsed.success) return { error: "Données invalides." };

  const ctx = await getAdminServiceForAction();
  if (!ctx.ok) return { error: ctx.error };

  try {
    await ctx.service.warnCreatorOwner(
      parsed.data.userId,
      parsed.data.reason ?? "Avertissement artiste",
      parsed.data.adminNote ?? `Avertissement envoyé à ${input.artistName}`,
    );
    revalidatePath("/admin/artists");
    return {};
  } catch (err) {
    return { error: formatAdminActionError(err, "Impossible d'envoyer l'avertissement.") };
  }
};

export async function adminReviewCatalogAction(input: {
  id: string;
  entityType: "album" | "track";
  action: "published" | "rejected";
  reason?: string;
}): Promise<AdminActionResult> {
  if (!input.id || (input.entityType !== "album" && input.entityType !== "track")) {
    return { error: "Données invalides." };
  }
  if (input.action !== "published" && input.action !== "rejected") {
    return { error: "Action invalide." };
  }
  if (input.action === "rejected" && !input.reason?.trim()) {
    return { error: "Motif de rejet requis." };
  }

  const ctx = await getAdminServiceForAction();
  if (!ctx.ok) return { error: ctx.error };

  try {
    await ctx.service.reviewCatalogItem(
      input.id,
      input.entityType,
      input.action,
      input.reason?.trim(),
    );
    revalidatePath("/admin/catalog");
    revalidatePath("/admin");
    return {};
  } catch (err) {
    return { error: formatAdminActionError(err, "Impossible de traiter la soumission.") };
  }
}
