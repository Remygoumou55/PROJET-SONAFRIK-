/**
 * SONAFRIK — Edge Function : payment-orange-callback
 * Webhook Orange Money GN → confirm_payment_intent (Vague E++).
 */

import { handleWebhookPreflightIfNeeded } from "../_shared/cors.ts";
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
  const preflight = handleWebhookPreflightIfNeeded(req);
  if (preflight) return preflight;

  try {
    const rawBody = await req.text();

    const secret = Deno.env.get("ORANGE_MONEY_WEBHOOK_SECRET");
    if (secret) {
      const sigHeader = req.headers.get("X-Orange-Signature") ?? req.headers.get("Orange-Signature") ?? "";
      if (sigHeader) {
        const valid = sigHeader.includes("v1=")
          ? await verifyHmacSha256(rawBody, sigHeader, secret)
          : sigHeader === secret;
        if (!valid) {
          console.error("[orange-callback] signature invalide");
          return ok();
        }
      }
    }

    const payload = JSON.parse(rawBody) as {
      order_id?: string;
      transaction_id?: string;
      status?: string;
    };

    const intentId = payload.order_id;
    const providerRef = payload.transaction_id;
    const status = (payload.status ?? "").toUpperCase();

    if (!intentId || !providerRef) {
      console.error("[orange-callback] payload incomplet :", payload);
      return ok();
    }

    const serviceClient = createServiceClient();

    if (status !== "SUCCESS") {
      if (status === "FAILED" || status === "CANCELLED" || status === "EXPIRED") {
        await markPaymentIntentFailed(serviceClient, intentId, { orange_status: status }, providerRef);
      }
      return ok();
    }

    await confirmPaymentIntent(serviceClient, intentId, providerRef, "orange-callback");
    return ok();
  } catch (err) {
    console.error("[orange-callback] erreur non gérée :", err);
    return ok();
  }
});
