import type {
  RevenueMethodAvailability,
  RevenueMethodKind,
} from "@sonafrik/types";

/** Pays supportés — extensible sans toucher aux composants UI. */
export interface RevenueCountry {
  code: string;
  name: string;
  flag: string;
  dialCode: string;
  nationalLength: { min: number; max: number };
}

export type RevenueFieldKey =
  | "phoneNational"
  | "bankName"
  | "iban"
  | "accountHolderName"
  | "swift"
  | "walletId"
  | "cryptoAddress";

export interface RevenueFieldDefinition {
  key: RevenueFieldKey;
  label: string;
  placeholder?: string;
  inputMode?: "numeric" | "text";
  autoComplete?: string;
  required: boolean;
}

/** Définition d'une méthode — jamais hardcodée dans les composants React. */
export interface RevenueMethodDefinition {
  id: string;
  label: string;
  kind: RevenueMethodKind;
  availability: RevenueMethodAvailability;
  countryCodes: readonly string[];
  /** Colonne profil MVP (orange_money_number / mtn_money_number). */
  profileField?: "orange" | "mtn";
  /** Alignement futur avec payout_accounts.type */
  payoutAccountType?: "orange_money" | "mtn_momo" | "wave" | "bank_transfer";
  detectPrefixes?: readonly string[];
  fields: readonly RevenueFieldDefinition[];
  /** Ordre par défaut dans la chaîne de fallback automatique. */
  defaultPriority: number;
}

export const REVENUE_COUNTRIES: readonly RevenueCountry[] = [
  { code: "GN", name: "Guinée", flag: "🇬🇳", dialCode: "+224", nationalLength: { min: 9, max: 9 } },
  { code: "SN", name: "Sénégal", flag: "🇸🇳", dialCode: "+221", nationalLength: { min: 9, max: 9 } },
  { code: "CI", name: "Côte d'Ivoire", flag: "🇨🇮", dialCode: "+225", nationalLength: { min: 10, max: 10 } },
  { code: "GH", name: "Ghana", flag: "🇬🇭", dialCode: "+233", nationalLength: { min: 9, max: 9 } },
  { code: "KE", name: "Kenya", flag: "🇰🇪", dialCode: "+254", nationalLength: { min: 9, max: 9 } },
  { code: "ML", name: "Mali", flag: "🇲🇱", dialCode: "+223", nationalLength: { min: 8, max: 8 } },
  { code: "BF", name: "Burkina Faso", flag: "🇧🇫", dialCode: "+226", nationalLength: { min: 8, max: 8 } },
] as const;

const MOBILE_PHONE_FIELDS: readonly RevenueFieldDefinition[] = [
  {
    key: "phoneNational",
    label: "Numéro de réception",
    placeholder: "620 00 00 00",
    inputMode: "numeric",
    autoComplete: "tel-national",
    required: true,
  },
] as const;

const BANK_FIELDS: readonly RevenueFieldDefinition[] = [
  { key: "bankName", label: "Nom de la banque", placeholder: "Ex. BICIGUI", required: true },
  { key: "accountHolderName", label: "Titulaire du compte", placeholder: "Nom complet", required: true },
  { key: "iban", label: "IBAN / RIB", placeholder: "Numéro de compte", required: true },
  { key: "swift", label: "Code SWIFT / BIC", placeholder: "Optionnel", required: false },
] as const;

const WALLET_FIELDS: readonly RevenueFieldDefinition[] = [
  { key: "walletId", label: "Identifiant Wallet SONAFRIK", placeholder: "Votre ID wallet", required: true },
] as const;

/**
 * Registre central des méthodes — source unique.
 * Ajouter un opérateur = une entrée ici, zéro changement composant.
 */
export const REVENUE_METHODS: readonly RevenueMethodDefinition[] = [
  {
    id: "orange_money",
    label: "Orange Money",
    kind: "mobile_money",
    availability: "mvp",
    countryCodes: ["GN", "SN", "CI", "ML", "BF"],
    profileField: "orange",
    payoutAccountType: "orange_money",
    detectPrefixes: ["62", "61", "63"],
    fields: MOBILE_PHONE_FIELDS,
    defaultPriority: 1,
  },
  {
    id: "mtn_momo",
    label: "MTN Mobile Money",
    kind: "mobile_money",
    availability: "mvp",
    countryCodes: ["GN", "GH", "CI", "SN"],
    profileField: "mtn",
    payoutAccountType: "mtn_momo",
    detectPrefixes: ["66", "67", "65"],
    fields: MOBILE_PHONE_FIELDS,
    defaultPriority: 2,
  },
  {
    id: "wave",
    label: "Wave",
    kind: "mobile_money",
    availability: "mvp",
    countryCodes: ["GN", "SN", "CI"],
    profileField: "orange",
    payoutAccountType: "wave",
    fields: MOBILE_PHONE_FIELDS,
    defaultPriority: 3,
  },
  {
    id: "sotra_money",
    label: "Sotra Money",
    kind: "mobile_money",
    availability: "mvp",
    countryCodes: ["GN"],
    profileField: "orange",
    fields: MOBILE_PHONE_FIELDS,
    defaultPriority: 4,
  },
  {
    id: "moov_money",
    label: "Moov Money",
    kind: "mobile_money",
    availability: "mvp",
    countryCodes: ["CI", "BF", "SN"],
    profileField: "orange",
    fields: MOBILE_PHONE_FIELDS,
    defaultPriority: 5,
  },
  {
    id: "free_money",
    label: "Free Money",
    kind: "mobile_money",
    availability: "mvp",
    countryCodes: ["SN"],
    profileField: "orange",
    fields: MOBILE_PHONE_FIELDS,
    defaultPriority: 6,
  },
  {
    id: "mpesa",
    label: "M-Pesa",
    kind: "mobile_money",
    availability: "mvp",
    countryCodes: ["KE"],
    profileField: "mtn",
    fields: MOBILE_PHONE_FIELDS,
    defaultPriority: 2,
  },
  {
    id: "airtel_money",
    label: "Airtel Money",
    kind: "mobile_money",
    availability: "mvp",
    countryCodes: ["KE", "GH"],
    profileField: "mtn",
    fields: MOBILE_PHONE_FIELDS,
    defaultPriority: 3,
  },
  {
    id: "other_mobile",
    label: "Autre mobile money",
    kind: "mobile_money",
    availability: "mvp",
    countryCodes: ["GN", "SN", "CI", "GH", "KE", "ML", "BF"],
    profileField: "orange",
    fields: MOBILE_PHONE_FIELDS,
    defaultPriority: 9,
  },
  {
    id: "bank_transfer",
    label: "Compte bancaire",
    kind: "bank",
    availability: "future",
    countryCodes: ["GN", "SN", "CI", "GH", "KE", "ML", "BF"],
    payoutAccountType: "bank_transfer",
    fields: BANK_FIELDS,
    defaultPriority: 10,
  },
  {
    id: "sonafrik_wallet",
    label: "Wallet SONAFRIK",
    kind: "sonafrik_wallet",
    availability: "future",
    countryCodes: ["GN", "SN", "CI", "GH", "KE", "ML", "BF"],
    fields: WALLET_FIELDS,
    defaultPriority: 0,
  },
  {
    id: "crypto",
    label: "Crypto",
    kind: "crypto",
    availability: "future",
    countryCodes: ["GN", "SN", "CI", "GH", "KE", "ML", "BF"],
    fields: [
      {
        key: "cryptoAddress",
        label: "Adresse crypto",
        placeholder: "Adresse du portefeuille",
        required: true,
      },
    ],
    defaultPriority: 99,
  },
] as const;
