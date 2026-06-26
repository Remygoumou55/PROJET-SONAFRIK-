/**
 * SONAFRIK — Edge Function : payment-mtn-callback
 * Webhook MTN MoMo GN → confirm_payment_intent (Vague E++).
 */

import { handleWebhookPreflightIfNeeded } from "../_shared/cors.ts";
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

    const secret = Deno.env.get("MTN_MOMO_CALLBACK_API_KEY");
    if (secret) {
      const apiKey = req.headers.get("X-Callback-Api-Key") ?? "";
      if (apiKey && apiKey !== secret) {
        console.error("[mtn-callback] API key invalide");
        return ok();
      }
    }

    const payload = JSON.parse(rawBody) as {
      referenceId?: string;
      financialTransactionId?: string;
      status?: string;
      reason?: { code?: string; message?: string };
    };

    const intentId = payload.referenceId;
    const providerRef = payload.financialTransactionId;
    const status = (payload.status ?? "").toUpperCase();

    if (!intentId) {
      console.error("[mtn-callback] referenceId manquant :", payload);
      return ok();
    }

    const serviceClient = createServiceClient();

    if (status === "SUCCESSFUL" && providerRef) {
      await confirmPaymentIntent(serviceClient, intentId, providerRef, "mtn-callback");
      return ok();
    }

    if (status === "FAILED") {
      await markPaymentIntentFailed(serviceClient, intentId, { mtn_reason: payload.reason });
    }

    return ok();
  } catch (err) {
    console.error("[mtn-callback] erreur non gérée :", err);
    return ok();
  }
});
