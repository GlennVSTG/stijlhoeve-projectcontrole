import type { Order } from '../types'

export function isServiceGarantie(order: Order): boolean {
  return order.orderbedragInclBtw < 600 || order.orderbedragInclBtw === 0
}

export function isAanbetalingFactuur(omschrijving: string): boolean {
  const lower = omschrijving.toLowerCase()
  return (
    lower.includes('aanbetaling') ||
    lower.includes('deelfactuur') ||
    lower.includes('30%') ||
    lower.includes('40%') ||
    lower.includes('50%')
  )
}
