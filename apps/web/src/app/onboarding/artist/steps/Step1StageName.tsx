'use client'

import type { CSSProperties } from 'react'
import { OnboardingStepWrapper } from '@/components/onboarding/OnboardingStepWrapper'
import type { ArtistWizard } from './types'

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

export function Step1StageName({ wizard }: Props) {
  const canContinue = wizard.data.stageName.trim().length > 0

  return (
    <OnboardingStepWrapper
      title="Votre nom de scène"
      subtitle="Le nom sous lequel vous serez connu sur SONAFRIK."
      showBack={false}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <div>
          <label style={labelStyle}>
            Nom de scène <span style={{ color: 'var(--color-vert-energie)' }}>*</span>
          </label>
          <input
            type="text"
            value={wizard.data.stageName}
            onChange={(e) => wizard.updateData({ stageName: e.target.value })}
            onKeyDown={(e) => { if (e.key === 'Enter' && canContinue) wizard.nextStep() }}
            placeholder="Votre nom d'artiste"
            autoComplete="nickname"
            style={fieldStyle}
          />
        </div>

        <button
          type="button"
          onClick={wizard.nextStep}
          disabled={!canContinue}
          style={{
            width: '100%',
            backgroundColor: canContinue ? 'var(--color-vert-energie)' : 'rgba(0,210,106,0.25)',
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
