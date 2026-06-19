import type { WizardControls } from '@/components/onboarding/useOnboardingWizard'

export interface ArtistOnboardingData {
  [key: string]: unknown
  stageName: string
  mainGenre: string
  songLanguage: string
  originRegion: string
  orangeMoneyNumber: string
  mtnMoneyNumber: string
}

export type ArtistWizard = WizardControls<ArtistOnboardingData>
