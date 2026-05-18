import type { RawOrder, Betaling, Categorie, ParseStats } from '../types'
import { excelDateToJS } from './excelDate'
import { parseNum, str, readExcelFile } from './parseUtils'

export interface ParseResult {
  orders: RawOrder[]
  stats: ParseStats
  warnings: string[]
}

function categorize(orderbedrag: number, orderstatus: string): Categorie {
  if (orderstatus.toLowerCase().includes('geannuleerd')) return 'geannuleerd'
  if (orderbedrag <= 0 || orderbedrag < 600) return 'service'
  return 'commercieel'
}

export async function parseMasterbestand(file: File): Promise<ParseResult> {
  const warnings: string[] = []
  const empty: ParseResult = {
    orders: [],
    stats: { orderCount: 0, betalingCount: 0, dateRange: { min: null, max: null } },
    warnings,
  }

  let rawRows: unknown[][]
  try {
    rawRows = await readExcelFile(file, 'Betalingsstatus per Order')
  } catch {
    warnings.push(`${file.name}: kon bestand niet lezen`)
    return { ...empty, warnings }
  }

  // Scan eerste 10 rijen voor header — zoek cel exact "Type"
  const headerRowIndex = rawRows.slice(0, 10).findIndex(row =>
    (row as unknown[]).some(cell => String(cell ?? '').trim() === 'Type')
  )

  if (headerRowIndex === -1) {
    warnings.push(`${file.name}: kolom 'Type' niet gevonden in eerste 10 rijen`)
    return { ...empty, warnings }
  }

  const headers = (rawRows[headerRowIndex] as unknown[]).map(h => str(h).toLowerCase().trim())

  // Kolomindices — fallback naar positie uit specificatie
  const col = {
    type:            headers.findIndex(h => h === 'type'),
    ordernummer:     headers.findIndex(h => h.includes('ordernummer')),
    klant:           headers.findIndex(h => h === 'klant' || h === 'klantnaam'),
    omschrijving:    headers.findIndex(h => h.includes('omschrijving')),
    orderstatus:     headers.findIndex(h => h === 'orderstatus'),
    factuurstatus:   headers.findIndex(h => h === 'factuurstatus'),
    orderdatum:      headers.findIndex(h => h.includes('orderdatum')),
    orderbedrag:     headers.findIndex(h => h.includes('orderbedrag')),
    betaaldatum:     headers.findIndex(h => h.includes('betaaldatum')),
    betaalbedrag:    headers.findIndex(h => h === 'betaalbedrag'),
    totaalBetaald:   headers.findIndex(h => h.includes('totaal')),
    openstaand:      headers.findIndex(h => h.includes('openstaand')),
    betalingsstatus: headers.findIndex(h => h.includes('betalingsstatus')),
    opmerking:       headers.findIndex(h => h.includes('opmerking') || h === 'notitie'),
  }

  function get(row: unknown[], colIdx: number, fallback: number): unknown {
    return colIdx >= 0 ? row[colIdx] : row[fallback]
  }

  const ordersMap = new Map<string, RawOrder>()
  let betalingCount = 0
  let lastOrdnr = ''

  for (const r of rawRows.slice(headerRowIndex + 1)) {
    const row = r as unknown[]
    if (!row.some(c => c !== '' && c !== null && c !== undefined)) continue

    const typeRaw = str(get(row, col.type, 0)).toUpperCase().trim()
    if (!typeRaw) continue
    if (typeRaw === 'SAMENVATTING' || typeRaw.startsWith('TOTAAL')) break

    if (typeRaw === 'ORDER') {
      const ordernummer = str(get(row, col.ordernummer, 1))
      if (!ordernummer) continue
      lastOrdnr = ordernummer

      const orderbedrag = parseNum(get(row, col.orderbedrag, 7))
      const orderstatus  = str(get(row, col.orderstatus, 4), 'Open')

      ordersMap.set(ordernummer, {
        ordernummer,
        klantnaam:      str(get(row, col.klant, 2)),
        omschrijving:   str(get(row, col.omschrijving, 3)),
        orderstatus,
        factuurstatus:  str(get(row, col.factuurstatus, 5), 'Open'),
        orderdatum:     excelDateToJS(get(row, col.orderdatum, 6)) ?? new Date(),
        orderbedrag,
        betalingen:     [],
        totaalBetaald:  parseNum(get(row, col.totaalBetaald, 10)),
        openstaand:     parseNum(get(row, col.openstaand, 11)),
        betalingsstatus: str(get(row, col.betalingsstatus, 12)),
        notitie:        str(get(row, col.opmerking, 13)),
        categorie:      categorize(orderbedrag, orderstatus),
      })
    } else if (typeRaw === 'BETALING') {
      const ordernummer = str(get(row, col.ordernummer, 1)) || lastOrdnr
      const order = ordersMap.get(ordernummer)
      if (order) {
        const betaling: Betaling = {
          ordernummer,
          betaaldatum:  excelDateToJS(get(row, col.betaaldatum, 8)),
          betaalbedrag: parseNum(get(row, col.betaalbedrag, 9)),
        }
        order.betalingen.push(betaling)
        betalingCount++
      }
    }
  }

  const orders = Array.from(ordersMap.values())

  const dates = orders.map(o => o.orderdatum)
  const dateRange = dates.length > 0
    ? { min: new Date(Math.min(...dates.map(d => d.getTime()))), max: new Date(Math.max(...dates.map(d => d.getTime()))) }
    : { min: null, max: null }

  return {
    orders,
    stats: { orderCount: orders.length, betalingCount, dateRange },
    warnings,
  }
}
