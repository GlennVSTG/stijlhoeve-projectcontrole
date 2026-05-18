import type { RawDebiteur } from '../types'
import { excelDateToJS } from './excelDate'
import { parseNum, findCol, readExcelFile, findHeaderRow, str } from './parseUtils'

export async function parseDebiteuren(file: File): Promise<{ rows: RawDebiteur[]; warnings: string[] }> {
  const warnings: string[] = []
  let rawRows: unknown[][]

  try {
    rawRows = await readExcelFile(file)
  } catch {
    return { rows: [], warnings: [`${file.name}: kon bestand niet lezen`] }
  }

  const headerRowIndex = findHeaderRow(rawRows, 'Openstaand')
  if (headerRowIndex === -1) {
    return { rows: [], warnings: [`${file.name}: kolom 'Openstaand' niet gevonden in eerste 30 rijen`] }
  }

  const headers = (rawRows[headerRowIndex] as unknown[]).map(h => str(h))
  const dataRows = rawRows.slice(headerRowIndex + 1).filter(row =>
    (row as unknown[]).some(cell => cell !== '' && cell !== null && cell !== undefined)
  )

  const col = {
    code:              findCol(headers, 'code', 'debiteur'),
    naam:              findCol(headers, 'naam', 'klant'),
    datum:             findCol(headers, 'datum'),
    vervaldatum:       findCol(headers, 'verval', 'due'),
    nietAchterstallig: findCol(headers, 'niet achterstallig', 'niet-achterstallig', 'current'),
    dagen31_60:        findCol(headers, '31 - 60', '31-60', '31 t/m 60'),
    dagenOver60:       findCol(headers, '> 60', '>60', 'meer dan 60', 'ouder'),
    openstaand:        findCol(headers, 'openstaand', 'totaal open', 'saldo'),
    gemiddeldDagen:    findCol(headers, 'gemiddeld', 'avg'),
  }

  const rows: RawDebiteur[] = []
  for (const r of dataRows) {
    const row = r as unknown[]
    const code = col.code >= 0 ? str(row[col.code]) : str(row[0])
    if (!code || /totaal|total/i.test(code)) continue

    const datum = excelDateToJS(col.datum >= 0 ? row[col.datum] : row[2]) ?? new Date()
    const vervaldatum = excelDateToJS(col.vervaldatum >= 0 ? row[col.vervaldatum] : row[3]) ?? new Date()

    rows.push({
      code,
      naam:              col.naam >= 0              ? str(row[col.naam])                         : str(row[1]),
      datum,
      vervaldatum,
      nietAchterstallig: col.nietAchterstallig >= 0  ? parseNum(row[col.nietAchterstallig])       : parseNum(row[4]),
      dagen31_60:        col.dagen31_60 >= 0         ? parseNum(row[col.dagen31_60])              : parseNum(row[5]),
      dagenOver60:       col.dagenOver60 >= 0        ? parseNum(row[col.dagenOver60])             : parseNum(row[6]),
      openstaand:        col.openstaand >= 0         ? parseNum(row[col.openstaand])              : parseNum(row[7]),
      gemiddeldDagen:    col.gemiddeldDagen >= 0     ? parseNum(row[col.gemiddeldDagen])          : parseNum(row[8]),
    })
  }

  return { rows, warnings }
}
