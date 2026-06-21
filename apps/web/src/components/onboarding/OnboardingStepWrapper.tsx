'use client'

import type { ReactNode } from 'react'

interface Props {
  title: string
  subtitle?: string
  children: ReactNode
  onBack?: () => void
  showBack: boolean
}

export function OnboardingStepWrapper({ title, subtitle, children, onBack, showBack }: Props) {
  return (
    <div>
      {showBack && onBack && (
        <button
          type="button"
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'rgba(255,255,255,0.5)',
            fontSize: '13px',
            padding: '0 0 20px 0',
            fontFamily: 'inherit',
          }}
        >
          ← Retour
        </button>
      )}

      <div style={{ marginBottom: '24px' }}>
        <h2
          style={{
            fontSize: '20px',
            fontWeight: 700,
            color: 'var(--color-texte-principal)',
            margin: '0 0 6px',
          }}
        >
          {title}
        </h2>
        {subtitle && (
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
            {subtitle}
          </p>
        )}
      </div>

      {children}
    </div>
  )
}
