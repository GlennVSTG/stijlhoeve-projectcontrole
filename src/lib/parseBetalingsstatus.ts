import type { RawReferentieRegel } from '../types'
import { excelDateToJS } from './excelDate'
import { parseNum, findCol, readExcelFile, findHeaderRow, str } from './parseUtils'

export async function parseBetalingsstatus(file: File): Promise<{ rows: RawReferentieRegel[]; warnings: string[] }> {
  const warnings: string[] = []
  let rawRows: unknown[][]

  try {
    rawRows = await readExcelFile(file)
  } catch {
    return { rows: [], warnings: [`${file.name}: kon bestand niet lezen`] }
  }

  // The referentie file uses 'Type' as header sentinel
  const headerRowIndex = findHeaderRow(rawRows, 'Type')
  if (headerRowIndex === -1) {
    return { rows: [], warnings: [`${file.name}: kolom 'Type' niet gevonden in eerste 30 rijen`] }
  }

  const headers = (rawRows[headerRowIndex] as unknown[]).map(h => str(h))
  const dataRows = rawRows.slice(headerRowIndex + 1).filter(row =>
    (row as unknown[]).some(cell => cell !== '' && cell !== null && cell !== undefined)
  )

  const col = {
    type:            findCol(headers, 'type'),
    ordernummer:     findCol(headers, 'ordernummer'),
    klant:           findCol(headers, 'klant', 'klantnaam', 'naam'),
    omschrijving:    findCol(headers, 'omschrijving'),
    orderstatus:     findCol(headers, 'orderstatus'),
    factuurstatus:   findCol(headers, 'factuurstatus'),
    orderdatum:      findCol(headers, 'orderdatum'),
    orderbedrag:     findCol(headers, 'orderbedrag'),
    betaaldatum:     findCol(headers, 'betaaldatum'),
    betaalbedrag:    findCol(headers, 'betaalbedrag'),
    totaalBetaald:   findCol(headers, 'totaal betaald', 'totaalbetaald'),
    openstaand:      findCol(headers, 'openstaand'),
    betalingsstatus: findCol(headers, 'betalingsstatus'),
    opmerking:       findCol(headers, 'opmerking'),
  }

  const rows: RawReferentieRegel[] = []
  for (const r of dataRows) {
    const row = r as unknown[]
    const ordernummer = col.ordernummer >= 0 ? str(row[col.ordernummer]) : str(row[1])
    if (!ordernummer) continue

    const typeRaw = col.type >= 0 ? str(row[col.type]).toUpperCase() : str(row[0]).toUpperCase()
    if (typeRaw !== 'ORDER' && typeRaw !== 'BETALING') continue

    rows.push({
      type:            typeRaw as 'ORDER' | 'BETALING',
      ordernummer,
      klant:           col.klant >= 0           ? str(row[col.klant])                      : str(row[2]),
      omschrijving:    col.omschrijving >= 0    ? str(row[col.omschrijving])               : str(row[3]),
      orderstatus:     col.orderstatus >= 0     ? str(row[col.orderstatus])                : str(row[4]),
      factuurstatus:   col.factuurstatus >= 0   ? str(row[col.factuurstatus])              : str(row[5]),
      orderdatum:      excelDateToJS(col.orderdatum >= 0 ? row[col.orderdatum] : row[6]),
      orderbedrag:     col.orderbedrag >= 0     ? parseNum(row[col.orderbedrag])           : parseNum(row[7]),
      betaaldatum:     excelDateToJS(col.betaaldatum >= 0 ? row[col.betaaldatum] : row[8]),
      betaalbedrag:    col.betaalbedrag >= 0    ? parseNum(row[col.betaalbedrag])          : parseNum(row[9]),
      totaalBetaald:   col.totaalBetaald >= 0   ? parseNum(row[col.totaalBetaald])         : parseNum(row[10]),
      openstaand:      col.openstaand >= 0      ? parseNum(row[col.openstaand])            : parseNum(row[11]),
      betalingsstatus: col.betalingsstatus >= 0 ? str(row[col.betalingsstatus])            : str(row[12]),
      opmerking:       col.opmerking >= 0       ? str(row[col.opmerking])                  : str(row[13]),
    })
  }

  return { rows, warnings }
}
