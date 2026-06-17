/**
 * SONAFRIK — Edge Function : payment-orange-callback
 * Webhook Orange Money Guinée → confirme le payment_intent côté SONAFRIK.
 *
 * RÈGLE ABSOLUE : toujours retourner 200 à l'opérateur pour éviter les retries.
 * Le crédit wallet est effectué par confirm_payment_intent (SECURITY DEFINER).
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function ok(): Response {
  return new Response("OK", { status: 200 });
}

Deno.serve(async (req: Request) => {
  // OPTIONS preflight — pas attendu d'un webhook opérateur mais géré par sécurité
  if (req.method === "OPTIONS") return ok();

  try {
    const rawBody = await req.text();

    // 1. Vérification du secret partagé Orange (header X-Orange-Signature ou query param)
    const secret = Deno.env.get("ORANGE_MONEY_WEBHOOK_SECRET");
    if (secret) {
      const sig = req.headers.get("X-Orange-Signature") ?? "";
      // Orange Money GN utilise une signature HMAC-SHA256 ou un header propriétaire.
      // TODO: remplacer par la validation HMAC réelle selon la doc Orange.
      // Pour l'instant : comparaison simple du secret si présent dans le header.
      if (sig && sig !== secret) {
        console.error("[orange-callback] signature invalide");
        return ok(); // Toujours 200 même en rejet
      }
    }

    // 2. Parser le payload Orange Money
    // Format attendu (à adapter selon la doc Orange Money GN réelle) :
    // { order_id, transaction_id, status, amount, currency, ... }
    const payload = JSON.parse(rawBody) as {
      order_id?: string;          // = notre intentId
      transaction_id?: string;    // référence opérateur
      status?: string;            // "SUCCESS" | "FAILED" | ...
      amount?: number;
      currency?: string;
      [key: string]: unknown;
    };

    const intentId    = payload.order_id;
    const providerRef = payload.transaction_id;
    const status      = (payload.status ?? "").toUpperCase();

    if (!intentId || !providerRef) {
      console.error("[orange-callback] payload incomplet :", payload);
      return ok();
    }

    // 3. Traitement uniquement des paiements réussis
    if (status !== "SUCCESS") {
      console.warn("[orange-callback] statut non-SUCCESS :", status, "pour intent", intentId);

      // Marquer comme failed si explicitement rejeté
      if (status === "FAILED" || status === "CANCELLED" || status === "EXPIRED") {
        const serviceClient = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        );
        await serviceClient
          .from("payment_intents")
          .update({ status: "failed", provider_ref: providerRef, failed_at: new Date().toISOString() })
          .eq("id", intentId)
          .in("status", ["initiated", "pending"]);
      }
      return ok();
    }

    // 4. Confirmer le paiement via RPC SECURITY DEFINER (service_role uniquement)
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data, error } = await serviceClient.rpc("confirm_payment_intent", {
      p_intent_id:   intentId,
      p_provider_ref: providerRef,
    });

    if (error) {
      console.error("[orange-callback] confirm_payment_intent error :", error.message);
    } else {
      console.log("[orange-callback] paiement confirmé :", data);
    }

    // 5. Toujours 200 pour éviter les retries Orange
    return ok();
  } catch (err) {
    console.error("[orange-callback] erreur non gérée :", err);
    return ok(); // Toujours 200
  }
});
