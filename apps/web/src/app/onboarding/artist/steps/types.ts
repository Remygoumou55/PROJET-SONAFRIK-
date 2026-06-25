import type { WizardControls } from '@/components/onboarding/useOnboardingWizard'
import type { RevenueDestinationDraft } from '@sonafrik/types'

export interface ArtistOnboardingData {
  [key: string]: unknown
  stageName: string
  mainGenre: string
  songLanguage: string
  originRegion: string
  revenueDestination: RevenueDestinationDraft
  orangeMoneyNumber: string
  mtnMoneyNumber: string
}

export type ArtistWizard = WizardControls<ArtistOnboardingData>
