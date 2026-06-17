/**
 * SONAFRIK — Edge Function : payment-mtn-callback
 * Webhook MTN MoMo Guinée → confirme le payment_intent côté SONAFRIK.
 *
 * MTN MoMo envoie une notification POST vers l'URL de callback enregistrée
 * lors de la création de la RequestToPay.
 *
 * RÈGLE ABSOLUE : toujours retourner 200 à l'opérateur pour éviter les retries.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function ok(): Response {
  return new Response("OK", { status: 200 });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return ok();

  try {
    const rawBody = await req.text();

    // 1. Vérification de la clé de callback MTN
    const secret = Deno.env.get("MTN_MOMO_CALLBACK_API_KEY");
    if (secret) {
      const apiKey = req.headers.get("X-Callback-Api-Key") ?? "";
      if (apiKey && apiKey !== secret) {
        console.error("[mtn-callback] API key invalide");
        return ok();
      }
    }

    // 2. Parser le payload MTN MoMo
    // Format MTN MoMo v1 (RequestToPay notification) :
    // {
    //   referenceId: string,           // = notre intentId (X-Reference-Id envoyé lors de l'initiation)
    //   status: "SUCCESSFUL"|"FAILED",
    //   reason?: { code, message },
    //   financialTransactionId?: string
    // }
    const payload = JSON.parse(rawBody) as {
      referenceId?: string;            // = notre intentId
      financialTransactionId?: string; // référence MTN
      status?: string;                 // "SUCCESSFUL" | "FAILED" | "PENDING"
      reason?: { code?: string; message?: string };
      [key: string]: unknown;
    };

    const intentId    = payload.referenceId;
    const providerRef = payload.financialTransactionId;
    const status      = (payload.status ?? "").toUpperCase();

    if (!intentId) {
      console.error("[mtn-callback] referenceId manquant :", payload);
      return ok();
    }

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 3. Succès → confirmer
    if (status === "SUCCESSFUL" && providerRef) {
      const { data, error } = await serviceClient.rpc("confirm_payment_intent", {
        p_intent_id:    intentId,
        p_provider_ref: providerRef,
      });

      if (error) {
        console.error("[mtn-callback] confirm_payment_intent error :", error.message);
      } else {
        console.log("[mtn-callback] paiement confirmé :", data);
      }
      return ok();
    }

    // 4. Échec → marquer comme failed
    if (status === "FAILED") {
      console.warn("[mtn-callback] paiement MTN échoué, raison :", payload.reason);
      await serviceClient
        .from("payment_intents")
        .update({
          status:    "failed",
          failed_at: new Date().toISOString(),
          metadata:  { mtn_reason: payload.reason },
        })
        .eq("id", intentId)
        .in("status", ["initiated", "pending"]);
    }

    // 5. PENDING : ne rien faire, attendre la prochaine notification
    return ok();
  } catch (err) {
    console.error("[mtn-callback] erreur non gérée :", err);
    return ok();
  }
});
