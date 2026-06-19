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
  color: '#ffffff',
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

function isOrangeMoneyValid(number: string): boolean {
  const trimmed = number.trim()
  return trimmed.length > 4 && trimmed !== '+224'
}

interface Props {
  wizard: ArtistWizard
}

export function Step4Payment({ wizard }: Props) {
  const canContinue = isOrangeMoneyValid(wizard.data.orangeMoneyNumber)

  return (
    <OnboardingStepWrapper
      title="Comment vous payer ?"
      subtitle="Nécessaire pour recevoir vos revenus de streaming."
      showBack
      onBack={wizard.prevStep}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {/* Orange Money — obligatoire */}
        <div>
          <label style={labelStyle}>
            Numéro Orange Money ★ <span style={{ color: '#00D26A' }}>*</span>
          </label>
          <input
            type="tel"
            value={wizard.data.orangeMoneyNumber}
            onChange={(e) => wizard.updateData({ orangeMoneyNumber: e.target.value })}
            placeholder="+224620000000"
            style={{
              ...fieldStyle,
              borderColor: 'rgba(0,210,106,0.4)',
            }}
          />
          <p
            style={{
              fontSize: '11px',
              color: 'rgba(255,165,0,0.7)',
              marginTop: '5px',
              marginBottom: 0,
            }}
          >
            ★ Sans ce numéro, vous ne pourrez pas recevoir vos revenus.
          </p>
        </div>

        {/* MTN Money — optionnel */}
        <div>
          <label style={labelStyle}>Numéro MTN Money</label>
          <input
            type="tel"
            value={wizard.data.mtnMoneyNumber}
            onChange={(e) => wizard.updateData({ mtnMoneyNumber: e.target.value })}
            placeholder="+224660000000 (optionnel)"
            style={fieldStyle}
          />
        </div>

        <button
          type="button"
          onClick={wizard.nextStep}
          disabled={!canContinue}
          style={{
            width: '100%',
            backgroundColor: canContinue ? '#00D26A' : 'rgba(0,210,106,0.25)',
            color: '#0D0D0D',
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
