import { useState } from 'react'

interface Props {
  label: string
  value: string | number
  sub?: string
  accent?: string
  delay?: number
}

export function KPICard({ label, value, sub, accent = 'var(--green)', delay = 0 }: Props) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'var(--bg-card-hover)' : 'var(--bg-card)',
        border: `1px solid ${hovered ? 'var(--border-strong)' : 'var(--border-card)'}`,
        borderTop: `3px solid ${accent}`,
        borderRadius: 'var(--radius-card)',
        padding: '18px 20px 16px',
        backdropFilter: 'blur(16px)',
        position: 'relative',
        overflow: 'hidden',
        animation: `fadeUp 0.4s ease both`,
        animationDelay: `${delay}ms`,
        transition: 'background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease',
        boxShadow: hovered ? '0 8px 28px rgba(0,0,0,0.32)' : '0 4px 18px rgba(0,0,0,0.22)',
        cursor: 'default',
        minWidth: 0,
      }}
    >
      {/* Accent wash */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 80,
        background: `linear-gradient(180deg, ${accent}12 0%, transparent 100%)`,
        pointerEvents: 'none',
      }} />

      {/* Corner glow */}
      <div style={{
        position: 'absolute', top: -20, right: -20,
        width: 60, height: 60, borderRadius: '50%',
        background: `radial-gradient(circle, ${accent}18 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative' }}>
        <div style={{
          fontSize: 9.5, fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: '0.12em',
          color: 'var(--text-label)', fontFamily: 'var(--font-body)',
          marginBottom: 13,
        }}>
          {label}
        </div>

        <div style={{
          fontSize: 36, fontWeight: 700, color: '#FFFFFF',
          lineHeight: 1, fontFamily: 'var(--font-mono)',
          letterSpacing: '-0.03em',
          fontVariantNumeric: 'tabular-nums',
          marginBottom: sub ? 9 : 0,
        }}>
          {value}
        </div>

        {sub && (
          <div style={{ fontSize: 10.5, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
            {sub}
          </div>
        )}
      </div>
    </div>
  )
}
