import { useState } from 'react'
import { StatusBadge } from './StatusBadge'
import { useApp } from '../AppContext'
import type { Severity } from '../types'
import { Search } from 'lucide-react'

interface Props {
  onSelectOrder: (ordnr: string) => void
}

const SEVERITY_ORDER: Severity[] = ['kritiek', 'controle', 'waarschuwing', 'info']

const ACTIE_COLOR: Record<string, string> = {
  Nabellen:     'var(--red)',
  Controleren:  'var(--amber)',
  Bevestigen:   'var(--blue)',
  Administratie: 'var(--text-muted)',
}

export function Actielijst({ onSelectOrder }: Props) {
  const { state } = useApp()
  const [filter, setFilter] = useState<Severity | 'alle'>('alle')
  const [search, setSearch] = useState('')

  const filtered = state.issues
    .filter(i => filter === 'alle' || i.severity === filter)
    .filter(i =>
      !search ||
      i.klantnaam.toLowerCase().includes(search.toLowerCase()) ||
      i.ordernummer.toLowerCase().includes(search.toLowerCase()) ||
      i.omschrijving.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity))

  const counts: Record<Severity | 'alle', number> = {
    alle:         state.issues.length,
    kritiek:      state.issues.filter(i => i.severity === 'kritiek').length,
    controle:     state.issues.filter(i => i.severity === 'controle').length,
    waarschuwing: state.issues.filter(i => i.severity === 'waarschuwing').length,
    info:         state.issues.filter(i => i.severity === 'info').length,
  }

  const FILTERS: (Severity | 'alle')[] = ['alle', 'kritiek', 'controle', 'waarschuwing', 'info']

  return (
    <div style={{ padding: '28px var(--page-pad)', maxWidth: 1100, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, fontFamily: 'var(--font-display)', letterSpacing: '-0.03em' }}>
            Actielijst
          </h2>
          <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 4 }}>
            {state.issues.length} issues — gesorteerd op prioriteit
          </p>
        </div>

        {/* Search */}
        <div style={{ marginLeft: 'auto', position: 'relative' }}>
          <Search size={13} color="var(--text-muted)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Zoek op klant of ordernummer..."
            style={{
              paddingLeft: 30, paddingRight: 14, paddingTop: 7, paddingBottom: 7,
              background: 'var(--bg-card)', border: '1px solid var(--border-card)',
              borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)',
              fontSize: 12.5, fontFamily: 'var(--font-body)',
              outline: 'none', width: 260,
              transition: 'border-color 0.15s ease',
            }}
            onFocus={e => (e.target.style.borderColor = 'var(--green-border)')}
            onBlur={e => (e.target.style.borderColor = 'var(--border-card)')}
          />
        </div>
      </div>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '5px 12px', borderRadius: 20, cursor: 'pointer',
              fontSize: 11, fontWeight: filter === f ? 600 : 400,
              border: filter === f ? '1px solid var(--green-border)' : '1px solid var(--border-card)',
              background: filter === f ? 'var(--green-dim)' : 'var(--bg-card)',
              color: filter === f ? 'var(--green-bright)' : 'var(--text-secondary)',
              transition: 'all 0.12s ease',
              fontFamily: 'var(--font-body)',
            }}
          >
            {f === 'alle' ? 'Alle' : f.charAt(0).toUpperCase() + f.slice(1)}
            <span style={{ marginLeft: 6, opacity: 0.65 }}>({counts[f]})</span>
          </button>
        ))}
      </div>

      {/* Issues list */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
          {state.issues.length === 0 ? 'Geen data geladen — importeer eerst Excel-exports' : 'Geen issues gevonden voor dit filter'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {filtered.map((issue, i) => (
            <div
              key={i}
              onClick={() => onSelectOrder(issue.ordernummer)}
              style={{
                backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)', padding: '14px 18px',
                cursor: 'pointer', transition: 'all 0.12s ease',
                display: 'flex', alignItems: 'center', gap: 14,
              }}
              onMouseEnter={ev => { ev.currentTarget.style.background = 'var(--bg-card-hover)'; ev.currentTarget.style.borderColor = 'var(--border-card)' }}
              onMouseLeave={ev => { ev.currentTarget.style.background = 'var(--bg-card)'; ev.currentTarget.style.borderColor = 'var(--border-subtle)' }}
            >
              <StatusBadge value={issue.severity} small />

              <span style={{
                padding: '2px 8px', borderRadius: 4,
                backgroundColor: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.06)',
                fontSize: 10, fontWeight: 600,
                color: ACTIE_COLOR[issue.actieLabel] ?? 'var(--text-muted)',
                fontFamily: 'var(--font-body)',
                textTransform: 'uppercase', letterSpacing: '0.06em',
                whiteSpace: 'nowrap',
              }}>
                {issue.actieLabel}
              </span>

              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginRight: 8 }}>
                  {issue.klantnaam}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  #{issue.ordernummer}
                </span>
              </div>

              <div style={{ fontSize: 12, color: 'var(--text-secondary)', maxWidth: 420, textAlign: 'right', lineHeight: 1.3 }}>
                {issue.omschrijving}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
