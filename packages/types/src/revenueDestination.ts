/** SONAFRIK — Système de destination des revenus (source unique de types métier). */

/** Catégorie technique d'une méthode de réception. */
export type RevenueMethodKind = "mobile_money" | "bank" | "sonafrik_wallet" | "crypto";

/** Disponibilité produit — MVP vs roadmap. */
export type RevenueMethodAvailability = "mvp" | "future";

/** Statut d'une destination enregistrée (multi-méthodes futures). */
export type RevenueDestinationStatus =
  | "active"
  | "inactive"
  | "pending_verification"
  | "rejected";

/** Valeurs de champs dynamiques selon le type de méthode. */
export interface RevenueDestinationFieldValues {
  phoneNational?: string;
  bankName?: string;
  iban?: string;
  accountHolderName?: string;
  swift?: string;
  walletId?: string;
  cryptoAddress?: string;
}

/** Brouillon saisi dans l'UI (onboarding, paramètres). */
export interface RevenueDestinationDraft {
  countryCode: string;
  methodId: string;
  fields: RevenueDestinationFieldValues;
}

/** Enregistrement persistant — aligné sur `payout_accounts` + extensions futures. */
export interface RevenueDestinationRecord extends RevenueDestinationDraft {
  id: string;
  userId: string;
  isPrimary: boolean;
  priority: number;
  status: RevenueDestinationStatus;
  verified: boolean;
  label: string;
  createdAt: string;
  updatedAt: string;
}

/** Résultat de validation UX (messages humains). */
export interface RevenueDestinationValidation {
  valid: boolean;
  message: string | null;
  tone: "ok" | "hint" | "error";
}

/** Mapping MVP vers colonnes `profiles` existantes. */
export interface RevenueDestinationProfileMapping {
  orangeMoneyNumber: string;
  mtnMoneyNumber: string | null;
  e164: string | null;
}
