import type { RawBankregel } from '../types'
import { excelDateToJS } from './excelDate'
import { parseNum, findCol, readExcelFile, findHeaderRow, str } from './parseUtils'

export async function parseBank(file: File): Promise<{ rows: RawBankregel[]; warnings: string[] }> {
  const warnings: string[] = []
  let rawRows: unknown[][]

  try {
    rawRows = await readExcelFile(file)
  } catch {
    return { rows: [], warnings: [`${file.name}: kon bestand niet lezen`] }
  }

  const headerRowIndex = findHeaderRow(rawRows, 'Bankrekening')
  if (headerRowIndex === -1) {
    return { rows: [], warnings: [`${file.name}: kolom 'Bankrekening' niet gevonden in eerste 30 rijen`] }
  }

  const headers = (rawRows[headerRowIndex] as unknown[]).map(h => str(h))
  const dataRows = rawRows.slice(headerRowIndex + 1).filter(row =>
    (row as unknown[]).some(cell => cell !== '' && cell !== null && cell !== undefined)
  )

  const col = {
    datum:        findCol(headers, 'datum'),
    bankrekening: findCol(headers, 'bankrekening', 'rekening'),
    valuta:       findCol(headers, 'val.', 'valuta'),
    bedragIn:     findCol(headers, 'bedrag in', 'credit', 'ontvangen'),
    bedragUit:    findCol(headers, 'bedrag uit', 'debet', 'betaald'),
    omschrijving: findCol(headers, 'omschrijving'),
    grootboek:    findCol(headers, 'grootboekrekening', 'grootboek'),
    relatie:      findCol(headers, 'relatie'),
    btwCode:      findCol(headers, 'btw-code', 'btw', 'vat'),
    bedragInclBtw: findCol(headers, 'bedrag incl', 'incl.btw'),
    status:       findCol(headers, 'status'),
  }

  const rows: RawBankregel[] = []
  for (const r of dataRows) {
    const row = r as unknown[]
    const bankrekening = col.bankrekening >= 0 ? str(row[col.bankrekening]) : str(row[1])
    if (!bankrekening) continue

    const datum = excelDateToJS(col.datum >= 0 ? row[col.datum] : row[0]) ?? new Date()

    rows.push({
      datum,
      bankrekening,
      valuta:       col.valuta >= 0       ? str(row[col.valuta], 'EUR')         : 'EUR',
      bedragIn:     col.bedragIn >= 0     ? parseNum(row[col.bedragIn])         : parseNum(row[3]),
      bedragUit:    col.bedragUit >= 0    ? parseNum(row[col.bedragUit])        : parseNum(row[4]),
      omschrijving: col.omschrijving >= 0 ? str(row[col.omschrijving])          : str(row[5]),
      grootboek:    col.grootboek >= 0    ? str(row[col.grootboek])             : str(row[6]),
      relatie:      col.relatie >= 0      ? str(row[col.relatie])               : str(row[7]),
      btwCode:      col.btwCode >= 0      ? str(row[col.btwCode])               : str(row[8]),
      bedragInclBtw: col.bedragInclBtw >= 0 ? parseNum(row[col.bedragInclBtw]) : parseNum(row[9]),
      status:       col.status >= 0       ? str(row[col.status])                : str(row[10]),
    })
  }

  return { rows, warnings }
}
