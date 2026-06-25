'use client'

import { OnboardingStepWrapper } from '@/components/onboarding/OnboardingStepWrapper'
import {
  RevenueDestinationSetup,
  isRevenueDestinationSetupValid,
} from '@/features/shared/components/RevenueDestinationSetup'
import { mapRevenueDestinationToProfile } from '@sonafrik/shared'
import type { ArtistWizard } from './types'

interface Props {
  wizard: ArtistWizard
}

export function Step4Payment({ wizard }: Props) {
  const canContinue = isRevenueDestinationSetupValid(wizard.data.revenueDestination)

  function handleChange(next: typeof wizard.data.revenueDestination) {
    const mapped = mapRevenueDestinationToProfile(next)
    wizard.updateData({
      revenueDestination: next,
      orangeMoneyNumber: mapped.orangeMoneyNumber,
      mtnMoneyNumber: mapped.mtnMoneyNumber ?? '',
    })
  }

  return (
    <OnboardingStepWrapper
      title="💰 Où devons-nous envoyer vos revenus ?"
      subtitle="Choisissez la méthode sur laquelle SONAFRIK versera vos revenus de streaming."
      showBack
      onBack={wizard.prevStep}
    >
      <div className="onboarding-payment-step">
        <RevenueDestinationSetup
          value={wizard.data.revenueDestination}
          onChange={handleChange}
          mode="onboarding"
        />

        <button
          type="button"
          onClick={wizard.nextStep}
          disabled={!canContinue}
          className="onboarding-payment-step__continue"
          data-enabled={canContinue}
        >
          Continuer →
        </button>
      </div>
    </OnboardingStepWrapper>
  )
}
