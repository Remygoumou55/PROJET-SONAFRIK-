'use client'

import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { OnboardingRow } from '@/app/onboarding/shared/OnboardingRow'
import type { ArtistWizard } from './types'

const LANGUAGE_LABELS: Record<string, string> = {
  fr: 'Français',
  ss: 'Soussou',
  ff: 'Pular',
  man: 'Malinké',
  multi: 'Plusieurs langues',
}

function maskPhone(phone: string): string {
  if (phone.length < 8) return phone
  const start = phone.slice(0, 6)
  const end = phone.slice(-2)
  return `${start} •• •• ${end}`
}

interface Props {
  wizard: ArtistWizard
  router: { push: (url: string) => void }
  bypassAuth?: boolean
}

export function Step5Confirm({ wizard, router, bypassAuth = false }: Props) {
  const { data } = wizard

  async function handleSubmit() {
    if (bypassAuth) {
      router.push('/creator')
      return
    }

    wizard.setIsSubmitting(true)
    wizard.setError(null)

    try {
      const supabase = getSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const { error: rpcErr } = await supabase.rpc('complete_onboarding', {
        p_full_name: data.stageName.trim(),
        p_account_type: 'artiste',
      })
      if (rpcErr) throw rpcErr

      const { error: updateErr } = await supabase
        .from('profiles')
        .update({
          stage_name: data.stageName.trim(),
          main_genre: data.mainGenre || null,
          song_language: data.songLanguage,
          origin_region: data.originRegion || null,
          orange_money_number: data.orangeMoneyNumber.trim(),
          ...(data.mtnMoneyNumber.trim() ? { mtn_money_number: data.mtnMoneyNumber.trim() } : {}),
        })
        .eq('id', user.id)
      if (updateErr) throw updateErr

      router.push('/creator')
    } catch (err) {
      wizard.setError(err instanceof Error ? err.message : 'Une erreur est survenue. Réessayez.')
      wizard.setIsSubmitting(false)
    }
  }

  return (
    <div>
      {/* Message de bienvenue */}
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎤</div>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', margin: '0 0 6px' }}>
          Bienvenue sur SONAFRIK, {data.stageName} 🎤
        </h2>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
          Votre page artiste est prête. Voici un récapitulatif.
        </p>
      </div>

      {/* Récapitulatif */}
      <div
        style={{
          backgroundColor: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <OnboardingRow label="Nom de scène" value={data.stageName} />
        {data.mainGenre && <OnboardingRow label="Genre" value={data.mainGenre} />}
        <OnboardingRow label="Langue" value={LANGUAGE_LABELS[data.songLanguage] ?? data.songLanguage} />
        {data.originRegion && <OnboardingRow label="Région" value={data.originRegion} />}
        <OnboardingRow label="Orange Money" value={maskPhone(data.orangeMoneyNumber)} />
        {data.mtnMoneyNumber && <OnboardingRow label="MTN Money" value={maskPhone(data.mtnMoneyNumber)} />}
      </div>

      {wizard.error && (
        <p
          style={{ fontSize: '13px', color: '#FF4D4F', marginBottom: '12px', textAlign: 'center' }}
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
          backgroundColor: '#00D26A',
          color: '#0D0D0D',
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
        {wizard.isSubmitting ? 'Enregistrement…' : 'Accéder à mon espace artiste →'}
      </button>
    </div>
  )
}

