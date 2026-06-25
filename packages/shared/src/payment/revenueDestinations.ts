/**
 * SONAFRIK — Moteur de destination des revenus.
 *
 * Évolution DB (sans casser le MVP) :
 * - Aujourd'hui : `profiles.orange_money_number` / `mtn_money_number` (onboarding)
 * - Retraits : `payout_accounts` (multi-comptes, is_default, verified)
 * - Phase 2 : colonnes `priority`, `status` sur payout_accounts OU table `revenue_destinations`
 * - Fallback : `resolveFallbackChain()` consommé par le moteur de payout futur
 */

import type {
  RevenueDestinationDraft,
  RevenueDestinationProfileMapping,
  RevenueDestinationRecord,
  RevenueDestinationValidation,
} from "@sonafrik/types";
import {
  REVENUE_COUNTRIES,
  REVENUE_METHODS,
  type RevenueCountry,
  type RevenueMethodDefinition,
} from "./revenueDestinations.config";

export * from "./revenueDestinations.config";

export type RevenueSetupMode = "onboarding" | "full";

export function getRevenueCountry(code: string): RevenueCountry | undefined {
  return REVENUE_COUNTRIES.find((c) => c.code === code);
}

export function getRevenueMethod(id: string): RevenueMethodDefinition | undefined {
  return REVENUE_METHODS.find((m) => m.id === id);
}

/** Méthodes filtrées par pays — jamais d'opérateur indisponible dans le pays. */
export function getRevenueMethodsForCountry(
  countryCode: string,
  mode: RevenueSetupMode = "onboarding",
): RevenueMethodDefinition[] {
  return REVENUE_METHODS.filter((m) => {
    if (!m.countryCodes.includes(countryCode)) return false;
    if (mode === "onboarding" && m.availability !== "mvp") return false;
    return true;
  });
}

export function sanitizeNationalDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function formatNationalPhoneDisplay(digits: string): string {
  const clean = sanitizeNationalDigits(digits);
  return clean.replace(/(\d{2})(?=\d)/g, "$1 ").trim();
}

export function buildE164Phone(countryCode: string, nationalDigits: string): string {
  const country = getRevenueCountry(countryCode);
  if (!country) return "";
  return `${country.dialCode}${sanitizeNationalDigits(nationalDigits)}`;
}

export function createEmptyRevenueDestinationDraft(
  countryCode = "GN",
  methodId?: string,
): RevenueDestinationDraft {
  const methods = getRevenueMethodsForCountry(countryCode);
  const method = methodId
    ? methods.find((m) => m.id === methodId) ?? methods[0]
    : methods[0];
  return {
    countryCode,
    methodId: method?.id ?? "orange_money",
    fields: {},
  };
}

export function validateRevenueDestination(
  draft: RevenueDestinationDraft,
): RevenueDestinationValidation {
  const country = getRevenueCountry(draft.countryCode);
  const method = getRevenueMethod(draft.methodId);

  if (!country || !method) {
    return {
      valid: false,
      message: "Choisissez votre pays et votre mode de réception.",
      tone: "error",
    };
  }

  if (!method.countryCodes.includes(draft.countryCode)) {
    return {
      valid: false,
      message: `${method.label} n'est pas disponible dans ce pays pour le moment.`,
      tone: "error",
    };
  }

  for (const field of method.fields) {
    const raw = draft.fields[field.key]?.trim() ?? "";
    if (field.required && !raw) {
      return {
        valid: false,
        message: humanRequiredMessage(field.key, method),
        tone: "hint",
      };
    }
  }

  if (method.kind === "mobile_money") {
    return validateMobileMoneyDraft(draft, country, method);
  }

  if (method.kind === "bank") {
    const iban = draft.fields.iban?.replace(/\s/g, "") ?? "";
    if (iban.length < 8) {
      return { valid: false, message: "Vérifiez votre numéro de compte bancaire.", tone: "hint" };
    }
    return { valid: true, message: "✓ Coordonnées bancaires prêtes", tone: "ok" };
  }

  return { valid: true, message: "✓ Configuration valide", tone: "ok" };
}

function validateMobileMoneyDraft(
  draft: RevenueDestinationDraft,
  country: RevenueCountry,
  method: RevenueMethodDefinition,
): RevenueDestinationValidation {
  const digits = sanitizeNationalDigits(draft.fields.phoneNational ?? "");

  if (digits.length === 0) {
    return {
      valid: false,
      message: "Entrez le numéro lié à votre compte mobile money.",
      tone: "hint",
    };
  }

  if (digits.length < country.nationalLength.min) {
    return {
      valid: false,
      message: `Encore ${country.nationalLength.min - digits.length} chiffre(s) pour ${country.name}.`,
      tone: "hint",
    };
  }

  if (digits.length > country.nationalLength.max) {
    return { valid: false, message: "Numéro un peu long — vérifiez les chiffres saisis.", tone: "error" };
  }

  if (method.detectPrefixes?.includes(digits.slice(0, 2))) {
    return { valid: true, message: `✓ ${method.label} détecté — format correct`, tone: "ok" };
  }

  return {
    valid: true,
    message: "✓ Numéro valide — vos revenus pourront être versés ici",
    tone: "ok",
  };
}

function humanRequiredMessage(
  key: string,
  method: RevenueMethodDefinition,
): string {
  switch (key) {
    case "phoneNational":
      return `Entrez votre numéro ${method.label}.`;
    case "bankName":
      return "Indiquez le nom de votre banque.";
    case "accountHolderName":
      return "Indiquez le titulaire du compte.";
    case "iban":
      return "Indiquez votre IBAN ou RIB.";
    default:
      return "Complétez les informations demandées.";
  }
}

export function isRevenueDestinationValid(draft: RevenueDestinationDraft): boolean {
  return validateRevenueDestination(draft).valid;
}

/** MVP — mappe vers colonnes profiles sans migration. */
export function mapRevenueDestinationToProfile(
  draft: RevenueDestinationDraft,
): RevenueDestinationProfileMapping {
  const method = getRevenueMethod(draft.methodId);
  if (!method || method.kind !== "mobile_money") {
    return { orangeMoneyNumber: "", mtnMoneyNumber: null, e164: null };
  }

  const e164 = buildE164Phone(draft.countryCode, draft.fields.phoneNational ?? "");
  if (!e164) {
    return { orangeMoneyNumber: "", mtnMoneyNumber: null, e164: null };
  }

  if (method.profileField === "mtn") {
    return { orangeMoneyNumber: "", mtnMoneyNumber: e164, e164 };
  }
  return { orangeMoneyNumber: e164, mtnMoneyNumber: null, e164 };
}

/** Reconstruction depuis profil MVP (2 colonnes legacy). */
export function inferRevenueDestinationFromProfile(
  orangeMoney: string | null | undefined,
  mtnMoney: string | null | undefined,
): RevenueDestinationDraft {
  const primary = (mtnMoney?.trim() || orangeMoney?.trim() || "").replace(/\s/g, "");
  if (!primary) return createEmptyRevenueDestinationDraft();

  const country =
    REVENUE_COUNTRIES.find((c) => primary.startsWith(c.dialCode)) ??
    getRevenueCountry("GN")!;

  const national = sanitizeNationalDigits(primary.slice(country.dialCode.length));
  const methodId = mtnMoney?.trim() ? "mtn_momo" : "orange_money";

  return {
    countryCode: country.code,
    methodId,
    fields: { phoneNational: national },
  };
}

export function getRevenueDestinationRecapLabel(draft: RevenueDestinationDraft): string {
  const country = getRevenueCountry(draft.countryCode);
  const method = getRevenueMethod(draft.methodId);
  if (!country || !method) return "Destination des revenus";
  return `${method.label} · ${country.flag} ${country.name}`;
}

/**
 * Chaîne de fallback pour le moteur de payout futur.
 * Tri : isPrimary DESC → priority ASC → defaultPriority ASC.
 * Non activé en MVP UI — architecture prête.
 */
export function resolveFallbackChain(
  destinations: readonly RevenueDestinationRecord[],
): RevenueDestinationRecord[] {
  return [...destinations]
    .filter((d) => d.status === "active")
    .sort((a, b) => {
      if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
      if (a.priority !== b.priority) return a.priority - b.priority;
      const pa = getRevenueMethod(a.methodId)?.defaultPriority ?? 50;
      const pb = getRevenueMethod(b.methodId)?.defaultPriority ?? 50;
      return pa - pb;
    });
}

/** Label dropdown pour méthodes futures (settings avancés). */
export function formatMethodOptionLabel(method: RevenueMethodDefinition): string {
  if (method.availability === "future") return `${method.label} — Bientôt disponible`;
  return method.label;
}

// ─── Aliases legacy (africaPayout) ───────────────────────────────────────────

export const PAYOUT_COUNTRIES = REVENUE_COUNTRIES;
export const PAYOUT_PROVIDERS = REVENUE_METHODS;
export type PayoutCountry = RevenueCountry;
export type PayoutProvider = RevenueMethodDefinition;
export type PayoutPhoneValidation = RevenueDestinationValidation;
export type PayoutProfileFields = RevenueDestinationProfileMapping;

export const getPayoutCountry = getRevenueCountry;
export const getPayoutProvider = getRevenueMethod;
export const getPayoutProvidersForCountry = (code: string) =>
  getRevenueMethodsForCountry(code, "onboarding");
export const validatePayoutPhone = (
  countryCode: string,
  nationalDigits: string,
  providerId: string,
) =>
  validateRevenueDestination({
    countryCode,
    methodId: providerId,
    fields: { phoneNational: nationalDigits },
  });
export const mapPayoutToProfileFields = (
  countryCode: string,
  providerId: string,
  nationalDigits: string,
) => mapRevenueDestinationToProfile({
  countryCode,
  methodId: providerId,
  fields: { phoneNational: nationalDigits },
});
export const inferPayoutFromProfile = inferRevenueDestinationFromProfile;
export const getPayoutRecapLabel = (countryCode: string, providerId: string) =>
  getRevenueDestinationRecapLabel({
    countryCode,
    methodId: providerId,
    fields: {},
  });
