import type { WizardControls } from '@/components/onboarding/useOnboardingWizard'

export interface ListenerOnboardingData {
  [key: string]: unknown
  fullName: string
  city: string
  preferredLanguage: string
  backupEmail: string
}

export type ListenerWizard = WizardControls<ListenerOnboardingData>
