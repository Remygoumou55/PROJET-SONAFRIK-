import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { createAdminService, type AdminService, AdminError } from "@sonafrik/api/admin";
import { createPayoutService, PayoutEngineError, type PayoutService } from "@sonafrik/api/payout";
import type { SonafrikSupabaseClient } from "@sonafrik/database";
import { PAYOUT_ENGINE_ERROR_MESSAGES, ADMIN_ERROR_MESSAGES } from "@sonafrik/types";
import { verifyAdminForAction } from "./requireAdmin";
import { ADMIN_ACTION_FALLBACK_ERROR } from "./adminActionShared";

export type { AdminActionResult } from "./adminActionShared";

type ActionAuth =
  | { ok: true; userId: string }
  | { ok: false; error: string };

async function verifyAdminAction(): Promise<ActionAuth> {
  const auth = await verifyAdminForAction();
  if (!auth.ok) return { ok: false, error: auth.error };
  return { ok: true, userId: auth.userId };
}

/**
 * Client mutations admin — service_role après verifyAdmin (auth.role() = service_role en RPC).
 * Ne pas utiliser le client session : fetchBypassMode() neutralise les RPC en BYPASS_AUTH local.
 */
async function getAdminMutationClient(): Promise<SonafrikSupabaseClient> {
  return getSupabaseAdminClient({ adminVerified: true });
}

export async function getAdminServiceForAction(): Promise<
  | { ok: true; service: AdminService; userId: string }
  | { ok: false; error: string }
> {
  const auth = await verifyAdminAction();
  if (!auth.ok) return auth;

  const supabase = await getAdminMutationClient();
  return { ok: true, service: createAdminService(supabase), userId: auth.userId };
}

export async function getPayoutServiceForAction(): Promise<
  | { ok: true; service: PayoutService; userId: string }
  | { ok: false; error: string }
> {
  const auth = await verifyAdminAction();
  if (!auth.ok) return auth;

  const supabase = await getAdminMutationClient();
  return { ok: true, service: createPayoutService(supabase), userId: auth.userId };
}

export function formatAdminActionError(err: unknown, fallback = ADMIN_ACTION_FALLBACK_ERROR): string {
  if (err instanceof AdminError) return err.message;
  if (err instanceof PayoutEngineError) return err.message;
  if (err && typeof err === "object" && "code" in err && "message" in err) {
    const code = String((err as { code: string }).code);
    const msg = String((err as { message: string }).message).trim();
    if (msg && msg !== ADMIN_ERROR_MESSAGES.update_failed) return msg;
    if (code && code in ADMIN_ERROR_MESSAGES) {
      const mapped = ADMIN_ERROR_MESSAGES[code as keyof typeof ADMIN_ERROR_MESSAGES];
      if (mapped) return mapped;
    }
    if (msg) return msg;
  }
  if (err instanceof Error && err.message.trim()) return err.message.trim();
  return fallback;
}

export function formatPayoutActionError(err: unknown): string {
  return formatAdminActionError(
    err,
    PAYOUT_ENGINE_ERROR_MESSAGES.unknown ?? "Une erreur est survenue.",
  );
}
