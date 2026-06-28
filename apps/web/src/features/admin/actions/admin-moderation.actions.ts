"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  createAdminService,
  adminChangeArtistTierSchema,
  adminDeleteUserSchema,
  adminSuspendCreatorSchema,
  adminSuspendUserSchema,
  adminVerifyArtistSchema,
  adminWarnUserSchema,
} from "@sonafrik/api/admin";
import { verifyAdminForAction } from "@/features/admin/lib/requireAdmin";

async function getModerationService() {
  const auth = await verifyAdminForAction();
  if (!auth.ok) return { error: auth.error as string, service: null, userId: null };

  const supabase = await getSupabaseServerClient();
  return { error: null, service: createAdminService(supabase), userId: auth.userId };
}

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
}): Promise<{ error?: string }> {
  const parsed = adminWarnUserSchema.safeParse(input);
  if (!parsed.success) return { error: "Données invalides." };

  const { error, service } = await getModerationService();
  if (error || !service) return { error: error ?? "Accès refusé." };

  try {
    await service.warnUser(
      parsed.data.userId,
      parsed.data.reason ?? "Avertissement administrateur",
      parsed.data.adminNote ?? "",
    );
    revalidatePath("/admin/users");
    revalidatePath("/admin/artists");
    return {};
  } catch {
    return { error: "Impossible d'envoyer l'avertissement." };
  }
}

export async function adminSuspendUserAction(input: {
  userId: string;
  durationDays?: number;
  reason?: string;
}): Promise<{ error?: string }> {
  const parsed = adminSuspendUserSchema.safeParse(input);
  if (!parsed.success) return { error: "Données invalides." };

  const { error, service, userId } = await getModerationService();
  if (error || !service) return { error: error ?? "Accès refusé." };

  const selfErr = selfTargetError(parsed.data.userId, userId, "suspendre");
  if (selfErr) return { error: selfErr };

  try {
    await service.suspendUser(
      parsed.data.userId,
      parsed.data.durationDays ?? 30,
      parsed.data.reason ?? "Suspension par l'administrateur",
    );
    revalidatePath("/admin/users");
    return {};
  } catch {
    return { error: "Impossible de suspendre le compte." };
  }
}

export async function adminDeleteUserAction(input: {
  userId: string;
  reason?: string;
}): Promise<{ error?: string }> {
  const parsed = adminDeleteUserSchema.safeParse(input);
  if (!parsed.success) return { error: "Données invalides." };

  const { error, service, userId } = await getModerationService();
  if (error || !service) return { error: error ?? "Accès refusé." };

  const selfErr = selfTargetError(parsed.data.userId, userId, "supprimer");
  if (selfErr) return { error: selfErr };

  try {
    await service.deleteUser(
      parsed.data.userId,
      parsed.data.reason ?? "Suppression définitive par l'administrateur",
    );
    revalidatePath("/admin/users");
    return {};
  } catch {
    return { error: "Impossible de supprimer le compte." };
  }
}

export async function adminVerifyArtistAction(input: {
  creatorId: string;
  approved: boolean;
  note?: string;
}): Promise<{ error?: string }> {
  const parsed = adminVerifyArtistSchema.safeParse(input);
  if (!parsed.success) return { error: "Données invalides." };

  const { error, service } = await getModerationService();
  if (error || !service) return { error: error ?? "Accès refusé." };

  try {
    await service.verifyArtist(parsed.data.creatorId, parsed.data.approved, parsed.data.note ?? "");
    revalidatePath("/admin/artists");
    return {};
  } catch {
    return { error: "Impossible de traiter la vérification." };
  }
}

export async function adminChangeArtistTierAction(input: {
  creatorId: string;
  newTier: "emergent" | "croissance" | "etabli";
}): Promise<{ error?: string }> {
  const parsed = adminChangeArtistTierSchema.safeParse(input);
  if (!parsed.success) return { error: "Tier invalide." };

  const { error, service } = await getModerationService();
  if (error || !service) return { error: error ?? "Accès refusé." };

  try {
    await service.changeArtistTier(parsed.data.creatorId, parsed.data.newTier);
    revalidatePath("/admin/artists");
    return {};
  } catch {
    return { error: "Impossible de modifier le tier." };
  }
}

export async function adminSuspendCreatorAction(input: {
  creatorId: string;
  reason?: string;
}): Promise<{ error?: string }> {
  const parsed = adminSuspendCreatorSchema.safeParse(input);
  if (!parsed.success) return { error: "Données invalides." };

  const { error, service } = await getModerationService();
  if (error || !service) return { error: error ?? "Accès refusé." };

  try {
    await service.suspendCreator(
      parsed.data.creatorId,
      parsed.data.reason ?? "Suspension artiste par l'administrateur",
    );
    revalidatePath("/admin/artists");
    return {};
  } catch {
    return { error: "Impossible de suspendre l'artiste." };
  }
}

export async function adminWarnCreatorAction(input: {
  ownerId: string;
  artistName: string;
}): Promise<{ error?: string }> {
  const parsed = adminWarnUserSchema.safeParse({
    userId: input.ownerId,
    reason: "Avertissement artiste",
    adminNote: `Avertissement envoyé à ${input.artistName}`,
  });
  if (!parsed.success) return { error: "Données invalides." };

  const { error, service } = await getModerationService();
  if (error || !service) return { error: error ?? "Accès refusé." };

  try {
    await service.warnCreatorOwner(
      parsed.data.userId,
      parsed.data.reason ?? "Avertissement artiste",
      parsed.data.adminNote ?? `Avertissement envoyé à ${input.artistName}`,
    );
    revalidatePath("/admin/artists");
    return {};
  } catch {
    return { error: "Impossible d'envoyer l'avertissement." };
  }
}
