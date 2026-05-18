import type { Order, Factuur, Debiteur, RawBankregel, RawReferentieRegel } from '../types'
import { fuzzyKey } from './normalize'

export interface JoinedOrder {
  order: Order
  facturen: Factuur[]
  debiteur: Debiteur | null
  bankregels: RawBankregel[]
  referentie: RawReferentieRegel | null
}

export function joinData(
  orders: Order[],
  facturen: Factuur[],
  debiteuren: Debiteur[],
  bankregels: RawBankregel[],
  referentieRegels: RawReferentieRegel[],
): JoinedOrder[] {
  // Count orders per fuzzyKey for single-order constraint
  const orderCountPerFuzzyKey: Record<string, number> = {}
  for (const o of orders) {
    const key = fuzzyKey(o.klantnaam)
    orderCountPerFuzzyKey[key] = (orderCountPerFuzzyKey[key] ?? 0) + 1
  }

  // Index facturen by normOrdnr
  const facturenByOrder: Record<string, Factuur[]> = {}
  for (const f of facturen) {
    if (!facturenByOrder[f.normOrdnr]) facturenByOrder[f.normOrdnr] = []
    facturenByOrder[f.normOrdnr].push(f)
  }

  // Index debiteuren by fuzzyKey
  const debiteurByFuzzyKey: Record<string, Debiteur> = {}
  for (const d of debiteuren) {
    debiteurByFuzzyKey[d.fuzzyKey] = d
  }

  // Index bank betaalregels by relatie fuzzyKey (only 1300-Debiteuren entries)
  const bankByFuzzyKey: Record<string, RawBankregel[]> = {}
  for (const b of bankregels) {
    if (!b.grootboek.includes('1300')) continue
    const key = fuzzyKey(b.relatie)
    if (!key) continue
    if (!bankByFuzzyKey[key]) bankByFuzzyKey[key] = []
    bankByFuzzyKey[key].push(b)
  }

  // Index referentie ORDER rows by normalized ordernummer
  const referentieByOrder: Record<string, RawReferentieRegel> = {}
  for (const r of referentieRegels) {
    if (r.type === 'ORDER') referentieByOrder[r.ordernummer] = r
  }

  return orders.map(order => {
    const fkey = fuzzyKey(order.klantnaam)
    // Only link debiteur/bank data if this customer has exactly one order
    // (prevents cross-order contamination for multi-order customers)
    const singleOrderCustomer = (orderCountPerFuzzyKey[fkey] ?? 0) === 1

    return {
      order,
      facturen: facturenByOrder[order.normOrdnr] ?? [],
      debiteur: singleOrderCustomer ? (debiteurByFuzzyKey[fkey] ?? null) : null,
      bankregels: singleOrderCustomer ? (bankByFuzzyKey[fkey] ?? []) : [],
      referentie: referentieByOrder[order.normOrdnr] ?? null,
    }
  })
}
