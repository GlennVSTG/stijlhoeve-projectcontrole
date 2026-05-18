import type { RawFactuur } from '../types'
import { excelDateToJS } from './excelDate'
import { parseNum, findCol, readExcelFile, findHeaderRow, str } from './parseUtils'

export async function parseFacturen(file: File): Promise<{ rows: RawFactuur[]; warnings: string[] }> {
  const warnings: string[] = []
  let rawRows: unknown[][]

  try {
    rawRows = await readExcelFile(file)
  } catch {
    return { rows: [], warnings: [`${file.name}: kon bestand niet lezen`] }
  }

  const headerRowIndex = findHeaderRow(rawRows, 'Factuurnummer')
  if (headerRowIndex === -1) {
    return { rows: [], warnings: [`${file.name}: kolom 'Factuurnummer' niet gevonden in eerste 30 rijen`] }
  }

  const headers = (rawRows[headerRowIndex] as unknown[]).map(h => str(h))
  const dataRows = rawRows.slice(headerRowIndex + 1).filter(row =>
    (row as unknown[]).some(cell => cell !== '' && cell !== null && cell !== undefined)
  )

  const col = {
    ordernummer:   findCol(headers, 'ordernummer'),
    omschrijving:  findCol(headers, 'omschrijving'),
    factuurnummer: findCol(headers, 'factuurnummer'),
    type:          findCol(headers, 'type'),
    klantnummer:   findCol(headers, 'klantnr', 'klantnummer', 'debiteur'),
    klantnaam:     findCol(headers, 'klantnaam', 'klant', 'naam'),
    valuta:        findCol(headers, 'val.', 'valuta'),
    bedragExclBtw: findCol(headers, 'excl'),
    bedragInclBtw: findCol(headers, 'incl'),
    orderdatum:    findCol(headers, 'datum', 'orderdatum'),
  }

  const rows: RawFactuur[] = []
  for (const r of dataRows) {
    const row = r as unknown[]
    const ordernummer = col.ordernummer >= 0 ? str(row[col.ordernummer]) : str(row[0])
    if (!ordernummer) continue

    const datum = excelDateToJS(col.orderdatum >= 0 ? row[col.orderdatum] : row[9])
    if (!datum) warnings.push(`Factuur ${str(row[col.factuurnummer])}: ongeldige datum`)

    rows.push({
      ordernummer,
      omschrijving:  col.omschrijving >= 0  ? str(row[col.omschrijving])        : str(row[1]),
      factuurnummer: col.factuurnummer >= 0 ? str(row[col.factuurnummer])       : str(row[2]),
      type:          col.type >= 0          ? str(row[col.type])                : str(row[3]),
      klantnummer:   col.klantnummer >= 0   ? str(row[col.klantnummer])         : str(row[4]),
      klantnaam:     col.klantnaam >= 0     ? str(row[col.klantnaam])           : str(row[5]),
      valuta:        col.valuta >= 0        ? str(row[col.valuta], 'EUR')       : 'EUR',
      bedragExclBtw: col.bedragExclBtw >= 0 ? parseNum(row[col.bedragExclBtw]) : parseNum(row[7]),
      bedragInclBtw: col.bedragInclBtw >= 0 ? parseNum(row[col.bedragInclBtw]) : parseNum(row[8]),
      orderdatum:    datum ?? new Date(),
    })
  }

  return { rows, warnings }
}
