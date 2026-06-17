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
  /** Instructions d'action affichées à l'utilisateur (ex: "Confirmez sur votre téléphone") */
  instructions: string;
}

function resolveInstructions(provider: PaymentProvider, phone: string): string {
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
      if (!parsed.success) throw new PaymentError("invalid_amount");

      const { data, error } = await client.functions.invoke("payment-initiate", {
        body: parsed.data,
      });

      if (error) {
        const msg = (error as { message?: string }).message ?? "";
        if (msg.includes("invalid_provider"))    throw new PaymentError("invalid_provider");
        if (msg.includes("invalid_amount"))      throw new PaymentError("invalid_amount");
        if (msg.includes("unauthorized"))        throw new PaymentError("unauthorized");
        throw new PaymentError("provider_error", msg);
      }

      const result = data as { intentId: string };
      return {
        intentId:     result.intentId,
        instructions: resolveInstructions(parsed.data.provider, parsed.data.phone),
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

      if (error) throw new PaymentError("intent_not_found");
      return data as PaymentIntent | null;
    },

    /**
     * Liste les payment_intents récents de l'utilisateur.
     */
    async listUserIntents(limit = 10): Promise<PaymentIntent[]> {
      const { data, error } = await client
        .from("payment_intents")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) return [];
      return (data ?? []) as PaymentIntent[];
    },
  };
}

export type PaymentsService = ReturnType<typeof createPaymentsService>;
