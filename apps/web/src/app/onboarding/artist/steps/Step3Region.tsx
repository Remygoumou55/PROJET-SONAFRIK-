'use client'

import type { CSSProperties } from 'react'
import { OnboardingStepWrapper } from '@/components/onboarding/OnboardingStepWrapper'
import type { ArtistWizard } from './types'

const REGION_OPTIONS = [
  'Conakry', 'Kindia', 'Boké', 'Faranah', 'Kankan',
  'Labé', 'Mamou', 'N\'Zérékoré', 'Diaspora / Autre',
] as const

const fieldStyle: CSSProperties = {
  width: '100%',
  backgroundColor: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '10px',
  padding: '12px 14px',
  fontSize: '14px',
  color: 'var(--color-texte-principal)',
  outline: 'none',
  boxSizing: 'border-box',
  appearance: 'none',
}

const labelStyle: CSSProperties = {
  display: 'block',
  fontSize: '12px',
  color: 'rgba(255,255,255,0.5)',
  marginBottom: '6px',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
}

interface Props {
  wizard: ArtistWizard
}

export function Step3Region({ wizard }: Props) {
  return (
    <OnboardingStepWrapper
      title="D'où venez-vous ?"
      subtitle="Votre région d'origine pour vous localiser sur la carte."
      showBack
      onBack={wizard.prevStep}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <div>
          <label style={labelStyle}>Région d&apos;origine</label>
          <select
            value={wizard.data.originRegion}
            onChange={(e) => wizard.updateData({ originRegion: e.target.value })}
            style={fieldStyle}
          >
            <option value="" style={{ backgroundColor: 'var(--color-surface)' }}>
              Sélectionner une région…
            </option>
            {REGION_OPTIONS.map((r) => (
              <option key={r} value={r} style={{ backgroundColor: 'var(--color-surface)' }}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={wizard.nextStep}
          style={{
            width: '100%',
            backgroundColor: 'var(--color-vert-energie)',
            color: 'var(--color-noir-profond)',
            fontWeight: 700,
            fontSize: '15px',
            padding: '14px',
            borderRadius: '10px',
            border: 'none',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
            fontFamily: 'inherit',
          }}
        >
          Continuer →
        </button>
      </div>
    </OnboardingStepWrapper>
  )
}
