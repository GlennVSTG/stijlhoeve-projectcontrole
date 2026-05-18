import type { RawOrder, EnrichedOrder, AppState, ParseStats } from '../types'
import { getOnHoldStatus } from './storage'
import { detectIssues } from './detectIssues'

export const EMPTY_PIPELINE_STATE: AppState = {
  enrichedOrders: [],
  issues: [],
  pipelineStatus: {
    lastRun: null,
    filesLoaded: { masterbestand: false },
    stats: { orderCount: 0, betalingCount: 0, dateRange: { min: null, max: null } },
    warnings: [],
  },
}

export function runPipeline(rawOrders: RawOrder[], stats: ParseStats, warnings: string[]): AppState {
  const enrichedOrders: EnrichedOrder[] = rawOrders.map(o => ({
    ...o,
    onHoldStatus: getOnHoldStatus(o.ordernummer),
  }))

  const issues = detectIssues(enrichedOrders)

  return {
    enrichedOrders,
    issues,
    pipelineStatus: {
      lastRun: new Date(),
      filesLoaded: { masterbestand: true },
      stats,
      warnings,
    },
  }
}
