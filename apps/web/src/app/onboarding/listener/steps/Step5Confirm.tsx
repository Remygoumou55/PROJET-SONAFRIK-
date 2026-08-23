'use client'

import { useAuthService } from '@/features/identity/auth/hooks/useAuth'
import { useIdentityService } from '@/features/identity/hooks/useIdentity'
import { OnboardingRow } from '@/app/onboarding/shared/OnboardingRow'
import type { ListenerWizard } from './types'

const LANGUAGE_LABELS: Record<string, string> = {
  fr: 'Français',
  ss: 'Soussou',
  ff: 'Pular',
  man: 'Malinké',
}

interface Props {
  wizard: ListenerWizard
  router: { push: (url: string) => void }
  bypassAuth?: boolean
}

export function Step5Confirm({ wizard, router, bypassAuth = false }: Props) {
  const { data } = wizard
  const auth = useAuthService()
  const identity = useIdentityService()

  async function handleSubmit() {
    if (bypassAuth) {
      router.push('/listen')
      return
    }

    wizard.setIsSubmitting(true)
    wizard.setError(null)

    try {
      await auth.completeOnboardingForCurrentUser({
        accountType: 'auditeur',
        fullName: data.fullName.trim(),
      })
      await identity.updateListenerOnboardingDetails({
        city: data.city.trim() || undefined,
        locale: data.preferredLanguage,
        preferredLanguage: data.preferredLanguage,
        backupEmail: data.backupEmail.trim() || undefined,
      })
      router.push('/listen')
    } catch (err) {
      wizard.setError(err instanceof Error ? err.message : 'Une erreur est survenue. Réessayez.')
      wizard.setIsSubmitting(false)
    }
  }

  return (
    <div>
      {/* Message de bienvenue */}
      <div
        style={{
          textAlign: 'center',
          marginBottom: '28px',
        }}
      >
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎧</div>
        <h2
          style={{
            fontSize: '20px',
            fontWeight: 700,
            color: 'var(--color-texte-principal)',
            margin: '0 0 6px',
          }}
        >
          Bienvenue sur SONAFRIK, {data.fullName} 👋
        </h2>
        <p style={{ fontSize: '13px', color: 'rgba(247, 243, 255,0.4)', margin: 0 }}>
          Tout est prêt. Voici un récapitulatif de votre profil.
        </p>
      </div>

      {/* Récapitulatif */}
      <div
        style={{
          backgroundColor: 'rgba(247, 243, 255,0.04)',
          border: '1px solid rgba(247, 243, 255,0.08)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <OnboardingRow label="Nom" value={data.fullName} />
        <OnboardingRow label="Ville" value={data.city} />
        <OnboardingRow label="Langue" value={LANGUAGE_LABELS[data.preferredLanguage] ?? data.preferredLanguage} />
        {data.backupEmail && <OnboardingRow label="Email de secours" value={data.backupEmail} />}
      </div>

      {wizard.error && (
        <p
          style={{ fontSize: '13px', color: 'var(--color-erreur)', marginBottom: '12px', textAlign: 'center' }}
          role="alert"
        >
          {wizard.error}
        </p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={wizard.isSubmitting}
        style={{
          width: '100%',
          backgroundColor: 'var(--color-vert-energie)',
          color: 'var(--color-noir-profond)',
          fontWeight: 700,
          fontSize: '15px',
          padding: '14px',
          borderRadius: '10px',
          border: 'none',
          cursor: wizard.isSubmitting ? 'not-allowed' : 'pointer',
          opacity: wizard.isSubmitting ? 0.7 : 1,
          transition: 'opacity 0.2s',
          fontFamily: 'inherit',
        }}
      >
        {wizard.isSubmitting ? 'Enregistrement…' : 'Commencer l\'écoute →'}
      </button>
    </div>
  )
}

