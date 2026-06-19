'use client'

import type { CSSProperties } from 'react'
import { OnboardingStepWrapper } from '@/components/onboarding/OnboardingStepWrapper'
import type { ListenerWizard } from './types'

const LANGUAGE_OPTIONS = [
  { value: 'fr', label: 'Français' },
  { value: 'ss', label: 'Soussou' },
  { value: 'ff', label: 'Pular' },
  { value: 'man', label: 'Malinké' },
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
  wizard: ListenerWizard
}

export function Step3Language({ wizard }: Props) {
  return (
    <OnboardingStepWrapper
      title="Votre langue préférée"
      subtitle="L'interface sera adaptée à votre langue."
      showBack
      onBack={wizard.prevStep}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <div>
          <label style={labelStyle}>Langue préférée</label>
          <select
            value={wizard.data.preferredLanguage}
            onChange={(e) => wizard.updateData({ preferredLanguage: e.target.value })}
            style={fieldStyle}
          >
            {LANGUAGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} style={{ backgroundColor: '#1A1A1A' }}>
                {opt.label}
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
