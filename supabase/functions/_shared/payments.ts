/**
 * Helpers partagés — Edge Functions paiements (Vague E).
 */

export type PaymentProvider =
  | "orange_money_gn"
  | "mtn_momo_gn"
  | "wave_gn"
  | "soutra_money";

export interface OperatorInitResult {
  checkoutUrl?: string;
  providerRef?: string;
  metadata: Record<string, unknown>;
  ussdPush?: boolean;
}

/** Détecte le mode sandbox (env explicite ou clé API absente). */
export function isProviderSandbox(provider: PaymentProvider): boolean {
  const envKey = `${provider.toUpperCase()}_SANDBOX`;
  if (Deno.env.get(envKey) === "true") return true;

  switch (provider) {
    case "orange_money_gn":
      return !Deno.env.get("ORANGE_MONEY_API_KEY");
    case "mtn_momo_gn":
      return !Deno.env.get("MTN_MOMO_API_KEY");
    case "wave_gn":
      return !Deno.env.get("WAVE_API_KEY");
    case "soutra_money":
      return !Deno.env.get("SOUTRA_API_KEY");
  }
}

export function getWebBaseUrl(): string {
  return (
    Deno.env.get("SONAFRIK_WEB_URL") ??
    Deno.env.get("NEXT_PUBLIC_APP_URL") ??
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

export async function verifyHmacSha256(
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
    const v1 = parts["v1"];
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
    const hex = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
    return hex === v1;
  } catch {
    return false;
  }
}

/** Wave Checkout — POST /v1/checkout/sessions */
export async function initiateWaveCheckout(
  intentId: string,
  amountGnf: number,
  phone: string,
): Promise<OperatorInitResult> {
  const baseUrl = Deno.env.get("WAVE_BASE_URL") ?? "https://api.wave.com/v1";
  const apiKey = Deno.env.get("WAVE_API_KEY");
  if (!apiKey) throw new Error("wave_api_key_missing");

  const webBase = getWebBaseUrl();
  const body: Record<string, string> = {
    amount: String(Math.round(amountGnf)),
    currency: "GNF",
    client_reference: intentId,
    success_url: `${webBase}/wallet?topup=success`,
    error_url: `${webBase}/wallet?topup=error`,
  };

  const normalizedPhone = phone.startsWith("+") ? phone : `+224${phone.replace(/\D/g, "")}`;
  if (normalizedPhone.length >= 10) {
    body.restrict_payer_mobile = normalizedPhone;
  }

  const res = await fetch(`${baseUrl}/checkout/sessions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const payload = await res.json().catch(() => ({})) as {
    id?: string;
    wave_launch_url?: string;
    message?: string;
  };

  if (!res.ok) {
    throw new Error(payload.message ?? `wave_checkout_failed_${res.status}`);
  }

  return {
    checkoutUrl: payload.wave_launch_url,
    providerRef: payload.id,
    metadata: {
      wave_session_id: payload.id,
      wave_launch_url: payload.wave_launch_url,
    },
  };
}

/** MTN MoMo Collections — requestToPay (push USSD). */
export async function initiateMtnMomo(
  intentId: string,
  amountGnf: number,
  phone: string,
): Promise<OperatorInitResult> {
  const baseUrl = Deno.env.get("MTN_MOMO_BASE_URL") ?? "https://sandbox.momodeveloper.mtn.com";
  const subscriptionKey = Deno.env.get("MTN_MOMO_SUBSCRIPTION_KEY");
  const apiKey = Deno.env.get("MTN_MOMO_API_KEY");
  if (!subscriptionKey || !apiKey) throw new Error("mtn_credentials_missing");

  const msisdn = phone.replace(/\D/g, "").replace(/^224/, "");
  const res = await fetch(`${baseUrl}/collection/v1_0/requesttopay`, {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": subscriptionKey,
      Authorization: `Bearer ${apiKey}`,
      "X-Reference-Id": intentId,
      "X-Target-Environment": Deno.env.get("MTN_MOMO_TARGET_ENV") ?? "sandbox",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: String(Math.round(amountGnf)),
      currency: "GNF",
      externalId: intentId,
      payer: { partyIdType: "MSISDN", partyId: msisdn },
      payerMessage: "Recharge SONAFRIK",
      payeeNote: "SONAFRIK wallet topup",
    }),
  });

  if (!res.ok && res.status !== 202) {
    const err = await res.text();
    throw new Error(err || `mtn_requesttopay_failed_${res.status}`);
  }

  return {
    providerRef: intentId,
    metadata: { mtn_reference_id: intentId, msisdn },
    ussdPush: true,
  };
}

/** Orange Money GN — structure prête (endpoint configurable). */
export async function initiateOrangeMoney(
  intentId: string,
  amountGnf: number,
  phone: string,
): Promise<OperatorInitResult> {
  const baseUrl = Deno.env.get("ORANGE_MONEY_BASE_URL");
  const apiKey = Deno.env.get("ORANGE_MONEY_API_KEY");
  const merchantKey = Deno.env.get("ORANGE_MONEY_MERCHANT_KEY");
  if (!baseUrl || !apiKey || !merchantKey) throw new Error("orange_credentials_missing");

  const webBase = getWebBaseUrl();
  const res = await fetch(`${baseUrl}/payment`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      merchant_key: merchantKey,
      currency: "GNF",
      order_id: intentId,
      amount: Math.round(amountGnf),
      return_url: `${webBase}/wallet?topup=success`,
      cancel_url: `${webBase}/wallet?topup=error`,
      notif_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/payment-orange-callback`,
      payer_phone: phone,
    }),
  });

  const payload = await res.json().catch(() => ({})) as {
    pay_token?: string;
    payment_url?: string;
    transaction_id?: string;
    message?: string;
  };

  if (!res.ok) {
    throw new Error(payload.message ?? `orange_payment_failed_${res.status}`);
  }

  return {
    checkoutUrl: payload.payment_url,
    providerRef: payload.transaction_id ?? payload.pay_token,
    metadata: { orange_pay_token: payload.pay_token },
    ussdPush: !payload.payment_url,
  };
}

/** Soutra Money — initiation paiement. */
export async function initiateSoutraMoney(
  intentId: string,
  amountGnf: number,
  phone: string,
): Promise<OperatorInitResult> {
  const baseUrl = Deno.env.get("SOUTRA_BASE_URL");
  const apiKey = Deno.env.get("SOUTRA_API_KEY");
  const merchantId = Deno.env.get("SOUTRA_MERCHANT_ID");
  if (!baseUrl || !apiKey || !merchantId) throw new Error("soutra_credentials_missing");

  const res = await fetch(`${baseUrl}/payment/initiate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      merchant_id: merchantId,
      amount: Math.round(amountGnf),
      reference: intentId,
      phone,
      currency: "GNF",
    }),
  });

  const payload = await res.json().catch(() => ({})) as {
    payment_url?: string;
    transaction_id?: string;
    message?: string;
  };

  if (!res.ok) {
    throw new Error(payload.message ?? `soutra_initiate_failed_${res.status}`);
  }

  return {
    checkoutUrl: payload.payment_url,
    providerRef: payload.transaction_id,
    metadata: { soutra_transaction_id: payload.transaction_id },
    ussdPush: !payload.payment_url,
  };
}
