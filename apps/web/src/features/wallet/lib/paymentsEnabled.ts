/** Portefeuille & paiements mobiles — activés via env (Vague E). */
export function isPaymentsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === "true";
}
