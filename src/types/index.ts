// === RAW TYPES — direct output of parse layer ===

export interface RawOrder {
  ordernummer: string
  omschrijving: string
  klantnummer: string
  klantnaam: string
  orderstatus: string
  orderbedragInclBtw: number
  valuta: string
  orderdatum: Date
  leverstatus: string
  factuurstatus: string
  afleverdatum: Date | null
}

export interface RawFactuur {
  ordernummer: string
  omschrijving: string
  factuurnummer: string
  type: string
  klantnummer: string
  klantnaam: string
  valuta: string
  bedragExclBtw: number
  bedragInclBtw: number
  orderdatum: Date
}

export interface RawDebiteur {
  code: string
  naam: string
  datum: Date
  vervaldatum: Date
  nietAchterstallig: number
  dagen31_60: number
  dagenOver60: number
  openstaand: number
  gemiddeldDagen: number
}

export interface RawBankregel {
  datum: Date
  bankrekening: string
  valuta: string
  bedragIn: number
  bedragUit: number
  omschrijving: string
  grootboek: string
  relatie: string
  btwCode: string
  bedragInclBtw: number
  status: string
}

export interface RawReferentieRegel {
  type: 'ORDER' | 'BETALING'
  ordernummer: string
  klant: string
  omschrijving: string
  orderstatus: string
  factuurstatus: string
  orderdatum: Date | null
  orderbedrag: number
  betaaldatum: Date | null
  betaalbedrag: number
  totaalBetaald: number
  openstaand: number
  betalingsstatus: string
  opmerking: string
}

// === NORMALIZED TYPES — output of normalize layer ===

export interface Order extends RawOrder {
  normOrdnr: string
  categorie: 'commercieel' | 'service'
}

export interface Factuur extends RawFactuur {
  normOrdnr: string
  isAanbetaling: boolean
}

export interface Debiteur extends RawDebiteur {
  fuzzyKey: string
}

// === ENRICHED TYPES — output of enrich layer ===

export type ProjectwaardeSource = 'manual' | 'referentie' | 'berekend' | 'exact'
export type BetaalStatusBron = 'referentie' | 'bank' | 'debiteuren' | 'onbekend'
export type OnHoldStatus =
  | 'open'
  | 'on-hold-netbeheerder'
  | 'on-hold-klant'
  | 'on-hold-planning'
  | 'klaar-om-te-factureren'

export interface EnrichedOrder {
  order: Order
  facturen: Factuur[]
  aanbetalingFacturen: Factuur[]
  debiteur: Debiteur | null
  bankregels: RawBankregel[]
  referentie: RawReferentieRegel | null

  // Financials
  exactOrderwaarde: number
  origineleProjectwaarde: number
  projectwaardeSource: ProjectwaardeSource
  projectwaardeHandmatig: number | null
  aanbetalingGefactureerd: number
  aanbetalingBetaald: number
  totalGefactureerd: number
  totalBetaald: number
  betaalStatusBron: BetaalStatusBron
  openstaand: number
  nogTeFactureren: number

  // Workaround
  workaroundGedetecteerd: boolean
  workaroundBevestigd: boolean

  // Manual (localStorage)
  onHoldStatus: OnHoldStatus
  notitie: string
}

// === ISSUE TYPES — output of detect layer ===

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

export interface PipelineStatus {
  lastRun: Date | null
  filesLoaded: {
    orders: boolean
    facturen: boolean
    debiteuren: boolean
    bank: boolean
    referentie: boolean
  }
  warnings: string[]
}

export interface AppState {
  enrichedOrders: EnrichedOrder[]
  issues: Issue[]
  pipelineStatus: PipelineStatus
}
