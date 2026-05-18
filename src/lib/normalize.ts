import type { RawOrder, RawFactuur, RawDebiteur, Order, Factuur, Debiteur } from '../types'

const AANBETALING_KEYWORDS = ['aanbetaling', 'deelfactuur', '30%', '40%', '50%']

export function normalizeOrdnr(raw: string): string {
  const match = raw.match(/(\d{6,})$/)
  return match ? match[1] : raw
}

export function categorize(orderbedrag: number): 'commercieel' | 'service' {
  return orderbedrag <= 0 || orderbedrag < 600 ? 'service' : 'commercieel'
}

export function isAanbetalingFactuur(omschrijving: string): boolean {
  const lower = omschrijving.toLowerCase()
  return AANBETALING_KEYWORDS.some(kw => lower.includes(kw))
}

export function fuzzyKey(naam: string): string {
  return naam.trim().split(/\s+/)[0].toLowerCase()
}

export function normalizeOrders(raw: RawOrder[]): Order[] {
  return raw.map(r => ({
    ...r,
    normOrdnr: normalizeOrdnr(r.ordernummer),
    categorie: categorize(r.orderbedragInclBtw),
  }))
}

export function normalizeFacturen(raw: RawFactuur[]): Factuur[] {
  return raw.map(f => ({
    ...f,
    normOrdnr: normalizeOrdnr(f.ordernummer),
    isAanbetaling: isAanbetalingFactuur(f.omschrijving),
  }))
}

export function normalizeDebiteuren(raw: RawDebiteur[]): Debiteur[] {
  return raw.map(d => ({
    ...d,
    fuzzyKey: fuzzyKey(d.naam),
  }))
}
