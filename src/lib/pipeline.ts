import type {
  RawOrder, RawFactuur, RawDebiteur, RawBankregel, RawReferentieRegel,
  AppState, PipelineStatus
} from '../types'
import { normalizeOrders, normalizeFacturen, normalizeDebiteuren } from './normalize'
import { joinData } from './matchData'
import { enrichOrders } from './enrichOrder'
import { detectIssues } from './detectIssues'

export interface RawData {
  orders: RawOrder[]
  facturen: RawFactuur[]
  debiteuren: RawDebiteur[]
  bankregels: RawBankregel[]
  referentie: RawReferentieRegel[]
  filesLoaded: PipelineStatus['filesLoaded']
  warnings: string[]
  lastRun: Date | null
}

export const EMPTY_RAW_DATA: RawData = {
  orders: [],
  facturen: [],
  debiteuren: [],
  bankregels: [],
  referentie: [],
  filesLoaded: { orders: false, facturen: false, debiteuren: false, bank: false, referentie: false },
  warnings: [],
  lastRun: null,
}

export function runPipeline(raw: RawData): AppState {
  const orders = normalizeOrders(raw.orders)
  const facturen = normalizeFacturen(raw.facturen)
  const debiteuren = normalizeDebiteuren(raw.debiteuren)

  const joined = joinData(orders, facturen, debiteuren, raw.bankregels, raw.referentie)
  const enrichedOrders = enrichOrders(joined)
  const issues = detectIssues(enrichedOrders)

  return {
    enrichedOrders,
    issues,
    pipelineStatus: {
      lastRun: raw.lastRun,
      filesLoaded: raw.filesLoaded,
      warnings: raw.warnings,
    },
  }
}
