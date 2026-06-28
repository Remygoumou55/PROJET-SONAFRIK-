/** Providers mobile money GN — aligné sur supabase/functions/_shared/payments.ts */

export type PaymentProviderId =
  | "orange_money_gn"
  | "mtn_momo_gn"
  | "wave_gn"
  | "soutra_money";

export type PaymentProviderMode = "sandbox" | "production";

export interface PaymentProviderHealth {
  provider: PaymentProviderId;
  mode: PaymentProviderMode;
  /** true si clé API prod présente (ou flag SANDBOX explicite) */
  configured: boolean;
}

const PROVIDER_ENV_KEYS: Record<PaymentProviderId, string> = {
  orange_money_gn: "ORANGE_MONEY_API_KEY",
  mtn_momo_gn: "MTN_MOMO_API_KEY",
  wave_gn: "WAVE_API_KEY",
  soutra_money: "SOUTRA_API_KEY",
};

/** Détecte sandbox vs prod à partir d'un env (Node ou Deno). */
export function isProviderSandbox(
  provider: PaymentProviderId,
  env: Record<string, string | undefined>,
): boolean {
  const sandboxFlag = env[`${provider.toUpperCase()}_SANDBOX`];
  if (sandboxFlag === "true") return true;
  return !env[PROVIDER_ENV_KEYS[provider]];
}

/** Rapport santé credentials — sans exposer les secrets. */
export function getPaymentProvidersHealth(
  env: Record<string, string | undefined>,
): PaymentProviderHealth[] {
  const providers = Object.keys(PROVIDER_ENV_KEYS) as PaymentProviderId[];
  return providers.map((provider) => {
    const sandbox = isProviderSandbox(provider, env);
    return {
      provider,
      mode: sandbox ? "sandbox" : "production",
      configured: !sandbox,
    };
  });
}

export function countProductionReadyProviders(
  env: Record<string, string | undefined>,
): number {
  return getPaymentProvidersHealth(env).filter((p) => p.mode === "production").length;
}
