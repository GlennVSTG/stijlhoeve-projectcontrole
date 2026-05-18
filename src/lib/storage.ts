import type { OnHoldStatus } from '../types'

const STORAGE_KEY = 'stijlhoeve_v3'

interface StoredData {
  onHoldStatus: Record<string, OnHoldStatus>
}

function load(): StoredData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as StoredData) : { onHoldStatus: {} }
  } catch {
    return { onHoldStatus: {} }
  }
}

function save(data: StoredData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function getOnHoldStatus(ordernummer: string): OnHoldStatus {
  return load().onHoldStatus[ordernummer] ?? 'open'
}

export function setOnHoldStatus(ordernummer: string, status: OnHoldStatus): void {
  const data = load()
  data.onHoldStatus[ordernummer] = status
  save(data)
}
