import type { EnrichedOrder, ProjectwaardeSource, BetaalStatusBron } from '../types'
import type { JoinedOrder } from './matchData'
import { getAllManualEntries } from './storage'

function sum(nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0)
}

function betaalBronLabel(bron: BetaalStatusBron): BetaalStatusBron {
  return bron
}

export function enrichOrders(joined: JoinedOrder[]): EnrichedOrder[] {
  const manual = getAllManualEntries()

  return joined.map(({ order, facturen, debiteur, bankregels, referentie }) => {
    const manualEntry = manual[order.normOrdnr] ?? {
      projectwaardeHandmatig: null,
      workaroundBevestigd: false,
      onHoldStatus: 'open' as const,
      notitie: '',
    }

    const exactOrderwaarde = order.orderbedragInclBtw
    const aanbetalingFacturen = facturen.filter(f => f.isAanbetaling)
    const aanbetalingGefactureerd = sum(aanbetalingFacturen.map(f => f.bedragInclBtw))
    const totalGefactureerd = sum(facturen.map(f => f.bedragInclBtw))
    const workaroundGedetecteerd = aanbetalingFacturen.length > 0

    // === Projectwaarde: 4-level priority ===
    let origineleProjectwaarde = exactOrderwaarde
    let projectwaardeSource: ProjectwaardeSource = 'exact'

    if (manualEntry.projectwaardeHandmatig !== null && manualEntry.projectwaardeHandmatig > 0) {
      origineleProjectwaarde = manualEntry.projectwaardeHandmatig
      projectwaardeSource = 'manual'
    } else if (referentie?.orderbedrag && referentie.orderbedrag > 0) {
      origineleProjectwaarde = referentie.orderbedrag
      projectwaardeSource = 'referentie'
    } else if (workaroundGedetecteerd && aanbetalingGefactureerd > 0) {
      origineleProjectwaarde = exactOrderwaarde + aanbetalingGefactureerd
      projectwaardeSource = 'berekend'
    }

    // === totalBetaald: 4-level priority ===
    let totalBetaald = 0
    let betaalStatusBron: BetaalStatusBron = 'onbekend'

    // Priority 1: referentie file totaalBetaald
    if (referentie?.totaalBetaald && referentie.totaalBetaald > 0) {
      totalBetaald = referentie.totaalBetaald
      betaalStatusBron = betaalBronLabel('referentie')
    }
    // Priority 2: bank betaalregels (only for single-order customers — guaranteed by joinData)
    else if (bankregels.length > 0) {
      totalBetaald = sum(bankregels.map(b => b.bedragIn))
      betaalStatusBron = betaalBronLabel('bank')
    }
    // Priority 3: debiteuren openstaand (only for single-order customers — guaranteed by joinData)
    else if (debiteur !== null && totalGefactureerd > 0) {
      totalBetaald = Math.max(0, totalGefactureerd - debiteur.openstaand)
      betaalStatusBron = betaalBronLabel('debiteuren')
    }
    // Priority 4: unknown — don't compute a number
    else {
      totalBetaald = 0
      betaalStatusBron = 'onbekend'
    }

    // Aanbetaling betaald: from referentie or bank (same source as totalBetaald, proportional)
    const aanbetalingBetaald = aanbetalingGefactureerd > 0 && totalGefactureerd > 0
      ? Math.min(aanbetalingGefactureerd, totalBetaald * (aanbetalingGefactureerd / totalGefactureerd))
      : 0

    const openstaand = betaalStatusBron === 'onbekend'
      ? 0  // Don't show a wrong number
      : Math.max(0, totalGefactureerd - totalBetaald)

    const nogTeFactureren = Math.max(0, origineleProjectwaarde - totalGefactureerd)

    return {
      order,
      facturen,
      aanbetalingFacturen,
      debiteur,
      bankregels,
      referentie,

      exactOrderwaarde,
      origineleProjectwaarde,
      projectwaardeSource,
      projectwaardeHandmatig: manualEntry.projectwaardeHandmatig,
      aanbetalingGefactureerd,
      aanbetalingBetaald,
      totalGefactureerd,
      totalBetaald,
      betaalStatusBron,
      openstaand,
      nogTeFactureren,

      workaroundGedetecteerd,
      workaroundBevestigd: manualEntry.workaroundBevestigd,

      onHoldStatus: manualEntry.onHoldStatus,
      notitie: manualEntry.notitie,
    }
  })
}
