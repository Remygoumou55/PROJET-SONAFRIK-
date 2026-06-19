'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { useOnboardingWizard } from '@/components/onboarding/useOnboardingWizard'
import { OnboardingProgressBadge } from '@/components/onboarding/OnboardingProgressBadge'
import { Step1StageName } from './steps/Step1StageName'
import { Step2GenreLanguage } from './steps/Step2GenreLanguage'
import { Step3Region } from './steps/Step3Region'
import { Step4Payment } from './steps/Step4Payment'
import { Step5Confirm } from './steps/Step5Confirm'
import type { ArtistOnboardingData } from './steps/types'

export default function ArtistOnboardingPage() {
  const router = useRouter()
  const wizard = useOnboardingWizard<ArtistOnboardingData>({
    stageName: '',
    mainGenre: '',
    songLanguage: 'fr',
    originRegion: '',
    orangeMoneyNumber: '+224',
    mtnMoneyNumber: '',
  })

  // Pré-remplir depuis le profil Supabase existant (onboarding partiel)
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true') return
    const supabase = getSupabaseBrowserClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace('/'); return }
      supabase
        .from('profiles')
        .select('stage_name, main_genre, origin_region, orange_money_number, mtn_money_number')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (!data) return
          wizard.updateData({
            stageName: data.stage_name ?? '',
            mainGenre: data.main_genre ?? '',
            originRegion: data.origin_region ?? '',
            orangeMoneyNumber: data.orange_money_number ?? '+224',
            mtnMoneyNumber: data.mtn_money_number ?? '',
          })
        })
    })
    // wizard.updateData est stable (useCallback), router est stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

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
        {wizard.currentStep === 5 && <Step5Confirm wizard={wizard} router={router} />}
      </div>
    </div>
  )
}
