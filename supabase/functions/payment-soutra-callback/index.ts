/**
 * SONAFRIK — Edge Function : payment-soutra-callback
 * Webhook Soutra Money → confirm_payment_intent (Vague E++).
 */

import { verifyHmacSha256 } from "../_shared/payments.ts";
import {
  confirmPaymentIntent,
  createServiceClient,
  markPaymentIntentFailed,
} from "../_shared/payment-callback.ts";

function ok(): Response {
  return new Response("OK", { status: 200 });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return ok();

  try {
    const rawBody = await req.text();

    const secret = Deno.env.get("SOUTRA_WEBHOOK_SECRET");
    if (secret) {
      const sigHeader = req.headers.get("X-Soutra-Signature") ?? "";
      if (sigHeader) {
        const valid = sigHeader.includes("v1=")
          ? await verifyHmacSha256(rawBody, sigHeader, secret)
          : sigHeader === secret;
        if (!valid) {
          console.error("[soutra-callback] signature invalide");
          return ok();
        }
      }
    }

    const payload = JSON.parse(rawBody) as {
      reference?: string;
      transaction_id?: string;
      status?: string;
    };

    const intentId = payload.reference;
    const providerRef = payload.transaction_id;
    const status = (payload.status ?? "").toUpperCase();

    if (!intentId || !providerRef) {
      console.error("[soutra-callback] payload incomplet :", payload);
      return ok();
    }

    const serviceClient = createServiceClient();

    if (status === "SUCCESS") {
      await confirmPaymentIntent(serviceClient, intentId, providerRef, "soutra-callback");
      return ok();
    }

    if (status === "FAILED") {
      await markPaymentIntentFailed(serviceClient, intentId, { soutra_status: status });
    }

    return ok();
  } catch (err) {
    console.error("[soutra-callback] erreur non gérée :", err);
    return ok();
  }
});
