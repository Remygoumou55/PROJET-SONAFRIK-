/**
 * SONAFRIK — Edge Function : payment-initiate
 * Crée un payment_intent et initie le paiement chez l'opérateur (Vague E).
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  type PaymentProvider,
  assertPaymentOperatorReady,
  getWebBaseUrl,
  initiateMtnMomo,
  initiateOrangeMoney,
  initiateSoutraMoney,
  initiateWaveCheckout,
  isProviderSandbox,
} from "../_shared/payments.ts";
import { corsJsonResponse, handleCorsPreflightIfNeeded } from "../_shared/cors.ts";

const VALID_PROVIDERS: PaymentProvider[] = [
  "orange_money_gn",
  "mtn_momo_gn",
  "wave_gn",
  "soutra_money",
];
const VALID_PURPOSES = [
  "topup",
  "subscription_daily",
  "subscription_weekly",
  "subscription_monthly",
  "subscription_yearly",
  "subscription_diaspora",
];

async function initiateOperator(
  provider: PaymentProvider,
  intentId: string,
  amountGnf: number,
  phone: string,
): Promise<{
  checkoutUrl?: string;
  providerRef?: string;
  metadata: Record<string, unknown>;
  ussdPush?: boolean;
}> {
  switch (provider) {
    case "wave_gn":
      return initiateWaveCheckout(intentId, amountGnf, phone);
    case "mtn_momo_gn":
      return initiateMtnMomo(intentId, amountGnf, phone);
    case "orange_money_gn":
      return initiateOrangeMoney(intentId, amountGnf, phone);
    case "soutra_money":
      return initiateSoutraMoney(intentId, amountGnf, phone);
  }
}

Deno.serve(async (req: Request) => {
  const preflight = handleCorsPreflightIfNeeded(req);
  if (preflight) return preflight;

  const json = (body: Record<string, unknown>, status = 200) =>
    corsJsonResponse(req, body, status);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "unauthorized" }, 401);

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return json({ error: "unauthorized" }, 401);

    const body = await req.json() as {
      provider: string;
      purpose: string;
      amountGnf: number;
      phone: string;
    };

    if (!VALID_PROVIDERS.includes(body.provider as PaymentProvider)) {
      return json({ error: "invalid_provider" }, 400);
    }
    if (!VALID_PURPOSES.includes(body.purpose)) return json({ error: "invalid_purpose" }, 400);
    if (!body.amountGnf || body.amountGnf < 1000) return json({ error: "invalid_amount" }, 400);
    if (!body.phone || body.phone.length < 8) return json({ error: "invalid_phone" }, 400);

    const provider = body.provider as PaymentProvider;

    const { data: walletRow, error: walletErr } = await userClient
      .from("wallets")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (walletErr || !walletRow?.id) return json({ error: "wallet_not_found" }, 404);

    const { data: intent, error: insertErr } = await userClient
      .from("payment_intents")
      .insert({
        user_id: user.id,
        wallet_id: walletRow.id,
        provider,
        purpose: body.purpose,
        amount_gnf: body.amountGnf,
        provider_phone: body.phone,
        status: "initiated",
        metadata: { initiated_from: "web", web_base_url: getWebBaseUrl() },
      })
      .select("id")
      .single();

    if (insertErr || !intent?.id) return json({ error: "intent_creation_failed" }, 500);
    const intentId = intent.id;

    try {
      assertPaymentOperatorReady(provider);
    } catch (err) {
      const message = err instanceof Error ? err.message : "payment_operator_not_ready";
      await userClient
        .from("payment_intents")
        .update({
          status: "failed",
          failed_at: new Date().toISOString(),
          metadata: { operator_error: message },
        })
        .eq("id", intentId);
      return json({ error: "payment_operator_not_ready", message }, 503);
    }

    if (isProviderSandbox(provider)) {
      const { error: updateErr } = await userClient
        .from("payment_intents")
        .update({
          status: "pending",
          metadata: { sandbox: true, initiated_from: "web" },
        })
        .eq("id", intentId);

      if (updateErr) return json({ error: "intent_update_failed" }, 500);

      return json({ intentId, sandbox: true, ussdPush: provider !== "wave_gn" });
    }

    try {
      const op = await initiateOperator(provider, intentId, body.amountGnf, body.phone);

      const { error: updateErr } = await userClient
        .from("payment_intents")
        .update({
          status: "pending",
          provider_ref: op.providerRef ?? null,
          metadata: {
            initiated_from: "web",
            ...op.metadata,
          },
        })
        .eq("id", intentId);

      if (updateErr) return json({ error: "intent_update_failed" }, 500);

      return json({
        intentId,
        checkoutUrl: op.checkoutUrl,
        ussdPush: op.ussdPush ?? provider !== "wave_gn",
        provider,
      });
    } catch (err) {
      const operatorMessage = err instanceof Error ? err.message : "operator_failed";
      const { error: failUpdateErr } = await userClient
        .from("payment_intents")
        .update({
          status: "failed",
          failed_at: new Date().toISOString(),
          metadata: {
            operator_error: operatorMessage,
          },
        })
        .eq("id", intentId);

      if (failUpdateErr) {
        console.error("[payment-initiate] failed status update:", failUpdateErr.message);
      }

      return json(
        { error: "provider_error", message: operatorMessage },
        502,
      );
    }
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "internal_error" }, 500);
  }
});
