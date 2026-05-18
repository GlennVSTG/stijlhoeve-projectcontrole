import { useState } from 'react'
import { StatusBadge } from './StatusBadge'
import { useApp } from '../AppContext'
import type { Severity } from '../types'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface Props {
  onSelectOrder: (ordnr: string) => void
}

const SECTIONS: { severity: Severity; label: string }[] = [
  { severity: 'kritiek',      label: 'Kritiek' },
  { severity: 'controle',     label: 'Controle' },
  { severity: 'waarschuwing', label: 'Waarschuwing' },
  { severity: 'info',         label: 'Info' },
]

export function Datakwaliteit({ onSelectOrder }: Props) {
  const { state } = useApp()
  const [open, setOpen] = useState<Severity[]>(['kritiek', 'controle'])

  function toggle(s: Severity) {
    setOpen(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }

  return (
    <div style={{ padding: '28px var(--page-pad)', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, fontFamily: 'var(--font-display)', letterSpacing: '-0.03em' }}>
          Datakwaliteit
        </h2>
        <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 4 }}>
          {state.issues.length} totale issues gedetecteerd
        </p>
      </div>

      {state.enrichedOrders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
          Geen data geladen — importeer eerst het masterbestand
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {SECTIONS.map(({ severity, label }) => {
            const issues = state.issues.filter(i => i.severity === severity)
            const isOpen = open.includes(severity)

            return (
              <div key={severity} style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: 'var(--radius-card)', overflow: 'hidden', backdropFilter: 'blur(16px)' }}>
                <button
                  onClick={() => toggle(severity)}
                  style={{ width: '100%', padding: '14px 18px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', transition: 'background 0.12s ease', borderBottom: isOpen && issues.length > 0 ? '1px solid var(--border-subtle)' : 'none' }}
                  onMouseEnter={ev => (ev.currentTarget.style.background = 'var(--bg-card-hover)')}
                  onMouseLeave={ev => (ev.currentTarget.style.background = '')}
                >
                  <StatusBadge value={severity} small />
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}>
                    {label}
                  </span>
                  <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: issues.length > 0 ? 'var(--text-secondary)' : 'var(--text-muted)', marginRight: 8 }}>
                    {issues.length} {issues.length === 1 ? 'issue' : 'issues'}
                  </span>
                  {isOpen ? <ChevronUp size={14} color="var(--text-muted)" /> : <ChevronDown size={14} color="var(--text-muted)" />}
                </button>

                {isOpen && (
                  issues.length === 0 ? (
                    <div style={{ padding: '16px 18px', fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
                      Geen {label.toLowerCase()} issues gevonden
                    </div>
                  ) : (
                    <div>
                      {issues.map((issue, i) => (
                        <div
                          key={i}
                          onClick={() => onSelectOrder(issue.ordernummer)}
                          style={{ padding: '12px 18px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'flex-start', gap: 14, cursor: 'pointer', transition: 'background 0.1s ease' }}
                          onMouseEnter={ev => { ev.currentTarget.style.background = 'var(--bg-card-hover)' }}
                          onMouseLeave={ev => (ev.currentTarget.style.background = '')}
                        >
                          <div style={{ minWidth: 160, flexShrink: 0 }}>
                            <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2 }}>
                              {issue.klantnaam}
                            </div>
                            <div style={{ fontSize: 10.5, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                              #{issue.ordernummer}
                            </div>
                          </div>
                          <div style={{ flex: 1, fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                            {issue.omschrijving}
                          </div>
                          <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '2px 8px', borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                            {issue.actieLabel}
                          </span>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
