export function excelDateToJS(serial: unknown): Date | null {
  if (serial === null || serial === undefined || serial === '') return null
  if (serial instanceof Date) return isNaN(serial.getTime()) ? null : serial
  const num = typeof serial === 'string' ? parseFloat(serial) : (typeof serial === 'number' ? serial : NaN)
  if (isNaN(num) || num <= 0) return null
  return new Date(Math.round((num - 25569) * 86400 * 1000))
}

export function formatDate(date: Date | null): string {
  if (!date) return '—'
  return date.toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function daysSince(date: Date | null): number {
  if (!date) return 0
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24))
}
