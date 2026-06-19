'use client'

import type { CSSProperties } from 'react'
import { OnboardingStepWrapper } from '@/components/onboarding/OnboardingStepWrapper'
import type { ListenerWizard } from './types'

const fieldStyle: CSSProperties = {
  width: '100%',
  backgroundColor: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,194,14,0.25)',
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

interface Props {
  wizard: ListenerWizard
}

export function Step4Backup({ wizard }: Props) {
  return (
    <OnboardingStepWrapper
      title="Sécurisez votre compte"
      subtitle="Optionnel — ajoutez un email de récupération."
      showBack
      onBack={wizard.prevStep}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <div>
          <label style={labelStyle}>Email de secours</label>
          <input
            type="email"
            value={wizard.data.backupEmail}
            onChange={(e) => wizard.updateData({ backupEmail: e.target.value })}
            placeholder="optionnel@exemple.com"
            autoComplete="email"
            style={fieldStyle}
          />
          <p
            style={{
              fontSize: '11px',
              color: 'rgba(255,194,14,0.6)',
              marginTop: '5px',
              marginBottom: 0,
            }}
          >
            Optionnel — pour récupérer votre compte en cas de perte de numéro.
          </p>
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

        <button
          type="button"
          onClick={wizard.nextStep}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.35)',
            fontSize: '13px',
            cursor: 'pointer',
            padding: '4px',
            textAlign: 'center',
            fontFamily: 'inherit',
          }}
        >
          Passer cette étape
        </button>
      </div>
    </OnboardingStepWrapper>
  )
}
