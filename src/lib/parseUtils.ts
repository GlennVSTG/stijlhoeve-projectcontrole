import * as XLSX from 'xlsx'

export function parseNum(val: unknown): number {
  if (val === null || val === undefined || val === '') return 0
  const n = typeof val === 'number'
    ? val
    : parseFloat(String(val).replace(',', '.').replace(/[^\d.-]/g, ''))
  return isNaN(n) ? 0 : n
}

export function findCol(headers: string[], ...candidates: string[]): number {
  for (const c of candidates) {
    const idx = headers.findIndex(h => h.toLowerCase().includes(c.toLowerCase()))
    if (idx !== -1) return idx
  }
  return -1
}

export function readExcelFile(file: File): Promise<unknown[][]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer)
        const wb = XLSX.read(data, { type: 'array', cellDates: true, dateNF: 'yyyy-mm-dd' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as unknown[][]
        resolve(rows)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}

export function findHeaderRow(rawRows: unknown[][], zoekKolom: string): number {
  return rawRows.slice(0, 30).findIndex(row =>
    (row as unknown[]).some(cell => String(cell ?? '').trim() === zoekKolom)
  )
}

export function str(val: unknown, fallback = ''): string {
  return String(val ?? fallback).trim()
}
