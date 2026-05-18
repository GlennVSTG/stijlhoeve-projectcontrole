import { useRef, useState } from 'react'
import { Upload, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { useApp } from '../AppContext'
import { formatDate } from '../lib/excelDate'

const KOLOMMEN = [
  { col: 'A', naam: 'Type',             betekenis: 'ORDER of BETALING' },
  { col: 'B', naam: 'Ordernummer',      betekenis: 'Exact ordernummer' },
  { col: 'C', naam: 'Klant',            betekenis: 'Klantnaam' },
  { col: 'D', naam: 'Omschrijving',     betekenis: 'Productomschrijving' },
  { col: 'E', naam: 'Orderstatus',      betekenis: 'Open / Gedeeltelijk / Volledig' },
  { col: 'F', naam: 'Factuurstatus',    betekenis: 'Open / Volledig' },
  { col: 'G', naam: 'Orderdatum',       betekenis: 'Datum van de order' },
  { col: 'H', naam: 'Orderbedrag (€)',  betekenis: 'ECHTE projectwaarde (akkoordbedrag)' },
  { col: 'I', naam: 'Betaaldatum',      betekenis: 'Datum deelbetaling' },
  { col: 'J', naam: 'Betaalbedrag (€)', betekenis: 'Bedrag deelbetaling' },
  { col: 'K', naam: 'Totaal betaald',   betekenis: 'Automatisch berekend' },
  { col: 'L', naam: 'Openstaand (€)',   betekenis: 'Nog te ontvangen' },
  { col: 'M', naam: 'Betalingsstatus',  betekenis: '✅ ⚠️ ❌ 🚫 status' },
  { col: 'N', naam: 'Opmerking',        betekenis: 'Notitie van Glenn' },
]

export function Importeer() {
  const { loadFile, state } = useApp()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const stats = state.pipelineStatus.stats
  const loaded = state.pipelineStatus.filesLoaded.masterbestand
  const lastRun = state.pipelineStatus.lastRun

  async function handleFile(file: File) {
    setLoading(true)
    setError(null)
    try {
      await loadFile('masterbestand', file)
    } catch {
      setError('Fout bij inlezen — controleer of het het juiste bestand is.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '28px var(--page-pad)', maxWidth: 860, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, fontFamily: 'var(--font-display)', letterSpacing: '-0.03em' }}>
          Importeer
        </h2>
        <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 4 }}>
          Betalingsstatus masterbestand — volledig client-side verwerkt
        </p>
      </div>

      {/* Upload zone */}
      <div style={{
        background: loaded ? 'rgba(61,175,133,0.04)' : 'var(--bg-card)',
        border: `1px solid ${error ? 'var(--red-border)' : loaded ? 'var(--green-border)' : dragOver ? 'var(--green-border)' : 'var(--border-card)'}`,
        borderRadius: 'var(--radius-card)',
        backdropFilter: 'blur(12px)',
        transition: 'all 0.15s ease',
        marginBottom: 20,
        overflow: 'hidden',
        boxShadow: loaded ? '0 4px 20px rgba(61,175,133,0.08)' : '0 4px 18px rgba(0,0,0,0.18)',
      }}>

        {/* Zone header */}
        <div style={{
          padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)',
          display: 'flex', alignItems: 'center', gap: 10,
          background: loaded ? 'rgba(61,175,133,0.06)' : 'rgba(0,0,0,0.15)',
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: loaded ? 'var(--green-bright)' : 'var(--text-primary)', fontFamily: 'var(--font-display)', letterSpacing: '-0.01em' }}>
              Betalingsstatus masterbestand uploaden
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>
              Betalingsstatus_Orders_2026_v3.xlsx · tab: Betalingsstatus per Order
            </div>
          </div>
          {loaded && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <CheckCircle size={14} color="var(--green)" />
              <span style={{ fontSize: 10, color: 'var(--green)', fontFamily: 'var(--font-mono)' }}>geladen</span>
            </div>
          )}
        </div>

        {/* Drop area */}
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
          style={{ padding: '36px 20px', textAlign: 'center', cursor: 'pointer' }}
        >
          <input
            ref={inputRef} type="file" accept=".xlsx,.xls"
            style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
          />

          {loading ? (
            <div>
              <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--green-border)', borderTopColor: 'var(--green)', margin: '0 auto 12px', animation: 'spin 0.8s linear infinite' }} />
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Bezig met inlezen...</div>
            </div>
          ) : loaded && lastRun ? (
            <div>
              <CheckCircle size={28} color="var(--green)" style={{ marginBottom: 10 }} />
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', marginBottom: 4 }}>
                Masterbestand geladen
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--green)', fontFamily: 'var(--font-mono)', marginBottom: 2 }}>
                Geladen om {lastRun.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 6 }}>klik of sleep om te vervangen</div>
            </div>
          ) : (
            <div>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: dragOver ? 'var(--green-dim)' : 'rgba(255,255,255,0.04)', border: `1px solid ${dragOver ? 'var(--green-border)' : 'var(--border-subtle)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', transition: 'all 0.15s ease' }}>
                <Upload size={20} color={dragOver ? 'var(--green)' : 'rgba(255,255,255,0.25)'} />
              </div>
              <div style={{ fontSize: 14, color: dragOver ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                Sleep hier of klik om te uploaden
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 5, fontFamily: 'var(--font-mono)' }}>.xlsx · .xls</div>
            </div>
          )}

          {error && (
            <div style={{ marginTop: 12, fontSize: 12, color: 'var(--red-bright)', display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
              <AlertCircle size={13} />
              {error}
            </div>
          )}
        </div>

        {/* Stats na upload */}
        {loaded && (
          <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.15)', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <Stat label="ORDER regels" value={stats.orderCount} />
            <Stat label="BETALING regels" value={stats.betalingCount} />
            {stats.dateRange.min && stats.dateRange.max && (
              <Stat label="Datumbereik" value={`${formatDate(stats.dateRange.min)} t/m ${formatDate(stats.dateRange.max)}`} />
            )}
          </div>
        )}
      </div>

      {/* Parse warnings */}
      {state.pipelineStatus.warnings.length > 0 && (
        <div style={{ marginBottom: 20, padding: '12px 16px', background: 'var(--amber-dim)', border: '1px solid var(--amber-border)', borderRadius: 'var(--radius-sm)' }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--amber-bright)', marginBottom: 6 }}>
            Parse waarschuwingen
          </div>
          {state.pipelineStatus.warnings.map((w, i) => (
            <div key={i} style={{ fontSize: 11.5, color: 'var(--amber)', lineHeight: 1.6, fontFamily: 'var(--font-mono)' }}>{w}</div>
          ))}
        </div>
      )}

      {/* Kolom uitleg */}
      <div style={{ background: 'var(--blue-dim)', border: '1px solid var(--blue-border)', borderRadius: 'var(--radius-card)', padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Info size={12} color="var(--blue-bright)" />
          <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--blue-bright)', textTransform: 'uppercase', letterSpacing: '0.10em' }}>
            Welke kolommen worden gelezen?
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--blue-border)' }}>
                {['Kolom', 'Naam', 'Wat het betekent'].map(h => (
                  <th key={h} style={{ padding: '4px 12px 8px', textAlign: 'left', fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--blue-bright)', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {KOLOMMEN.map((k, i) => (
                <tr key={k.col} style={{ borderBottom: i < KOLOMMEN.length - 1 ? '1px solid rgba(74,144,226,0.12)' : 'none' }}>
                  <td style={{ padding: '6px 12px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--blue-bright)', whiteSpace: 'nowrap', fontSize: 11 }}>
                    {k.col}
                  </td>
                  <td style={{ padding: '6px 12px', color: 'var(--text-primary)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                    {k.naam}
                  </td>
                  <td style={{ padding: '6px 12px', color: 'rgba(128,191,255,0.72)', lineHeight: 1.4 }}>
                    {k.col === 'H'
                      ? <strong style={{ color: 'var(--blue-bright)' }}>{k.betekenis}</strong>
                      : k.betekenis}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(74,144,226,0.08)', border: '1px solid rgba(74,144,226,0.18)', borderRadius: 'var(--radius-sm)', fontSize: 11.5, color: 'rgba(128,191,255,0.80)', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--blue-bright)' }}>Let op:</strong> kolom H (Orderbedrag) is de echte commerciële projectwaarde — niet de Exact orderwaarde na aanbetalingscorrectie.
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div style={{ fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontWeight: 600, marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ fontSize: 14, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--green-bright)' }}>
        {value}
      </div>
    </div>
  )
}
