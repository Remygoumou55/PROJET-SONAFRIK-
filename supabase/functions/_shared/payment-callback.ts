/**
 * Helpers partagés — callbacks webhook paiements (Vague E++).
 */
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export function createServiceClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

export async function confirmPaymentIntent(
  client: SupabaseClient,
  intentId: string,
  providerRef: string,
  logPrefix: string,
): Promise<boolean> {
  const { data, error } = await client.rpc("confirm_payment_intent", {
    p_intent_id: intentId,
    p_provider_ref: providerRef,
  });
  if (error) {
    console.error(`[${logPrefix}] confirm_payment_intent error :`, error.message);
    return false;
  }
  console.log(`[${logPrefix}] paiement confirmé :`, data);
  return true;
}

export async function markPaymentIntentFailed(
  client: SupabaseClient,
  intentId: string,
  metadata: Record<string, unknown>,
  providerRef?: string,
): Promise<boolean> {
  const { error } = await client
    .from("payment_intents")
    .update({
      status: "failed",
      failed_at: new Date().toISOString(),
      ...(providerRef ? { provider_ref: providerRef } : {}),
      metadata,
    })
    .eq("id", intentId)
    .in("status", ["initiated", "pending"]);
  if (error) {
    console.error("[payment-callback] markPaymentIntentFailed:", error.message);
    return false;
  }
  return true;
}
