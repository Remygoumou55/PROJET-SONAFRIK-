/**
 * SONAFRIK — Edge Function : payment-initiate
 * Crée un payment_intent en DB et initie le paiement auprès de l'opérateur.
 *
 * Corps (JSON) :
 *   provider    : "orange_money_gn" | "mtn_momo_gn" | "wave_gn" | "soutra_money"
 *   purpose     : "topup" | "subscription_*"
 *   amountGnf   : number (positif)
 *   phone       : string (numéro du payeur, ex: "+224620000000")
 *
 * Retour (JSON) :
 *   { intentId: string }
 *
 * RÈGLE FINANCIÈRE : cette fonction crée uniquement le payment_intent.
 * Le crédit wallet n'a lieu QUE via confirm_payment_intent (appelée par le webhook opérateur).
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin":  Deno.env.get("ALLOWED_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VALID_PROVIDERS = ["orange_money_gn", "mtn_momo_gn", "wave_gn", "soutra_money"];
const VALID_PURPOSES  = [
  "topup",
  "subscription_daily", "subscription_weekly",
  "subscription_monthly", "subscription_yearly", "subscription_diaspora",
];

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    // 1. Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "unauthorized" }, 401);

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return json({ error: "unauthorized" }, 401);

    // 2. Parse + validation
    const body = await req.json() as {
      provider: string;
      purpose: string;
      amountGnf: number;
      phone: string;
    };

    if (!VALID_PROVIDERS.includes(body.provider)) return json({ error: "invalid_provider" }, 400);
    if (!VALID_PURPOSES.includes(body.purpose))   return json({ error: "invalid_purpose" }, 400);
    if (!body.amountGnf || body.amountGnf < 1000) return json({ error: "invalid_amount" }, 400);
    if (!body.phone || body.phone.length < 8)     return json({ error: "invalid_phone" }, 400);

    // 3. Récupérer le wallet_id de l'utilisateur
    const { data: walletRow, error: walletErr } = await userClient
      .from("wallets" as never)
      .select("id")
      .eq("user_id" as never, user.id)
      .maybeSingle();

    if (walletErr || !walletRow) return json({ error: "wallet_not_found" }, 404);
    const walletId = (walletRow as { id: string }).id;

    // 4. Créer le payment_intent (status = 'initiated')
    const { data: intent, error: insertErr } = await userClient
      .from("payment_intents" as never)
      .insert({
        user_id:        user.id,
        wallet_id:      walletId,
        provider:       body.provider,
        purpose:        body.purpose,
        amount_gnf:     body.amountGnf,
        provider_phone: body.phone,
        status:         "initiated",
        metadata:       { initiated_from: "web" },
      } as never)
      .select("id")
      .single();

    if (insertErr || !intent) return json({ error: "intent_creation_failed" }, 500);
    const intentId = (intent as { id: string }).id;

    // 5. Initiation auprès de l'opérateur
    const isSandbox = Deno.env.get(`${body.provider.toUpperCase()}_SANDBOX`) === "true"
      || !Deno.env.get(`${body.provider.toUpperCase().replace("_GN", "").replace("_MONEY", "")}_API_KEY`);

    if (isSandbox) {
      // Mode sandbox : passer directement à 'pending' sans appel opérateur
      // Le webhook de test ou confirm_payment_intent manuel sera utilisé pour confirmer.
      await userClient
        .from("payment_intents" as never)
        .update({ status: "pending" } as never)
        .eq("id" as never, intentId);

      return json({ intentId, sandbox: true });
    }

    // --------------------------------------------------------------------------
    // TODO : intégration opérateurs (implémenter avec credentials réels)
    // --------------------------------------------------------------------------

    if (body.provider === "orange_money_gn") {
      // TODO: Appeler l'API Orange Money Guinée
      // Endpoint : Deno.env.get("ORANGE_MONEY_BASE_URL") + "/payment"
      // Auth : Bearer token obtenu via client_credentials
      // Body : { merchant_key, currency, order_id: intentId, amount, return_url, cancel_url, notif_url }
      // Docs : https://developer.orange.com/apis/omoney-guinea (accès commercial requis)
    } else if (body.provider === "mtn_momo_gn") {
      // TODO: Appeler MTN Collections API (MoMo API v1)
      // Endpoint : Deno.env.get("MTN_MOMO_BASE_URL") + "/collection/v1_0/requesttopay"
      // Auth : Bearer (généré via MTN API User + API Key)
      // Headers : X-Reference-Id: intentId, X-Target-Environment: sandbox|production
      // Body : { amount, currency, externalId: intentId, payer: { partyIdType: "MSISDN", partyId: phone } }
      // Docs : https://momodeveloper.mtn.com/
    } else if (body.provider === "wave_gn") {
      // TODO: Appeler Wave Checkout API
      // Endpoint : Deno.env.get("WAVE_BASE_URL") + "/checkout/sessions"
      // Auth : Bearer Deno.env.get("WAVE_API_KEY")
      // Body : { amount, currency, client_reference: intentId, success_url, error_url }
      // Docs : https://docs.wave.com/
    } else if (body.provider === "soutra_money") {
      // TODO: Appeler l'API Soutra Money
      // Endpoint : Deno.env.get("SOUTRA_BASE_URL") + "/payment/initiate"
      // Auth : selon doc Soutra (API Key header)
      // Body : { merchant_id, amount, reference: intentId, phone }
      // Docs : contacter support@soutra.money pour accès développeur
    }

    // --------------------------------------------------------------------------
    // Après appel opérateur réussi : passer à 'pending'
    // --------------------------------------------------------------------------
    await userClient
      .from("payment_intents" as never)
      .update({ status: "pending" } as never)
      .eq("id" as never, intentId);

    return json({ intentId });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "internal_error" }, 500);
  }
});
