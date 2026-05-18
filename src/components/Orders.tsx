import { useState } from 'react'
import { StatusBadge } from './StatusBadge'
import { useApp } from '../AppContext'
import type { EnrichedOrder } from '../types'
import { Search, ArrowRight } from 'lucide-react'

interface Props {
  onSelectOrder: (ordnr: string) => void
}

type FilterTab = 'alle' | 'open' | 'deels' | 'afgerond' | 'service'

function eur(n: number) {
  return '€ ' + Math.round(n).toLocaleString('nl-NL')
}

function matchesFilter(e: EnrichedOrder, tab: FilterTab): boolean {
  if (tab === 'service') return e.order.categorie === 'service'
  if (e.order.categorie !== 'commercieel') return false
  switch (tab) {
    case 'alle':     return true
    case 'open':     return e.order.orderstatus !== 'Volledig' && e.totalBetaald <= 0
    case 'deels':    return e.totalBetaald > 0 && e.openstaand > 0
    case 'afgerond': return e.order.orderstatus === 'Volledig' || e.openstaand <= 0
    default:         return true
  }
}

const TABS: { id: FilterTab; label: string }[] = [
  { id: 'alle',     label: 'Alle' },
  { id: 'open',     label: 'Open' },
  { id: 'deels',    label: 'Deels betaald' },
  { id: 'afgerond', label: 'Afgerond' },
  { id: 'service',  label: 'Service/Garantie' },
]

export function Orders({ onSelectOrder }: Props) {
  const { state } = useApp()
  const [activeTab, setActiveTab] = useState<FilterTab>('alle')
  const [search, setSearch] = useState('')

  const filtered = state.enrichedOrders
    .filter(e => matchesFilter(e, activeTab))
    .filter(e =>
      !search ||
      e.order.klantnaam.toLowerCase().includes(search.toLowerCase()) ||
      e.order.normOrdnr.includes(search) ||
      e.order.omschrijving.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => b.origineleProjectwaarde - a.origineleProjectwaarde)

  const isService = activeTab === 'service'

  return (
    <div style={{ padding: '28px var(--page-pad)', maxWidth: 1400, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, fontFamily: 'var(--font-display)', letterSpacing: '-0.03em' }}>
            Orders
          </h2>
          <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 4 }}>
            {filtered.length} {isService ? 'service/garantie' : 'commerciële'} orders
          </p>
        </div>

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
              outline: 'none', width: 280,
              transition: 'border-color 0.15s ease',
            }}
            onFocus={e => (e.target.style.borderColor = 'var(--green-border)')}
            onBlur={e => (e.target.style.borderColor = 'var(--border-card)')}
          />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border-subtle)', marginBottom: 20 }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 16px', border: 'none', cursor: 'pointer',
              background: 'none', fontFamily: 'var(--font-body)', fontSize: 13,
              fontWeight: activeTab === tab.id ? 600 : 400,
              color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-muted)',
              borderBottom: activeTab === tab.id ? '2px solid var(--green)' : '2px solid transparent',
              marginBottom: -1, transition: 'all 0.12s ease',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
          {state.enrichedOrders.length === 0 ? 'Geen data geladen' : 'Geen orders voor dit filter'}
        </div>
      ) : (
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: 'var(--radius-card)', overflow: 'hidden', backdropFilter: 'blur(16px)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-table-header)' }}>
                {(isService
                  ? ['Klant', 'Ordernr', 'Omschrijving', 'Bedrag', 'Status']
                  : ['Klant', 'Ordernr', 'Omschrijving', 'Projectwaarde', 'Gefactureerd', 'Betaald', 'Openstaand', 'Status']
                ).map(h => (
                  <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 9.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map(e => (
                <tr
                  key={e.order.normOrdnr}
                  onClick={() => onSelectOrder(e.order.normOrdnr)}
                  style={{ borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer', transition: 'background 0.1s ease' }}
                  onMouseEnter={ev => (ev.currentTarget.style.background = 'var(--bg-card-hover)')}
                  onMouseLeave={ev => (ev.currentTarget.style.background = '')}
                >
                  <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                    {e.order.klantnaam.split(' ').slice(0, 2).join(' ')}
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                    {e.order.normOrdnr}
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-secondary)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {e.order.omschrijving || '—'}
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: 12.5, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                    {eur(e.origineleProjectwaarde)}
                  </td>
                  {!isService && (
                    <>
                      <td style={{ padding: '10px 14px', fontSize: 12.5, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', color: e.totalGefactureerd > 0 ? 'var(--green-bright)' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {eur(e.totalGefactureerd)}
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 12.5, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', color: e.betaalStatusBron === 'onbekend' ? 'var(--text-muted)' : e.totalBetaald > 0 ? 'var(--green-bright)' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {e.betaalStatusBron === 'onbekend' ? '—' : eur(e.totalBetaald)}
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 12.5, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', color: e.betaalStatusBron === 'onbekend' ? 'var(--text-muted)' : e.openstaand > 0 ? 'var(--amber-bright)' : 'var(--green-bright)', whiteSpace: 'nowrap' }}>
                        {e.betaalStatusBron === 'onbekend' ? '—' : eur(e.openstaand)}
                      </td>
                    </>
                  )}
                  <td style={{ padding: '10px 14px' }}>
                    <StatusBadge value={e.order.orderstatus} small />
                  </td>
                  <td style={{ padding: '10px 14px 10px 0', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <ArrowRight size={13} color="var(--text-muted)" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
