'use client'

import type { CSSProperties } from 'react'
import { OnboardingStepWrapper } from '@/components/onboarding/OnboardingStepWrapper'
import type { ListenerWizard } from './types'

const CITY_SUGGESTIONS = [
  'Conakry', 'Kindia', 'Boké', 'Faranah',
  'Kankan', 'Labé', 'Mamou', 'N\'Zérékoré',
]

const fieldStyle: CSSProperties = {
  width: '100%',
  backgroundColor: 'rgba(247, 243, 255,0.05)',
  border: '1px solid rgba(247, 243, 255,0.1)',
  borderRadius: '10px',
  padding: '12px 14px',
  fontSize: '14px',
  color: 'var(--color-texte-principal)',
  outline: 'none',
  boxSizing: 'border-box',
}

const labelStyle: CSSProperties = {
  display: 'block',
  fontSize: '12px',
  color: 'rgba(247, 243, 255,0.5)',
  marginBottom: '6px',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
}

interface Props {
  wizard: ListenerWizard
}

export function Step2Location({ wizard }: Props) {
  const canContinue = wizard.data.city.trim().length > 0

  return (
    <OnboardingStepWrapper
      title="Où êtes-vous ?"
      subtitle="Votre ville nous aide à personnaliser votre expérience."
      showBack
      onBack={wizard.prevStep}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <div>
          <label htmlFor="city-input" style={labelStyle}>
            Ville <span style={{ color: 'var(--color-vert-energie)' }}>*</span>
          </label>
          <input
            id="city-input"
            type="text"
            list="city-suggestions"
            value={wizard.data.city}
            onChange={(e) => wizard.updateData({ city: e.target.value })}
            onKeyDown={(e) => { if (e.key === 'Enter' && canContinue) wizard.nextStep() }}
            placeholder="Ex : Conakry, Kindia, Labé…"
            autoComplete="address-level2"
            style={fieldStyle}
          />
          <datalist id="city-suggestions">
            {CITY_SUGGESTIONS.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>

        <button
          type="button"
          onClick={wizard.nextStep}
          disabled={!canContinue}
          style={{
            width: '100%',
            backgroundColor: canContinue ? 'var(--color-vert-energie)' : 'rgba(200, 75, 255,0.25)',
            color: 'var(--color-noir-profond)',
            fontWeight: 700,
            fontSize: '15px',
            padding: '14px',
            borderRadius: '10px',
            border: 'none',
            cursor: canContinue ? 'pointer' : 'not-allowed',
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
