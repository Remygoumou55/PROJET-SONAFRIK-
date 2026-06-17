/**
 * SONAFRIK — Edge Function : payment-wave-callback
 * Webhook Wave Guinée → confirme le payment_intent côté SONAFRIK.
 *
 * Wave envoie un POST signé (HMAC-SHA256) sur l'URL de callback enregistrée
 * lors de la création de la checkout session.
 *
 * RÈGLE ABSOLUE : toujours retourner 200 à l'opérateur pour éviter les retries.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function ok(): Response {
  return new Response("OK", { status: 200 });
}

/**
 * Vérifie la signature HMAC-SHA256 Wave.
 * Wave inclut le header "Wave-Signature" sous la forme "t=<timestamp>,v1=<hex>"
 */
async function verifyWaveSignature(
  rawBody: string,
  signatureHeader: string,
  secret: string,
): Promise<boolean> {
  try {
    const parts: Record<string, string> = {};
    for (const part of signatureHeader.split(",")) {
      const [k, v] = part.split("=");
      if (k && v) parts[k.trim()] = v.trim();
    }
    const timestamp = parts["t"];
    const v1        = parts["v1"];
    if (!timestamp || !v1) return false;

    const signedPayload = `${timestamp}.${rawBody}`;
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signedPayload));
    const hex = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
    return hex === v1;
  } catch {
    return false;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return ok();

  try {
    const rawBody = await req.text();

    // 1. Vérification signature HMAC Wave
    const secret = Deno.env.get("WAVE_WEBHOOK_SECRET");
    if (secret) {
      const sigHeader = req.headers.get("Wave-Signature") ?? "";
      if (sigHeader) {
        const valid = await verifyWaveSignature(rawBody, sigHeader, secret);
        if (!valid) {
          console.error("[wave-callback] signature HMAC invalide");
          return ok();
        }
      }
    }

    // 2. Parser le payload Wave
    // Format Wave Checkout (à adapter selon la doc Wave réelle) :
    // {
    //   id: string,                      // wave transaction id
    //   client_reference: string,        // = notre intentId
    //   payment_status: "succeeded" | "failed" | "cancelled",
    //   amount: string,
    //   currency: string,
    //   ...
    // }
    const payload = JSON.parse(rawBody) as {
      id?: string;               // = providerRef Wave
      client_reference?: string; // = notre intentId
      payment_status?: string;   // "succeeded" | "failed" | "cancelled"
      [key: string]: unknown;
    };

    const intentId    = payload.client_reference;
    const providerRef = payload.id;
    const status      = (payload.payment_status ?? "").toLowerCase();

    if (!intentId || !providerRef) {
      console.error("[wave-callback] payload incomplet :", payload);
      return ok();
    }

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 3. Succès
    if (status === "succeeded") {
      const { data, error } = await serviceClient.rpc("confirm_payment_intent", {
        p_intent_id:    intentId,
        p_provider_ref: providerRef,
      });

      if (error) {
        console.error("[wave-callback] confirm_payment_intent error :", error.message);
      } else {
        console.log("[wave-callback] paiement confirmé :", data);
      }
      return ok();
    }

    // 4. Échec ou annulation
    if (status === "failed" || status === "cancelled") {
      console.warn("[wave-callback] paiement Wave échoué :", status);
      await serviceClient
        .from("payment_intents")
        .update({
          status:    "failed",
          failed_at: new Date().toISOString(),
          metadata:  { wave_status: status },
        })
        .eq("id", intentId)
        .in("status", ["initiated", "pending"]);
    }

    return ok();
  } catch (err) {
    console.error("[wave-callback] erreur non gérée :", err);
    return ok();
  }
});
