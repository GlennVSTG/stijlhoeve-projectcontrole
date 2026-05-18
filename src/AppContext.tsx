import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react'
import type { AppState, RawOrder, ParseStats } from './types'
import { parseMasterbestand } from './lib/parseMasterbestand'
import { runPipeline, EMPTY_PIPELINE_STATE } from './lib/pipeline'

export type FileType = 'masterbestand'

interface AppContextShape {
  state: AppState
  loadFile: (type: FileType, file: File) => Promise<void>
  recompute: () => void
}

const AppContext = createContext<AppContextShape>({
  state: EMPTY_PIPELINE_STATE,
  loadFile: async () => {},
  recompute: () => {},
})

export function AppProvider({ children }: { children: ReactNode }) {
  const rawOrdersRef = useRef<RawOrder[]>([])
  const statsRef = useRef<ParseStats>({ orderCount: 0, betalingCount: 0, dateRange: { min: null, max: null } })
  const warningsRef = useRef<string[]>([])
  const [state, setState] = useState<AppState>(EMPTY_PIPELINE_STATE)

  const loadFile = useCallback(async (_type: FileType, file: File) => {
    const { orders, stats, warnings } = await parseMasterbestand(file)
    rawOrdersRef.current = orders
    statsRef.current = stats
    warningsRef.current = warnings
    setState(runPipeline(orders, stats, warnings))
  }, [])

  const recompute = useCallback(() => {
    setState(runPipeline(rawOrdersRef.current, statsRef.current, warningsRef.current))
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
