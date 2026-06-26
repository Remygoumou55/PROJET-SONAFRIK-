/**
 * SONAFRIK — Edge Function : payment-wave-callback
 * Webhook Wave → confirm_payment_intent (Vague E++).
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

type WavePayload = {
  id?: string;
  client_reference?: string;
  payment_status?: string;
  transaction_id?: string;
  checkout_status?: string;
  data?: WavePayload;
  type?: string;
};

function extractWaveIntent(payload: WavePayload): {
  intentId?: string;
  providerRef?: string;
  status?: string;
} {
  const root = payload.data ?? payload;
  const intentId = root.client_reference;
  const providerRef = root.transaction_id ?? root.id;
  const status = (root.payment_status ?? root.checkout_status ?? "").toLowerCase();
  return { intentId, providerRef, status };
}

Deno.serve(async (req: Request) => {
  const preflight = handleWebhookPreflightIfNeeded(req);
  if (preflight) return preflight;

  try {
    const rawBody = await req.text();

    const secret = Deno.env.get("WAVE_WEBHOOK_SECRET");
    if (secret) {
      const sigHeader = req.headers.get("Wave-Signature") ?? req.headers.get("X-Wave-Signature") ?? "";
      if (sigHeader) {
        const valid = await verifyHmacSha256(rawBody, sigHeader, secret);
        if (!valid) {
          console.error("[wave-callback] signature HMAC invalide");
          return ok();
        }
      }
    }

    const payload = JSON.parse(rawBody) as WavePayload;
    const { intentId, providerRef, status } = extractWaveIntent(payload);

    if (!intentId || !providerRef) {
      console.error("[wave-callback] payload incomplet :", payload);
      return ok();
    }

    const serviceClient = createServiceClient();

    if (status === "succeeded" || status === "complete") {
      await confirmPaymentIntent(serviceClient, intentId, providerRef, "wave-callback");
      return ok();
    }

    if (status === "failed" || status === "cancelled" || status === "expired") {
      await markPaymentIntentFailed(serviceClient, intentId, { wave_status: status });
    }

    return ok();
  } catch (err) {
    console.error("[wave-callback] erreur non gérée :", err);
    return ok();
  }
});
