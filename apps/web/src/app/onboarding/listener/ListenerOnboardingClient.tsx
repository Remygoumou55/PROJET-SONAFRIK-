'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useAuthService } from '@/features/auth/hooks/useAuth'
import { useOnboardingWizard } from '@/components/onboarding/useOnboardingWizard'
import { OnboardingProgressBadge } from '@/components/onboarding/OnboardingProgressBadge'
import { Step1Identity } from './steps/Step1Identity'
import { Step2Location } from './steps/Step2Location'
import { Step3Language } from './steps/Step3Language'
import { Step4Backup } from './steps/Step4Backup'
import { Step5Confirm } from './steps/Step5Confirm'
import type { ListenerOnboardingData } from './steps/types'

export function ListenerOnboardingClient({ bypassAuth }: { bypassAuth: boolean }) {
  const router = useRouter()
  const auth = useAuthService()
  const wizard = useOnboardingWizard<ListenerOnboardingData>({
    fullName: '',
    city: '',
    preferredLanguage: 'fr',
    backupEmail: '',
  })

  useEffect(() => {
    if (bypassAuth) return
    void auth.getCurrentProfile().then((profile) => {
      if (!profile) { router.replace('/'); return }
      wizard.updateData({
        fullName: profile.full_name ?? '',
        city: profile.city ?? '',
        preferredLanguage: profile.preferred_language ?? 'fr',
        backupEmail: profile.email ?? '',
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
        {wizard.currentStep === 1 && <Step1Identity wizard={wizard} />}
        {wizard.currentStep === 2 && <Step2Location wizard={wizard} />}
        {wizard.currentStep === 3 && <Step3Language wizard={wizard} />}
        {wizard.currentStep === 4 && <Step4Backup wizard={wizard} />}
        {wizard.currentStep === 5 && <Step5Confirm wizard={wizard} router={router} bypassAuth={bypassAuth} />}
      </div>
    </div>
  )
}
