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
  color: '#ffffff',
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
            <option value="" style={{ backgroundColor: '#1A1A1A' }}>
              Sélectionner une région…
            </option>
            {REGION_OPTIONS.map((r) => (
              <option key={r} value={r} style={{ backgroundColor: '#1A1A1A' }}>
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
            backgroundColor: '#00D26A',
            color: '#0D0D0D',
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
