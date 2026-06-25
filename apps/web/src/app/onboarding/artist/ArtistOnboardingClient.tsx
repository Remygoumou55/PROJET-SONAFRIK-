'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { createEmptyRevenueDestinationDraft, inferRevenueDestinationFromProfile } from '@sonafrik/shared'
import { useAuthService } from '@/features/auth/hooks/useAuth'
import { useOnboardingWizard } from '@/components/onboarding/useOnboardingWizard'
import { OnboardingProgressBadge } from '@/components/onboarding/OnboardingProgressBadge'
import { Step1StageName } from './steps/Step1StageName'
import { Step2GenreLanguage } from './steps/Step2GenreLanguage'
import { Step3Region } from './steps/Step3Region'
import { Step4Payment } from './steps/Step4Payment'
import { Step5Confirm } from './steps/Step5Confirm'
import type { ArtistOnboardingData } from './steps/types'

export function ArtistOnboardingClient({ bypassAuth }: { bypassAuth: boolean }) {
  const router = useRouter()
  const auth = useAuthService()
  const wizard = useOnboardingWizard<ArtistOnboardingData>({
    stageName: '',
    mainGenre: '',
    songLanguage: 'fr',
    originRegion: '',
    revenueDestination: createEmptyRevenueDestinationDraft(),
    orangeMoneyNumber: '',
    mtnMoneyNumber: '',
  })

  useEffect(() => {
    if (bypassAuth) return
    void auth.getCurrentProfile().then((profile) => {
      if (!profile) { router.replace('/'); return }
      wizard.updateData({
        stageName: profile.stage_name ?? '',
        mainGenre: profile.main_genre ?? '',
        originRegion: profile.origin_region ?? '',
        revenueDestination: inferRevenueDestinationFromProfile(
          profile.orange_money_number,
          profile.mtn_money_number,
        ),
        orangeMoneyNumber: profile.orange_money_number ?? '',
        mtnMoneyNumber: profile.mtn_money_number ?? '',
      })
    }).catch(() => { router.replace('/') })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, bypassAuth])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '32px 20px 60px',
      }}
    >
      <div style={{ maxWidth: '480px', width: '100%' }}>
        <OnboardingProgressBadge currentStep={wizard.currentStep} totalSteps={5} />
        {wizard.currentStep === 1 && <Step1StageName wizard={wizard} />}
        {wizard.currentStep === 2 && <Step2GenreLanguage wizard={wizard} />}
        {wizard.currentStep === 3 && <Step3Region wizard={wizard} />}
        {wizard.currentStep === 4 && <Step4Payment wizard={wizard} />}
        {wizard.currentStep === 5 && <Step5Confirm wizard={wizard} router={router} bypassAuth={bypassAuth} />}
      </div>
    </div>
  )
}
