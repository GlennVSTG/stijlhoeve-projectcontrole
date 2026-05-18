import { useEffect } from 'react'
import { X } from 'lucide-react'
import { StatusBadge } from './StatusBadge'
import { useApp } from '../AppContext'
import { setOnHoldStatus } from '../lib/storage'
import { formatDate } from '../lib/excelDate'
import type { OnHoldStatus, EnrichedOrder } from '../types'

interface Props {
  ordnr: string | null
  onClose: () => void
}

function eur(n: number) {
  return '€ ' + Math.round(n).toLocaleString('nl-NL')
}

const ON_HOLD_OPTIONS: { value: OnHoldStatus; label: string }[] = [
  { value: 'open',                   label: 'Open' },
  { value: 'on-hold-netbeheerder',   label: 'On hold netbeheerder' },
  { value: 'on-hold-klant',          label: 'On hold klant' },
  { value: 'on-hold-planning',       label: 'On hold planning intern' },
  { value: 'klaar-om-te-factureren', label: 'Klaar om te factureren' },
]

export function ProjectKaart({ ordnr, onClose }: Props) {
  const { state, recompute } = useApp()
  const e: EnrichedOrder | undefined = ordnr
    ? state.enrichedOrders.find(x => x.ordernummer === ordnr)
    : undefined

  useEffect(() => {
    const handler = (ev: KeyboardEvent) => { if (ev.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  function saveOnHold(status: OnHoldStatus) {
    if (!e) return
    setOnHoldStatus(e.ordernummer, status)
    recompute()
  }

  const betaalPct = e && e.orderbedrag > 0
    ? Math.min(100, Math.round((e.totaalBetaald / e.orderbedrag) * 100))
    : 0

  const issues = e ? state.issues.filter(i => i.ordernummer === e.ordernummer) : []

  const CARD: React.CSSProperties = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-card)',
    borderRadius: 'var(--radius-card)',
    backdropFilter: 'blur(16px)',
  }

  const LABEL: React.CSSProperties = {
    fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
    letterSpacing: '0.08em', color: 'var(--text-label)',
    fontFamily: 'var(--font-body)', marginBottom: 4,
  }

  if (!ordnr) return null

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 300, backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', animation: 'fadeIn 0.15s ease' }}
      />

      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 301,
        width: 'min(560px, 100vw)',
        backgroundColor: '#0C1E32',
        borderLeft: '1px solid var(--border-card)',
        overflowY: 'auto',
        animation: 'slideInRight 0.2s ease',
        boxShadow: '-8px 0 48px rgba(0,0,0,0.40)',
      }}>

        {!e ? (
          <div style={{ padding: 32, color: 'var(--text-muted)', textAlign: 'center', marginTop: 80 }}>
            Order niet gevonden
          </div>
        ) : (
          <div style={{ padding: 24 }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, gap: 12 }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    #{e.ordernummer}
                  </span>
                  <StatusBadge value={e.orderstatus} small />
                </div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', margin: 0, lineHeight: 1.2 }}>
                  {e.klantnaam}
                </h2>
                {e.omschrijving && (
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                    {e.omschrijving}
                  </div>
                )}
                <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
                  {formatDate(e.orderdatum)} · {e.factuurstatus}
                </div>
              </div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-muted)', flexShrink: 0 }}>
                <X size={18} />
              </button>
            </div>

            {/* Hero numbers */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
              {[
                { label: 'Orderbedrag',  value: eur(e.orderbedrag),   color: '#fff' },
                { label: 'Betaald',      value: eur(e.totaalBetaald), color: e.totaalBetaald > 0 ? 'var(--green-bright)' : 'var(--text-muted)' },
                { label: 'Openstaand',   value: eur(e.openstaand),    color: e.openstaand > 0 ? 'var(--amber-bright)' : 'var(--green-bright)' },
              ].map(h => (
                <div key={h.label} style={{ ...CARD, padding: '14px 16px', textAlign: 'center' }}>
                  <div style={LABEL}>{h.label}</div>
                  <div style={{ fontSize: 20, fontFamily: 'var(--font-mono)', fontWeight: 700, color: h.color, fontVariantNumeric: 'tabular-nums' }}>
                    {h.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Voortgangsbalk */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Voortgang betaling</span>
                <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{betaalPct}%</span>
              </div>
              <div style={{ height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.06)' }}>
                <div style={{ height: '100%', width: `${betaalPct}%`, backgroundColor: 'var(--green)', borderRadius: 2, transition: 'width 0.6s ease' }} />
              </div>
            </div>

            {/* Financieel overzicht */}
            <div style={{ ...CARD, padding: 0, overflow: 'hidden', marginBottom: 16 }}>
              <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.15)' }}>
                <span style={LABEL}>Financieel overzicht</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {[
                    { label: 'Orderbedrag (masterbestand)', value: eur(e.orderbedrag), highlight: true, color: '#fff' as const },
                    { label: 'Totaal betaald',  value: eur(e.totaalBetaald), color: (e.totaalBetaald > 0 ? 'var(--green-bright)' : 'var(--text-muted)') as string },
                    { label: 'Openstaand',       value: eur(e.openstaand),   color: (e.openstaand > 0 ? 'var(--amber-bright)' : 'var(--green-bright)') as string },
                    { label: 'Betalingsstatus',  value: e.betalingsstatus || '—', color: 'var(--text-secondary)' as string },
                  ].map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '9px 16px', fontSize: 12, color: row.highlight ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: row.highlight ? 600 : 400 }}>
                        {row.label}
                      </td>
                      <td style={{ padding: '9px 16px', textAlign: 'right', fontSize: 13, fontFamily: row.label === 'Betalingsstatus' ? 'var(--font-body)' : 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', color: row.color, fontWeight: row.highlight ? 700 : 400 }}>
                        {row.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Betalingen */}
            {e.betalingen.length > 0 && (
              <div style={{ ...CARD, padding: 0, overflow: 'hidden', marginBottom: 16 }}>
                <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.15)' }}>
                  <span style={LABEL}>Betalingen ({e.betalingen.length})</span>
                </div>
                {e.betalingen.map((b, i) => (
                  <div key={i} style={{ padding: '9px 16px', borderBottom: i < e.betalingen.length - 1 ? '1px solid var(--border-subtle)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11.5, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {b.betaaldatum ? formatDate(b.betaaldatum) : '—'}
                    </span>
                    <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--green-bright)', fontVariantNumeric: 'tabular-nums' }}>
                      {eur(b.betaalbedrag)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Opmerking van Glenn */}
            {e.notitie && (
              <div style={{ marginBottom: 16, padding: '12px 16px', background: 'rgba(200,168,75,0.06)', border: '1px solid var(--amber-border)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ ...LABEL, color: 'var(--amber)', marginBottom: 5 }}>Opmerking van Glenn</div>
                <div style={{ fontSize: 12.5, color: 'var(--amber)', lineHeight: 1.5 }}>{e.notitie}</div>
              </div>
            )}

            {/* Status */}
            <div style={{ marginBottom: 16 }}>
              <div style={LABEL}>Status</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {ON_HOLD_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => saveOnHold(opt.value)}
                    style={{
                      padding: '5px 11px', borderRadius: 20, cursor: 'pointer',
                      fontSize: 11, fontFamily: 'var(--font-body)', fontWeight: 500,
                      border: e.onHoldStatus === opt.value ? '1px solid var(--green-border)' : '1px solid var(--border-card)',
                      background: e.onHoldStatus === opt.value ? 'var(--green-dim)' : 'var(--bg-card)',
                      color: e.onHoldStatus === opt.value ? 'var(--green-bright)' : 'var(--text-secondary)',
                      transition: 'all 0.12s ease',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Issues */}
            {issues.length > 0 && (
              <div>
                <div style={LABEL}>Issues ({issues.length})</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {issues.map((issue, i) => (
                    <div key={i} style={{ ...CARD, padding: '10px 14px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <StatusBadge value={issue.severity} small />
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                        {issue.omschrijving}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideInRight { from { transform: translateX(100%) } to { transform: translateX(0) } }
      `}</style>
    </>
  )
}
