import type { SonafrikSupabaseClient } from "@sonafrik/database";
import type {
  PaymentIntent,
  PaymentProvider,
} from "@sonafrik/types";
import {
  PAYMENT_PROVIDER_LABELS as PROVIDER_LABELS,
  PAYMENT_PROVIDER_ICONS as PROVIDER_ICONS,
} from "@sonafrik/types";
import { PaymentError } from "./errors";
import { initiatePaymentSchema, type InitiatePaymentInput } from "./schemas";

export { PROVIDER_LABELS as PAYMENT_PROVIDER_LABELS, PROVIDER_ICONS as PAYMENT_PROVIDER_ICONS };
export type { PaymentProvider };

export interface InitiatePaymentResult {
  intentId: string;
  /** Instructions USSD / app opérateur */
  instructions: string;
  /** Mode sandbox — confirmation manuelle ou webhook test */
  sandbox?: boolean;
  /** Wave Checkout — ouvrir dans le navigateur */
  checkoutUrl?: string;
  /** Push USSD (Orange, MTN, Soutra) vs redirect (Wave) */
  ussdPush?: boolean;
}

function resolveInstructions(
  provider: PaymentProvider,
  phone: string,
  opts?: { sandbox?: boolean; checkoutUrl?: string },
): string {
  if (opts?.sandbox) {
    return "Mode sandbox : le paiement est en attente. En dev, confirmez via webhook test ou SQL confirm_payment_intent.";
  }
  if (opts?.checkoutUrl && provider === "wave_gn") {
    return "Une page Wave s'est ouverte. Validez le paiement dans l'application Wave, puis revenez ici.";
  }
  switch (provider) {
    case "orange_money_gn":
      return `Composez #144# sur le ${phone} et confirmez le paiement SONAFRIK.`;
    case "mtn_momo_gn":
      return `Vous allez recevoir une demande de paiement MTN sur le ${phone}. Confirmez via votre PIN MoMo.`;
    case "wave_gn":
      return `Ouvrez l'application Wave sur le ${phone} et approuvez la transaction SONAFRIK.`;
    case "soutra_money":
      return `Confirmez le paiement via l'application Soutra Money sur le ${phone}.`;
  }
}

export function createPaymentsService(client: SonafrikSupabaseClient) {
  return {
    /**
     * Initie un paiement mobile : crée un payment_intent en DB via l'Edge Function
     * et déclenche le push USSD/notification chez l'opérateur.
     */
    async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
      const parsed = initiatePaymentSchema.safeParse(input);
      if (!parsed.success) {
        const hasProviderError = parsed.error.issues.some((i) => i.path[0] === "provider");
        throw new PaymentError(hasProviderError ? "invalid_provider" : "invalid_amount");
      }

      const { data, error } = await client.functions.invoke("payment-initiate", {
        body: parsed.data,
      });

      if (error) {
        let msg = (error as { message?: string }).message ?? "";
        const ctx = (error as { context?: Response }).context;
        if (ctx) {
          try {
            const body = await ctx.json() as { error?: string; message?: string };
            msg = [body.error, body.message, msg].filter(Boolean).join(" ");
          } catch {
            /* ignore */
          }
        }
        if (msg.includes("invalid_provider")) throw new PaymentError("invalid_provider");
        if (msg.includes("invalid_amount"))   throw new PaymentError("invalid_amount");
        if (msg.includes("unauthorized"))     throw new PaymentError("unauthorized");
        if (msg.includes("wallet_not_found")) throw new PaymentError("provider_error", "Portefeuille introuvable.");
        throw new PaymentError("provider_error", msg);
      }

      const result = data as {
        intentId?: string;
        error?: string;
        message?: string;
        sandbox?: boolean;
        checkoutUrl?: string;
        ussdPush?: boolean;
      };

      if (!result?.intentId) {
        throw new PaymentError("provider_error", result?.message ?? result?.error ?? "initiation_failed");
      }
      return {
        intentId:     result.intentId,
        sandbox:      result.sandbox,
        checkoutUrl:  result.checkoutUrl,
        ussdPush:     result.ussdPush,
        instructions: resolveInstructions(parsed.data.provider, parsed.data.phone, {
          sandbox: result.sandbox,
          checkoutUrl: result.checkoutUrl,
        }),
      };
    },

    /**
     * Récupère l'état d'un payment_intent (pour polling côté client).
     */
    async getIntent(intentId: string): Promise<PaymentIntent | null> {
      const { data, error } = await client
        .from("payment_intents")
        .select("*")
        .eq("id", intentId)
        .maybeSingle();

      if (error) throw new PaymentError("intent_fetch_failed");
      return data as PaymentIntent | null;
    },

    /**
     * Liste les payment_intents récents de l'utilisateur.
     */
    async listUserIntents(limit = 10): Promise<PaymentIntent[]> {
      const { data: authData } = await client.auth.getUser();
      if (!authData.user) return [];

      const { data, error } = await client
        .from("payment_intents")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw new PaymentError("intent_list_failed");
      return (data ?? []) as PaymentIntent[];
    },
  };
}

export type PaymentsService = ReturnType<typeof createPaymentsService>;
