// === BETALINGDATA ===

export interface Betaling {
  ordernummer: string
  betaaldatum: Date | null
  betaalbedrag: number
}

export type Categorie = 'commercieel' | 'service' | 'geannuleerd'

export type OnHoldStatus =
  | 'open'
  | 'on-hold-netbeheerder'
  | 'on-hold-klant'
  | 'on-hold-planning'
  | 'klaar-om-te-factureren'

// === RAW — direct uit parseMasterbestand ===

export interface RawOrder {
  ordernummer: string
  klantnaam: string
  omschrijving: string
  orderstatus: string
  factuurstatus: string
  orderdatum: Date
  orderbedrag: number
  betalingen: Betaling[]
  totaalBetaald: number
  openstaand: number
  betalingsstatus: string
  notitie: string
  categorie: Categorie
}

// === ENRICHED — raw + localStorage ===

export interface EnrichedOrder extends RawOrder {
  onHoldStatus: OnHoldStatus
}

// === ISSUES ===

export type Severity = 'kritiek' | 'controle' | 'waarschuwing' | 'info'
export type ActieLabel = 'Nabellen' | 'Controleren' | 'Bevestigen' | 'Administratie'

export interface Issue {
  ordernummer: string
  klantnaam: string
  severity: Severity
  actieLabel: ActieLabel
  omschrijving: string
}

// === APP STATE ===

export interface ParseStats {
  orderCount: number
  betalingCount: number
  dateRange: { min: Date | null; max: Date | null }
}

export interface PipelineStatus {
  lastRun: Date | null
  filesLoaded: { masterbestand: boolean }
  stats: ParseStats
  warnings: string[]
}

export interface AppState {
  enrichedOrders: EnrichedOrder[]
  issues: Issue[]
  pipelineStatus: PipelineStatus
}
