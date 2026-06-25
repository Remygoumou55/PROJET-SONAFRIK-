import type {
  RevenueDestinationDraft,
  RevenueDestinationProfileMapping,
  RevenueDestinationRecord,
  RevenueDestinationValidation,
} from "@sonafrik/types";
import {
  inferRevenueDestinationFromProfile,
  isRevenueDestinationValid,
  mapRevenueDestinationToProfile,
  resolveFallbackChain,
  validateRevenueDestination,
} from "@sonafrik/shared";

/**
 * Couche service — destination des revenus.
 * Point d'entrée unique pour onboarding, paramètres, wallet et moteur de payout futur.
 */
export class RevenueDestinationService {
  validate(draft: RevenueDestinationDraft): RevenueDestinationValidation {
    return validateRevenueDestination(draft);
  }

  isValid(draft: RevenueDestinationDraft): boolean {
    return isRevenueDestinationValid(draft);
  }

  /** MVP — persistance via colonnes profiles. */
  mapToProfileFields(draft: RevenueDestinationDraft): RevenueDestinationProfileMapping {
    return mapRevenueDestinationToProfile(draft);
  }

  inferFromProfile(
    orangeMoney: string | null | undefined,
    mtnMoney: string | null | undefined,
  ): RevenueDestinationDraft {
    return inferRevenueDestinationFromProfile(orangeMoney, mtnMoney);
  }

  /**
   * Fallback automatique — consommé par le moteur de payout (Phase 2+).
   * Orange → MTN → Wave → Banque → pending.
   */
  resolvePayoutFallbackChain(
    destinations: readonly RevenueDestinationRecord[],
  ): RevenueDestinationRecord[] {
    return resolveFallbackChain(destinations);
  }
}

export const revenueDestinationService = new RevenueDestinationService();
