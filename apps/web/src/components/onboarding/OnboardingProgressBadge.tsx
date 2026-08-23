'use client'

interface Props {
  currentStep: number
  totalSteps?: number
}

export function OnboardingProgressBadge({ currentStep, totalSteps = 5 }: Props) {
  const pct = Math.min((currentStep / totalSteps) * 100, 100)

  return (
    <div style={{ marginBottom: '28px' }}>
      {/* Responsive: cercle réduit à 40px sur très petit écran */}
      <style>{`
        @media (max-width: 380px) {
          .ob-badge-circle { width: 40px !important; height: 40px !important; }
          .ob-step-wrapper { padding-left: 16px !important; padding-right: 16px !important; }
        }
      `}</style>

      {/* Cercle fraction */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
        <div
          className="ob-badge-circle"
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'rgba(200, 75, 255,0.1)',
            border: '2px solid var(--color-vert-energie)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: '14px',
              fontWeight: 700,
              color: 'var(--color-vert-energie)',
              lineHeight: 1,
              letterSpacing: '-0.5px',
            }}
          >
            {currentStep}/{totalSteps}
          </span>
        </div>
      </div>

      {/* Barre de progression */}
      <div
        style={{
          height: '4px',
          background: 'rgba(247, 243, 255,0.08)',
          borderRadius: '2px',
          position: 'relative',
          marginBottom: '10px',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: '100%',
            background: 'var(--color-vert-energie)',
            borderRadius: '2px',
            width: `${pct}%`,
            transition: 'width 0.4s ease',
          }}
        />
      </div>

      {/* Points de jalons */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
        {Array.from({ length: totalSteps }, (_, i) => (
          <div
            key={i}
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: i + 1 <= currentStep ? 'var(--color-vert-energie)' : 'rgba(247, 243, 255,0.15)',
              transition: 'background 0.3s',
            }}
          />
        ))}
      </div>
    </div>
  )
}
