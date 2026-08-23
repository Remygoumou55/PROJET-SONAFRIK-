'use client'

export function OnboardingRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
      <span
        style={{
          fontSize: '12px',
          color: 'rgba(247, 243, 255,0.4)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          flexShrink: 0,
        }}
      >
        {label}
      </span>
      <span style={{ fontSize: '14px', color: 'var(--color-texte-principal)', textAlign: 'right', wordBreak: 'break-word' }}>
        {value}
      </span>
    </div>
  )
}
