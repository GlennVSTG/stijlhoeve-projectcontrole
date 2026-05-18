import { useRef, useState } from 'react'
import { Upload, CheckCircle, FileSpreadsheet, Info, AlertCircle } from 'lucide-react'
import { useApp, type FileType } from '../AppContext'

interface ZoneInfo {
  bestandsnaam: string
  datum: string
}

const ZONES: { key: FileType; label: string; required: boolean; kolommen: string; accent: string }[] = [
  { key: 'orders',     label: 'Verkooporders',             required: true,  accent: 'var(--green)',       kolommen: 'Ordernummer · Omschrijving · Besteld door · Klantnaam · Orderstatus · Orderbedrag+BTW · Val. · Orderdatum · Leverstatus · Factuurstatus · Afleverdatum' },
  { key: 'facturen',   label: 'Verkoopfacturen',           required: true,  accent: 'var(--blue-bright)', kolommen: 'Ordernummer · Omschrijving · Factuurnummer · Type · Klantnr · Klantnaam · Val. · Bedrag excl BTW · Bedrag+BTW · Orderdatum' },
  { key: 'debiteuren', label: 'Debiteuren',                required: true,  accent: 'var(--amber-bright)', kolommen: 'Code · Naam · Datum · Vervaldatum · Niet achterstallig · 31-60 dagen · >60 dagen · Openstaand · Gemiddeld (dagen)' },
  { key: 'bank',       label: 'Bank / Kas',                required: false, accent: 'var(--text-muted)',  kolommen: 'Datum · Bankrekening · Val. · Bedrag in · Bedrag uit · Omschrijving · Grootboekrekening · Relatie · BTW-code · Bedrag incl. BTW · Status' },
  { key: 'referentie', label: 'Betalingsstatus referentie', required: false, accent: 'var(--text-muted)', kolommen: 'Type · Ordernummer · Klant · Omschrijving · Orderstatus · Factuurstatus · Orderdatum · Orderbedrag · Betaaldatum · Betaalbedrag · Totaal betaald · Openstaand · Betalingsstatus · Opmerking' },
]

interface UploadZoneProps {
  zone: typeof ZONES[number]
  isLoaded: boolean
  isLoading: boolean
  info: ZoneInfo | undefined
  error: string | undefined
  inputRef: React.RefObject<HTMLInputElement | null>
  onFile: (file: File) => void
}

function UploadZone({ zone, isLoaded, isLoading, info, error, inputRef, onFile }: UploadZoneProps) {
  const [dragOver, setDragOver] = useState(false)

  return (
    <div style={{
      background: isLoaded ? 'rgba(61,175,133,0.04)' : 'var(--bg-card)',
      border: `1px solid ${error ? 'var(--red-border)' : isLoaded ? 'var(--green-border)' : dragOver ? 'var(--green-border)' : 'var(--border-card)'}`,
      borderRadius: 'var(--radius-card)', overflow: 'hidden',
      backdropFilter: 'blur(12px)',
      transition: 'all 0.15s ease',
      boxShadow: isLoaded ? '0 4px 20px rgba(61,175,133,0.08)' : '0 4px 18px rgba(0,0,0,0.18)',
    }}>

      {/* Zone header */}
      <div style={{
        padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', alignItems: 'center', gap: 8,
        background: isLoaded ? 'rgba(61,175,133,0.06)' : 'rgba(0,0,0,0.15)',
      }}>
        <FileSpreadsheet size={12} color={isLoaded ? 'var(--green)' : zone.accent} />
        <span style={{ fontSize: 11.5, fontWeight: 600, color: isLoaded ? 'var(--green-bright)' : 'var(--text-primary)', fontFamily: 'var(--font-display)', flex: 1 }}>
          {zone.label}
        </span>
        {!zone.required && !isLoaded && (
          <span style={{ fontSize: 8.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '1px 7px', borderRadius: 10, background: 'rgba(255,255,255,0.05)' }}>
            Optioneel
          </span>
        )}
        {isLoaded && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <CheckCircle size={13} color="var(--green)" />
            <span style={{ fontSize: 9.5, color: 'var(--green)', fontFamily: 'var(--font-mono)' }}>
              geladen
            </span>
          </div>
        )}
      </div>

      {/* Drop area */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) onFile(f) }}
        style={{ padding: '22px 16px', textAlign: 'center', cursor: 'pointer' }}
      >
        <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f) }} />

        {isLoading ? (
          <div>
            <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid var(--green-border)', borderTopColor: 'var(--green)', margin: '0 auto 10px', animation: 'spin 0.8s linear infinite' }} />
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Bezig met inlezen...</div>
          </div>
        ) : info ? (
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', marginBottom: 3 }}>{info.bestandsnaam}</div>
            <div style={{ fontSize: 10.5, color: 'var(--green)', fontFamily: 'var(--font-mono)' }}>Geladen om {info.datum}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 5 }}>klik of sleep om te vervangen</div>
          </div>
        ) : (
          <div>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: dragOver ? 'var(--green-dim)' : 'rgba(255,255,255,0.04)', border: `1px solid ${dragOver ? 'var(--green-border)' : 'var(--border-subtle)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', transition: 'all 0.15s ease' }}>
              <Upload size={16} color={dragOver ? 'var(--green)' : 'rgba(255,255,255,0.25)'} />
            </div>
            <div style={{ fontSize: 12.5, color: dragOver ? 'var(--text-primary)' : 'var(--text-secondary)' }}>Sleep of klik om te uploaden</div>
            <div style={{ fontSize: 9.5, color: 'var(--text-muted)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>.xlsx · .xls · .csv</div>
          </div>
        )}

        {error && (
          <div style={{ marginTop: 10, fontSize: 11, color: 'var(--red-bright)', display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'center' }}>
            <AlertCircle size={11} />
            {error}
          </div>
        )}
      </div>

      {/* Column info */}
      <div style={{ padding: '8px 16px', borderTop: '1px solid rgba(255,255,255,0.04)', background: 'rgba(0,0,0,0.18)' }}>
        <div style={{ fontSize: 9.5, color: 'var(--text-muted)', lineHeight: 1.7, fontFamily: 'var(--font-mono)', opacity: 0.75 }}>
          {zone.kolommen}
        </div>
      </div>
    </div>
  )
}

export function Importeer() {
  const { loadFile, state } = useApp()
  const [loading, setLoading] = useState<FileType | null>(null)
  const [errors, setErrors] = useState<Partial<Record<FileType, string>>>({})
  const [zoneInfo, setZoneInfo] = useState<Partial<Record<FileType, ZoneInfo>>>({})

  const refs = {
    orders:     useRef<HTMLInputElement>(null),
    facturen:   useRef<HTMLInputElement>(null),
    debiteuren: useRef<HTMLInputElement>(null),
    bank:       useRef<HTMLInputElement>(null),
    referentie: useRef<HTMLInputElement>(null),
  }

  async function handleFile(key: FileType, file: File) {
    setLoading(key)
    setErrors(prev => ({ ...prev, [key]: undefined }))
    try {
      await loadFile(key, file)
      setZoneInfo(prev => ({
        ...prev,
        [key]: {
          bestandsnaam: file.name,
          datum: new Date().toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }),
        },
      }))
    } catch {
      setErrors(prev => ({ ...prev, [key]: 'Fout bij inlezen — controleer het formaat.' }))
    } finally {
      setLoading(null)
    }
  }

  const requiredLoaded = ZONES.filter(z => z.required && state.pipelineStatus.filesLoaded[z.key]).length

  return (
    <div style={{ padding: '28px var(--page-pad)', maxWidth: 1040, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0, fontFamily: 'var(--font-display)', letterSpacing: '-0.03em' }}>
            Importeer
          </h2>
          <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 4 }}>
            Excel-exports uit Exact Online — volledig client-side verwerkt
          </p>
        </div>
        {requiredLoaded > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px', background: 'var(--green-dim)', border: '1px solid var(--green-border)', borderRadius: 'var(--radius-sm)' }}>
            <CheckCircle size={13} color="var(--green)" />
            <span style={{ fontSize: 11.5, color: 'var(--green-bright)', fontFamily: 'var(--font-body)', fontWeight: 500 }}>
              {requiredLoaded}/3 vereiste bestanden geladen
            </span>
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
            <div key={i} style={{ fontSize: 11.5, color: 'var(--amber)', lineHeight: 1.6, fontFamily: 'var(--font-mono)' }}>
              {w}
            </div>
          ))}
        </div>
      )}

      {/* Upload grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
        {ZONES.map((zone, i) => (
          <div
            key={zone.key}
            style={{ gridColumn: i === 4 ? '1 / -1' : undefined }}
          >
            <UploadZone
              zone={zone}
              isLoaded={state.pipelineStatus.filesLoaded[zone.key]}
              isLoading={loading === zone.key}
              info={zoneInfo[zone.key]}
              error={errors[zone.key]}
              inputRef={refs[zone.key]}
              onFile={file => handleFile(zone.key, file)}
            />
          </div>
        ))}
      </div>

      {/* Export instructions */}
      <div style={{ background: 'var(--blue-dim)', border: '1px solid var(--blue-border)', borderRadius: 'var(--radius-card)', padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Info size={12} color="var(--blue-bright)" />
          <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--blue-bright)', textTransform: 'uppercase', letterSpacing: '0.10em' }}>
            Exporteren uit Exact Online
          </span>
        </div>
        <div style={{ fontSize: 11.5, color: 'rgba(128,191,255,0.72)', lineHeight: 1.9, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 24px' }}>
          <div><strong style={{ color: 'var(--blue-bright)' }}>Verkooporders:</strong> Verkoop → Orders → Overzicht → Export</div>
          <div><strong style={{ color: 'var(--blue-bright)' }}>Verkoopfacturen:</strong> Verkoop → Facturen → Overzicht → Export</div>
          <div><strong style={{ color: 'var(--blue-bright)' }}>Debiteuren:</strong> Financieel → Debiteuren → Ouderdomsanalyse</div>
          <div><strong style={{ color: 'var(--blue-bright)' }}>Bank/Kas:</strong> Financieel → Bank → Mutatieoverzicht</div>
          <div style={{ gridColumn: '1 / -1' }}>
            <strong style={{ color: 'var(--blue-bright)' }}>Betalingsstatus:</strong> Betalingsstatus_Orders_2026_v3.xlsx — vult ontbrekende betaalinfo aan
          </div>
        </div>
      </div>
    </div>
  )
}
