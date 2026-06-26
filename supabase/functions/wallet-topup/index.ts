/**
 * SONAFRIK — Edge Function : wallet-topup
 * Phase 1 : message pré-lancement clair + sandbox staging (TOPUP_SANDBOX).
 * Crédit réel uniquement via confirm_payment_intent (service_role).
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsJsonResponse, handleCorsPreflightIfNeeded } from "../_shared/cors.ts";

Deno.serve(async (req: Request) => {
  const preflight = handleCorsPreflightIfNeeded(req);
  if (preflight) return preflight;

  const json = (body: Record<string, unknown>, status = 200) =>
    corsJsonResponse(req, body, status);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "unauthorized" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) return json({ error: "unauthorized" }, 401);

  const topupEnabled = Deno.env.get("TOPUP_ENABLED") === "true";
  const sandboxMode = Deno.env.get("TOPUP_SANDBOX") === "true";

  if (!topupEnabled && !sandboxMode) {
    return json(
      {
        error: "topup_disabled",
        message:
          "Les recharges seront disponibles avec Orange Money GN très prochainement. Utilisez payment-initiate lorsque les opérateurs seront activés.",
        phase: "pre_launch",
      },
      423,
    );
  }

  if (sandboxMode && !topupEnabled) {
    if (!serviceRoleKey) {
      return json({ error: "sandbox_misconfigured", message: "SUPABASE_SERVICE_ROLE_KEY manquant" }, 500);
    }

    let body: { amountGnf?: number; paymentMethod?: string } = {};
    try {
      body = await req.json() as { amountGnf?: number; paymentMethod?: string };
    } catch {
      body = {};
    }

    const amountGnf = body.amountGnf ?? 5000;
    const paymentMethod = body.paymentMethod ?? "orange_money";

    if (amountGnf < 1000) return json({ error: "invalid_amount" }, 400);

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
        provider: "orange_money_gn",
        purpose: "topup",
        amount_gnf: amountGnf,
        provider_phone: "sandbox",
        status: "initiated",
        metadata: { sandbox: true, source: "wallet-topup" },
      })
      .select("id")
      .single();

    if (insertErr || !intent?.id) return json({ error: "intent_creation_failed" }, 500);

    const serviceClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: confirmed, error: confirmErr } = await serviceClient.rpc("confirm_payment_intent", {
      p_intent_id: intent.id,
      p_provider_ref: `sandbox-topup-${intent.id}`,
    });

    if (confirmErr) {
      return json({ error: "sandbox_confirm_failed", message: confirmErr.message }, 500);
    }

    return json({
      sandbox: true,
      intentId: intent.id,
      paymentMethod,
      ...(confirmed as Record<string, unknown>),
    });
  }

  return json(
    {
      error: "topup_use_payment_initiate",
      message: "Utilisez le flux payment-initiate (Orange Money, MTN MoMo, Wave).",
    },
    400,
  );
});
