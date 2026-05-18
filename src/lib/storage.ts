import type { OnHoldStatus } from '../types'

const STORAGE_KEY = 'stijlhoeve_manual_v2'

interface ManualEntry {
  projectwaardeHandmatig: number | null
  workaroundBevestigd: boolean
  onHoldStatus: OnHoldStatus
  notitie: string
}

function loadAll(): Record<string, ManualEntry> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveAll(data: Record<string, ManualEntry>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function defaultEntry(): ManualEntry {
  return { projectwaardeHandmatig: null, workaroundBevestigd: false, onHoldStatus: 'open', notitie: '' }
}

export function getManualEntry(normOrdnr: string): ManualEntry {
  return loadAll()[normOrdnr] ?? defaultEntry()
}

export function getAllManualEntries(): Record<string, ManualEntry> {
  return loadAll()
}

export function setProjectwaardeHandmatig(normOrdnr: string, waarde: number | null): void {
  const all = loadAll()
  all[normOrdnr] = { ...defaultEntry(), ...all[normOrdnr], projectwaardeHandmatig: waarde }
  saveAll(all)
}

export function setWorkaroundBevestigd(normOrdnr: string, bevestigd: boolean): void {
  const all = loadAll()
  all[normOrdnr] = { ...defaultEntry(), ...all[normOrdnr], workaroundBevestigd: bevestigd }
  saveAll(all)
}

export function setOnHoldStatus(normOrdnr: string, status: OnHoldStatus): void {
  const all = loadAll()
  all[normOrdnr] = { ...defaultEntry(), ...all[normOrdnr], onHoldStatus: status }
  saveAll(all)
}

export function setNotitie(normOrdnr: string, notitie: string): void {
  const all = loadAll()
  all[normOrdnr] = { ...defaultEntry(), ...all[normOrdnr], notitie }
  saveAll(all)
}
