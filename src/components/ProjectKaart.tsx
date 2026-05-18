import { useState, useEffect, useRef } from 'react'
import { X, Check } from 'lucide-react'
import { StatusBadge } from './StatusBadge'
import { useApp } from '../AppContext'
import { setProjectwaardeHandmatig, setWorkaroundBevestigd, setOnHoldStatus, setNotitie } from '../lib/storage'
import { formatDate } from '../lib/excelDate'
import type { OnHoldStatus, EnrichedOrder } from '../types'

interface Props {
  ordnr: string | null
  onClose: () => void
}

function eur(n: number) {
  return '€ ' + Math.round(n).toLocaleString('nl-NL')
}

const ON_HOLD_OPTIONS: { value: OnHoldStatus; label: string }[] = [
  { value: 'open',                   label: 'Open' },
  { value: 'on-hold-netbeheerder',   label: 'On hold netbeheerder' },
  { value: 'on-hold-klant',          label: 'On hold klant' },
  { value: 'on-hold-planning',       label: 'On hold planning intern' },
  { value: 'klaar-om-te-factureren', label: 'Klaar om te factureren' },
]

const SOURCE_BADGE: Record<string, string> = {
  manual:     'manual',
  referentie: 'referentie',
  berekend:   'berekend',
  exact:      'exact',
}

const BRON_BADGE: Record<string, string> = {
  referentie: 'bron_referentie',
  bank:       'bron_bank',
  debiteuren: 'bron_debiteuren',
  onbekend:   'bron_onbekend',
}

export function ProjectKaart({ ordnr, onClose }: Props) {
  const { state, recompute } = useApp()
  const e: EnrichedOrder | undefined = ordnr
    ? state.enrichedOrders.find(x => x.order.normOrdnr === ordnr)
    : undefined

  const [pwInput, setPwInput] = useState('')
  const [notitieValue, setNotitieValue] = useState('')
  const notitieRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (e) {
      setPwInput(e.projectwaardeHandmatig !== null ? String(e.projectwaardeHandmatig) : '')
      setNotitieValue(e.notitie)
    }
  }, [ordnr])

  // Close on Escape
  useEffect(() => {
    const handler = (ev: KeyboardEvent) => { if (ev.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  function savePw() {
    if (!e) return
    const val = parseFloat(pwInput.replace(',', '.'))
    setProjectwaardeHandmatig(e.order.normOrdnr, isNaN(val) ? null : val)
    recompute()
  }

  function saveOnHold(status: OnHoldStatus) {
    if (!e) return
    setOnHoldStatus(e.order.normOrdnr, status)
    recompute()
  }

  function saveNotitie() {
    if (!e) return
    setNotitie(e.order.normOrdnr, notitieValue)
  }

  function bevestigWorkaround() {
    if (!e) return
    setWorkaroundBevestigd(e.order.normOrdnr, true)
    recompute()
  }

  const betaalPct = e && e.origineleProjectwaarde > 0
    ? Math.min(100, Math.round((e.totalBetaald / e.origineleProjectwaarde) * 100))
    : 0

  const issues = e ? state.issues.filter(i => i.ordernummer === e.order.normOrdnr) : []

  const CARD = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-card)',
    borderRadius: 'var(--radius-card)',
    backdropFilter: 'blur(16px)',
  }

  const LABEL_STYLE: React.CSSProperties = {
    fontSize: 10, fontWeight: 600, textTransform: 'uppercase' as const,
    letterSpacing: '0.08em', color: 'var(--text-label)',
    fontFamily: 'var(--font-body)', marginBottom: 4,
  }

  if (!ordnr) return null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 300,
          backgroundColor: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(4px)',
          animation: 'fadeIn 0.15s ease',
        }}
      />

      {/* Panel */}
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
                    #{e.order.normOrdnr}
                  </span>
                  <StatusBadge value={e.order.orderstatus} small />
                  <StatusBadge value={SOURCE_BADGE[e.projectwaardeSource]} small />
                </div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', margin: 0, lineHeight: 1.2 }}>
                  {e.order.klantnaam}
                </h2>
                {e.order.omschrijving && (
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                    {e.order.omschrijving}
                  </div>
                )}
                <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
                  {formatDate(e.order.orderdatum)} · {e.order.factuurstatus}
                </div>
              </div>
              <button
                onClick={onClose}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-muted)', flexShrink: 0 }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Hero numbers */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
              {[
                { label: 'Projectwaarde', value: eur(e.origineleProjectwaarde), color: '#fff' },
                { label: 'Betaald',       value: e.betaalStatusBron === 'onbekend' ? '—' : eur(e.totalBetaald), color: e.totalBetaald > 0 ? 'var(--green-bright)' : 'var(--text-muted)' },
                { label: 'Openstaand',    value: e.betaalStatusBron === 'onbekend' ? '—' : eur(e.openstaand),   color: e.openstaand > 0 ? 'var(--amber-bright)' : 'var(--green-bright)' },
              ].map(h => (
                <div key={h.label} style={{ ...CARD, padding: '14px 16px', textAlign: 'center' }}>
                  <div style={LABEL_STYLE}>{h.label}</div>
                  <div style={{ fontSize: 20, fontFamily: 'var(--font-mono)', fontWeight: 700, color: h.color, fontVariantNumeric: 'tabular-nums' }}>
                    {h.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Progress bar */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Voortgang</span>
                <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                  {e.betaalStatusBron === 'onbekend' ? '—' : `${betaalPct}%`}
                </span>
              </div>
              <div style={{ height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.06)' }}>
                <div style={{ height: '100%', width: `${betaalPct}%`, backgroundColor: 'var(--green)', borderRadius: 2, transition: 'width 0.6s ease', animation: 'growWidth 0.6s ease both' }} />
              </div>
            </div>

            {/* Financieel overzicht */}
            <div style={{ ...CARD, padding: 0, overflow: 'hidden', marginBottom: 16 }}>
              <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.15)' }}>
                <span style={LABEL_STYLE}>Financieel overzicht</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {[
                    { label: 'Originele projectwaarde', value: eur(e.origineleProjectwaarde), badge: SOURCE_BADGE[e.projectwaardeSource], highlight: true },
                    { label: 'Exact orderwaarde',       value: eur(e.exactOrderwaarde) },
                    { label: 'Aanbetaling gefactureerd', value: e.aanbetalingGefactureerd > 0 ? eur(e.aanbetalingGefactureerd) : '—' },
                    { label: 'Aanbetaling betaald',     value: e.aanbetalingBetaald > 0 ? eur(e.aanbetalingBetaald) : '—', badge: e.aanbetalingBetaald > 0 ? BRON_BADGE[e.betaalStatusBron] : undefined },
                    { label: 'Totaal gefactureerd',     value: eur(e.totalGefactureerd) },
                    { label: 'Totaal betaald',          value: e.betaalStatusBron === 'onbekend' ? '—' : eur(e.totalBetaald), badge: BRON_BADGE[e.betaalStatusBron] },
                    { label: 'Nog te factureren',       value: eur(e.nogTeFactureren), color: e.nogTeFactureren > 0 ? 'var(--amber-bright)' : 'var(--text-muted)' },
                    { label: 'Nog te ontvangen',        value: e.betaalStatusBron === 'onbekend' ? '—' : eur(e.openstaand), color: e.openstaand > 0 ? 'var(--amber-bright)' : 'var(--green-bright)' },
                  ].map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '9px 16px', fontSize: 12, color: row.highlight ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: row.highlight ? 600 : 400 }}>
                        {row.label}
                      </td>
                      <td style={{ padding: '9px 16px', textAlign: 'right', fontSize: 13, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', color: row.color ?? 'var(--text-primary)', fontWeight: row.highlight ? 700 : 400 }}>
                        {row.value}
                      </td>
                      <td style={{ padding: '9px 16px 9px 8px', textAlign: 'right', width: 1, whiteSpace: 'nowrap' }}>
                        {row.badge && <StatusBadge value={row.badge} small />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Projectwaarde aanpassen — always visible */}
              <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.10)' }}>
                <div style={LABEL_STYLE}>Projectwaarde aanpassen</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    value={pwInput}
                    onChange={ev => setPwInput(ev.target.value)}
                    onBlur={savePw}
                    onKeyDown={ev => { if (ev.key === 'Enter') { savePw(); ev.currentTarget.blur() } }}
                    placeholder="Voer projectwaarde in..."
                    style={{
                      flex: 1, padding: '7px 12px',
                      background: 'var(--bg-card)', border: '1px solid var(--border-card)',
                      borderRadius: 'var(--radius-xs)', color: 'var(--text-primary)',
                      fontSize: 13, fontFamily: 'var(--font-mono)',
                      outline: 'none', transition: 'border-color 0.15s ease',
                    }}
                    onFocus={ev => (ev.target.style.borderColor = 'var(--green-border)')}
                    onBlurCapture={ev => (ev.target.style.borderColor = 'var(--border-card)')}
                  />
                  {pwInput && (
                    <button
                      onClick={savePw}
                      style={{ padding: '7px 12px', background: 'var(--green-dim)', border: '1px solid var(--green-border)', borderRadius: 'var(--radius-xs)', cursor: 'pointer', color: 'var(--green-bright)', display: 'flex', alignItems: 'center' }}
                    >
                      <Check size={14} />
                    </button>
                  )}
                </div>
                {e.projectwaardeHandmatig !== null && (
                  <div style={{ marginTop: 5, fontSize: 10.5, color: 'var(--blue-bright)', fontFamily: 'var(--font-mono)' }}>
                    Handmatig ingevoerd — gaat boven alle andere bronnen
                  </div>
                )}
              </div>
            </div>

            {/* Workaround blok */}
            {e.workaroundGedetecteerd && !e.workaroundBevestigd && e.projectwaardeSource !== 'manual' && (
              <div style={{ padding: '14px 16px', background: 'var(--amber-dim)', border: '1px solid var(--amber-border)', borderRadius: 'var(--radius-card)', marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--amber-bright)', marginBottom: 6 }}>
                  Aanbetaling-workaround gedetecteerd
                </div>
                <div style={{ fontSize: 12, color: 'var(--amber)', lineHeight: 1.5, marginBottom: 10 }}>
                  Exact toont {eur(e.exactOrderwaarde)} — berekende projectwaarde is {eur(e.origineleProjectwaarde)}.
                  Kloppen deze getallen?
                </div>
                <button
                  onClick={bevestigWorkaround}
                  style={{ padding: '7px 16px', background: 'var(--amber-dim)', border: '1px solid var(--amber-border)', borderRadius: 'var(--radius-xs)', cursor: 'pointer', color: 'var(--amber-bright)', fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Check size={13} />
                  Bevestigen
                </button>
              </div>
            )}

            {/* On-hold selector */}
            <div style={{ marginBottom: 16 }}>
              <div style={LABEL_STYLE}>Status</div>
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

            {/* Notitieveld */}
            <div style={{ marginBottom: 16 }}>
              <div style={LABEL_STYLE}>Notitie</div>
              <textarea
                ref={notitieRef}
                value={notitieValue}
                onChange={ev => setNotitieValue(ev.target.value)}
                onBlur={saveNotitie}
                placeholder="Vrije notitie voor dit project..."
                rows={3}
                style={{
                  width: '100%', padding: '10px 12px',
                  background: 'var(--bg-card)', border: '1px solid var(--border-card)',
                  borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)',
                  fontSize: 13, fontFamily: 'var(--font-body)', lineHeight: 1.5,
                  resize: 'vertical', outline: 'none',
                  transition: 'border-color 0.15s ease',
                }}
                onFocus={ev => (ev.target.style.borderColor = 'var(--green-border)')}
                onBlurCapture={ev => (ev.target.style.borderColor = 'var(--border-card)')}
              />
            </div>

            {/* Issues voor deze order */}
            {issues.length > 0 && (
              <div>
                <div style={LABEL_STYLE}>Issues ({issues.length})</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {issues.map((issue, i) => (
                    <div key={i} style={{ ...CARD, padding: '10px 14px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <StatusBadge value={issue.severity} small />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                          {issue.omschrijving}
                        </div>
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
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>
    </>
  )
}
