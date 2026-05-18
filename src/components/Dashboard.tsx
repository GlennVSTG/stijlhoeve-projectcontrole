import { KPICard } from './KPICard'
import { StatusBadge } from './StatusBadge'
import { useApp } from '../AppContext'
import { ArrowRight, AlertTriangle } from 'lucide-react'

interface Props {
  onSelectOrder: (ordnr: string) => void
}

function eur(n: number) {
  return '€ ' + Math.round(n).toLocaleString('nl-NL')
}

export function Dashboard({ onSelectOrder }: Props) {
  const { state } = useApp()
  const commercial = state.enrichedOrders.filter(e => e.order.categorie === 'commercieel')

  const totaleProjectwaarde = commercial.reduce((s, e) => s + e.origineleProjectwaarde, 0)
  const totalGefactureerd   = commercial.reduce((s, e) => s + e.totalGefactureerd, 0)
  const nogTeFactureren     = commercial.reduce((s, e) => s + e.nogTeFactureren, 0)
  const openstaand60        = commercial
    .filter(e => e.betaalStatusBron !== 'onbekend' && (e.debiteur?.gemiddeldDagen ?? 0) <= 60)
    .reduce((s, e) => s + e.openstaand, 0)

  const aanbetalingenHerkend = commercial.filter(e => e.workaroundGedetecteerd).length
  const kritiekCount         = state.issues.filter(i => i.severity === 'kritiek').length
  const serviceCount         = state.enrichedOrders.filter(e => e.order.categorie === 'service').length
  const afgerondCount        = commercial.filter(e =>
    e.order.orderstatus === 'Volledig' && e.openstaand <= 0
  ).length

  const openOrders = commercial
    .filter(e => e.order.orderstatus !== 'Volledig')
    .sort((a, b) => b.origineleProjectwaarde - a.origineleProjectwaarde)
    .slice(0, 15)

  const topIssues = state.issues
    .filter(i => i.severity === 'kritiek' || i.severity === 'controle')
    .slice(0, 5)

  const empty = state.enrichedOrders.length === 0

  return (
    <div style={{ padding: '28px var(--page-pad)', maxWidth: 1400, margin: '0 auto' }}>

      {/* KPI Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 14 }}>
        <KPICard label="Totale projectwaarde"  value={eur(totaleProjectwaarde)}  accent="var(--green)"        delay={0} />
        <KPICard label="Gefactureerd"           value={eur(totalGefactureerd)}    accent="var(--blue)"         delay={60} />
        <KPICard label="Openstaand ≤60 dagen"   value={eur(openstaand60)}         accent="var(--amber)"        delay={120} />
        <KPICard label="Nog te factureren"      value={eur(nogTeFactureren)}      accent="var(--text-muted)"   delay={180} />
      </div>

      {/* KPI Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
        <KPICard label="Aanbetalingen herkend" value={aanbetalingenHerkend} accent="var(--amber)"      delay={240} sub={aanbetalingenHerkend > 0 ? 'workarounds gedetecteerd' : undefined} />
        <KPICard label="Kritieke issues"       value={kritiekCount}         accent="var(--red)"        delay={300} sub={kritiekCount > 0 ? 'directe actie vereist' : 'geen kritieke issues'} />
        <KPICard label="Service / Garantie"    value={serviceCount}         accent="var(--text-muted)" delay={360} sub="gefilterd uit commercieel" />
        <KPICard label="Volledig afgerond"     value={afgerondCount}        accent="var(--green)"      delay={420} sub="betaald + gesloten" />
      </div>

      {empty ? (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          color: 'var(--text-muted)', fontFamily: 'var(--font-body)',
        }}>
          <div style={{ fontSize: 14, marginBottom: 8 }}>Geen data geladen</div>
          <div style={{ fontSize: 12 }}>Ga naar Importeer om Excel-exports te uploaden</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '60fr 40fr', gap: 20 }}>

          {/* Left: open orders */}
          <div style={{
            backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-card)',
            borderRadius: 'var(--radius-card)', overflow: 'hidden',
            backdropFilter: 'blur(16px)',
          }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-label)', fontFamily: 'var(--font-body)' }}>
                Openstaande orders
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {openOrders.length} orders
              </span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-table-header)' }}>
                  {['Klant', 'Order', 'Projectwaarde', 'Gefact.', 'Openstaand', 'Status'].map(h => (
                    <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontSize: 9.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                  <th />
                </tr>
              </thead>
              <tbody>
                {openOrders.map((e) => (
                  <tr
                    key={e.order.normOrdnr}
                    onClick={() => onSelectOrder(e.order.normOrdnr)}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      cursor: 'pointer', transition: 'background 0.12s ease',
                    }}
                    onMouseEnter={ev => (ev.currentTarget.style.background = 'var(--bg-card-hover)')}
                    onMouseLeave={ev => (ev.currentTarget.style.background = '')}
                  >
                    <td style={{ padding: '10px 14px', fontSize: 12.5, fontWeight: 500, color: 'var(--text-primary)' }}>
                      {e.order.klantnaam.split(' ').slice(0, 2).join(' ')}
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {e.order.normOrdnr}
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 12.5, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', color: 'var(--text-primary)' }}>
                      {eur(e.origineleProjectwaarde)}
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 12.5, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', color: e.totalGefactureerd > 0 ? 'var(--green-bright)' : 'var(--text-muted)' }}>
                      {eur(e.totalGefactureerd)}
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 12.5, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', color: e.betaalStatusBron === 'onbekend' ? 'var(--text-muted)' : e.openstaand > 0 ? 'var(--amber-bright)' : 'var(--green-bright)' }}>
                      {e.betaalStatusBron === 'onbekend' ? '—' : eur(e.openstaand)}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <StatusBadge value={e.order.orderstatus} small />
                    </td>
                    <td style={{ padding: '10px 14px 10px 0', textAlign: 'right' }}>
                      <ArrowRight size={13} color="var(--text-muted)" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Top issues */}
            <div style={{
              backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-card)',
              borderRadius: 'var(--radius-card)', overflow: 'hidden',
              backdropFilter: 'blur(16px)',
            }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={12} color="var(--amber)" />
                <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-label)', fontFamily: 'var(--font-body)' }}>
                  Actiepunten
                </span>
              </div>
              {topIssues.length === 0 ? (
                <div style={{ padding: '20px 18px', fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
                  Geen openstaande acties
                </div>
              ) : (
                <div>
                  {topIssues.map((issue, i) => (
                    <div
                      key={i}
                      onClick={() => onSelectOrder(issue.ordernummer)}
                      style={{
                        padding: '12px 18px', borderBottom: '1px solid var(--border-subtle)',
                        cursor: 'pointer', transition: 'background 0.12s ease',
                        display: 'flex', gap: 10, alignItems: 'flex-start',
                      }}
                      onMouseEnter={ev => (ev.currentTarget.style.background = 'var(--bg-card-hover)')}
                      onMouseLeave={ev => (ev.currentTarget.style.background = '')}
                    >
                      <StatusBadge value={issue.severity} small />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2, lineHeight: 1.3 }}>
                          {issue.klantnaam.split(' ').slice(0, 2).join(' ')}
                        </div>
                        <div style={{ fontSize: 10.5, color: 'var(--text-muted)', lineHeight: 1.3 }}>
                          {issue.omschrijving.slice(0, 60)}{issue.omschrijving.length > 60 ? '…' : ''}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Betaalstatus verdeling */}
            <div style={{
              backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-card)',
              borderRadius: 'var(--radius-card)', padding: '16px 18px',
              backdropFilter: 'blur(16px)',
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-label)', fontFamily: 'var(--font-body)', marginBottom: 14 }}>
                Betaalstatus verdeling
              </div>
              {[
                { label: 'Volledig betaald', color: 'var(--green)', count: commercial.filter(e => e.betaalStatusBron !== 'onbekend' && e.openstaand <= 0 && e.totalBetaald > 0).length },
                { label: 'Deels betaald',    color: 'var(--amber)', count: commercial.filter(e => e.betaalStatusBron !== 'onbekend' && e.openstaand > 0 && e.totalBetaald > 0).length },
                { label: 'Niet betaald',     color: 'var(--red)',   count: commercial.filter(e => e.betaalStatusBron !== 'onbekend' && e.totalBetaald <= 0 && e.totalGefactureerd > 0).length },
                { label: 'Onbekend',         color: 'var(--text-muted)', count: commercial.filter(e => e.betaalStatusBron === 'onbekend').length },
              ].map(row => {
                const pct = commercial.length > 0 ? Math.round((row.count / commercial.length) * 100) : 0
                return (
                  <div key={row.label} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{row.label}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{row.count} ({pct}%)</span>
                    </div>
                    <div style={{ height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, backgroundColor: row.color, borderRadius: 2, transition: 'width 0.6s ease', animation: 'growWidth 0.6s ease both' }} />
                    </div>
                  </div>
                )
              })}
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
