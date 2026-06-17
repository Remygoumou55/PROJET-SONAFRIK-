/**
 * SONAFRIK — Edge Function : payment-soutra-callback
 * Webhook Soutra Money → confirme le payment_intent côté SONAFRIK.
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

    // 1. Vérification du secret Soutra Money
    const secret = Deno.env.get("SOUTRA_WEBHOOK_SECRET");
    if (secret) {
      const sig = req.headers.get("X-Soutra-Signature") ?? "";
      if (sig && sig !== secret) {
        console.error("[soutra-callback] signature invalide");
        return ok();
      }
    }

    // 2. Parser le payload Soutra Money
    // Format Soutra Money (à adapter selon leur documentation) :
    // {
    //   reference: string,        // = notre intentId
    //   transaction_id: string,   // référence Soutra
    //   status: "SUCCESS" | "FAILED" | "PENDING",
    //   amount: number,
    //   currency: string,
    //   phone: string,
    //   ...
    // }
    const payload = JSON.parse(rawBody) as {
      reference?: string;      // = notre intentId
      transaction_id?: string; // référence opérateur
      status?: string;         // "SUCCESS" | "FAILED" | "PENDING"
      [key: string]: unknown;
    };

    const intentId    = payload.reference;
    const providerRef = payload.transaction_id;
    const status      = (payload.status ?? "").toUpperCase();

    if (!intentId || !providerRef) {
      console.error("[soutra-callback] payload incomplet :", payload);
      return ok();
    }

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 3. Succès
    if (status === "SUCCESS") {
      const { data, error } = await serviceClient.rpc("confirm_payment_intent", {
        p_intent_id:    intentId,
        p_provider_ref: providerRef,
      });

      if (error) {
        console.error("[soutra-callback] confirm_payment_intent error :", error.message);
      } else {
        console.log("[soutra-callback] paiement confirmé :", data);
      }
      return ok();
    }

    // 4. Échec
    if (status === "FAILED") {
      console.warn("[soutra-callback] paiement Soutra échoué pour intent", intentId);
      await serviceClient
        .from("payment_intents")
        .update({
          status:    "failed",
          failed_at: new Date().toISOString(),
        })
        .eq("id", intentId)
        .in("status", ["initiated", "pending"]);
    }

    // PENDING → attendre la prochaine notification
    return ok();
  } catch (err) {
    console.error("[soutra-callback] erreur non gérée :", err);
    return ok();
  }
});
