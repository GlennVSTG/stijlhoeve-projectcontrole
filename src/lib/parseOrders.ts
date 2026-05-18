import type { RawOrder } from '../types'
import { excelDateToJS } from './excelDate'
import { parseNum, findCol, readExcelFile, findHeaderRow, str } from './parseUtils'

export async function parseOrders(file: File): Promise<{ rows: RawOrder[]; warnings: string[] }> {
  const warnings: string[] = []
  let rawRows: unknown[][]

  try {
    rawRows = await readExcelFile(file)
  } catch {
    return { rows: [], warnings: [`${file.name}: kon bestand niet lezen`] }
  }

  const headerRowIndex = findHeaderRow(rawRows, 'Ordernummer')
  if (headerRowIndex === -1) {
    return { rows: [], warnings: [`${file.name}: kolom 'Ordernummer' niet gevonden in eerste 30 rijen`] }
  }

  const headers = (rawRows[headerRowIndex] as unknown[]).map(h => str(h))
  const dataRows = rawRows.slice(headerRowIndex + 1).filter(row =>
    (row as unknown[]).some(cell => cell !== '' && cell !== null && cell !== undefined)
  )

  const col = {
    ordernummer:        findCol(headers, 'ordernummer'),
    omschrijving:       findCol(headers, 'omschrijving'),
    klantnummer:        findCol(headers, 'besteld door', 'klantcode', 'klantnr', 'debiteurcode', 'code'),
    klantnaam:          findCol(headers, 'klantnaam', 'klant', 'naam'),
    orderstatus:        findCol(headers, 'orderstatus'),
    orderbedragInclBtw: findCol(headers, 'orderbedrag', 'incl'),
    valuta:             findCol(headers, 'val.', 'valuta'),
    orderdatum:         findCol(headers, 'orderdatum'),
    leverstatus:        findCol(headers, 'leverstatus'),
    factuurstatus:      findCol(headers, 'factuurstatus'),
    afleverdatum:       findCol(headers, 'afleverdatum'),
  }

  const rows: RawOrder[] = []
  for (const r of dataRows) {
    const row = r as unknown[]
    const ordernummer = col.ordernummer >= 0 ? str(row[col.ordernummer]) : str(row[0])
    if (!ordernummer) continue

    const bedrag = col.orderbedragInclBtw >= 0 ? parseNum(row[col.orderbedragInclBtw]) : parseNum(row[5])
    const datum = excelDateToJS(col.orderdatum >= 0 ? row[col.orderdatum] : row[7])
    if (!datum) warnings.push(`Order ${ordernummer}: ongeldige orderdatum`)

    rows.push({
      ordernummer,
      omschrijving:       col.omschrijving >= 0  ? str(row[col.omschrijving])        : str(row[1]),
      klantnummer:        col.klantnummer >= 0   ? str(row[col.klantnummer])         : str(row[2]),
      klantnaam:          col.klantnaam >= 0     ? str(row[col.klantnaam])           : str(row[3]),
      orderstatus:        col.orderstatus >= 0   ? str(row[col.orderstatus], 'Open') : str(row[4], 'Open'),
      orderbedragInclBtw: bedrag,
      valuta:             col.valuta >= 0        ? str(row[col.valuta], 'EUR')       : 'EUR',
      orderdatum:         datum ?? new Date(),
      leverstatus:        col.leverstatus >= 0   ? str(row[col.leverstatus])         : str(row[8]),
      factuurstatus:      col.factuurstatus >= 0 ? str(row[col.factuurstatus])       : str(row[9]),
      afleverdatum:       excelDateToJS(col.afleverdatum >= 0 ? row[col.afleverdatum] : row[10]),
    })
  }

  return { rows, warnings }
}
