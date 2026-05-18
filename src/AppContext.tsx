import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react'
import type { AppState } from './types'
import { parseOrders } from './lib/parseOrders'
import { parseFacturen } from './lib/parseFacturen'
import { parseDebiteuren } from './lib/parseDebiteuren'
import { parseBank } from './lib/parseBank'
import { parseBetalingsstatus } from './lib/parseBetalingsstatus'
import { runPipeline, EMPTY_RAW_DATA, type RawData } from './lib/pipeline'

export type FileType = 'orders' | 'facturen' | 'debiteuren' | 'bank' | 'referentie'

interface AppContextShape {
  state: AppState
  loadFile: (type: FileType, file: File) => Promise<void>
  recompute: () => void
}

const EMPTY_STATE: AppState = {
  enrichedOrders: [],
  issues: [],
  pipelineStatus: {
    lastRun: null,
    filesLoaded: { orders: false, facturen: false, debiteuren: false, bank: false, referentie: false },
    warnings: [],
  },
}

const AppContext = createContext<AppContextShape>({
  state: EMPTY_STATE,
  loadFile: async () => {},
  recompute: () => {},
})

function applyFileResult(prev: RawData, type: FileType, rows: unknown[], fileWarnings: string[], fileName: string): RawData {
  const warnings = [
    ...prev.warnings.filter(w => !w.startsWith(fileName)),
    ...fileWarnings,
  ]
  const filesLoaded = { ...prev.filesLoaded, [type]: true }
  const lastRun = new Date()

  switch (type) {
    case 'orders':     return { ...prev, orders:     rows as RawData['orders'],     warnings, filesLoaded, lastRun }
    case 'facturen':   return { ...prev, facturen:   rows as RawData['facturen'],   warnings, filesLoaded, lastRun }
    case 'debiteuren': return { ...prev, debiteuren: rows as RawData['debiteuren'], warnings, filesLoaded, lastRun }
    case 'bank':       return { ...prev, bankregels: rows as RawData['bankregels'], warnings, filesLoaded, lastRun }
    case 'referentie': return { ...prev, referentie: rows as RawData['referentie'], warnings, filesLoaded, lastRun }
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const rawRef = useRef<RawData>(EMPTY_RAW_DATA)
  const [state, setState] = useState<AppState>(EMPTY_STATE)

  const loadFile = useCallback(async (type: FileType, file: File) => {
    let rows: unknown[]
    let fileWarnings: string[]

    switch (type) {
      case 'orders': {
        const r = await parseOrders(file)
        rows = r.rows; fileWarnings = r.warnings
        break
      }
      case 'facturen': {
        const r = await parseFacturen(file)
        rows = r.rows; fileWarnings = r.warnings
        break
      }
      case 'debiteuren': {
        const r = await parseDebiteuren(file)
        rows = r.rows; fileWarnings = r.warnings
        break
      }
      case 'bank': {
        const r = await parseBank(file)
        rows = r.rows; fileWarnings = r.warnings
        break
      }
      case 'referentie': {
        const r = await parseBetalingsstatus(file)
        rows = r.rows; fileWarnings = r.warnings
        break
      }
    }

    const next = applyFileResult(rawRef.current, type, rows!, fileWarnings!, file.name)
    rawRef.current = next
    setState(runPipeline(next))
  }, [])

  const recompute = useCallback(() => {
    const updated: RawData = { ...rawRef.current, lastRun: new Date() }
    rawRef.current = updated
    setState(runPipeline(updated))
  }, [])

  return (
    <AppContext.Provider value={{ state, loadFile, recompute }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp(): AppContextShape {
  return useContext(AppContext)
}
