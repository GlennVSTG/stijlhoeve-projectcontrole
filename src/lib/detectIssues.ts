import type { EnrichedOrder, Issue, Severity, ActieLabel } from '../types'
import { daysSince } from './excelDate'

function fmt(n: number): string {
  return Math.abs(n).toLocaleString('nl-NL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function issue(
  enriched: EnrichedOrder,
  severity: Severity,
  actieLabel: ActieLabel,
  omschrijving: string,
): Issue {
  return {
    ordernummer: enriched.order.normOrdnr,
    klantnaam: enriched.order.klantnaam,
    severity,
    actieLabel,
    omschrijving,
  }
}

export function detectIssues(enrichedOrders: EnrichedOrder[]): Issue[] {
  const issues: Issue[] = []

  for (const e of enrichedOrders) {
    // Only commercial orders get issue checks
    if (e.order.categorie !== 'commercieel') continue

    const dagenSindsOrder = daysSince(e.order.orderdatum)
    const volledigGefactureerd = e.totalGefactureerd > 0 &&
      e.totalGefactureerd >= e.origineleProjectwaarde * 0.99

    // === KRITIEK ===

    // Volledig gefactureerd maar >30d niet betaald (only when we have reliable payment data)
    if (
      volledigGefactureerd &&
      e.betaalStatusBron !== 'onbekend' &&
      e.totalBetaald < e.totalGefactureerd * 0.99 &&
      dagenSindsOrder > 30
    ) {
      const openstaand = e.totalGefactureerd - e.totalBetaald
      issues.push(issue(e, 'kritiek', 'Nabellen',
        `Volledig gefactureerd (€${fmt(e.totalGefactureerd)}) maar €${fmt(openstaand)} nog niet ontvangen`
      ))
    }

    // Order >€5.000 zonder factuur ouder dan 30 dagen
    if (
      e.origineleProjectwaarde > 5000 &&
      e.facturen.length === 0 &&
      dagenSindsOrder > 30
    ) {
      issues.push(issue(e, 'kritiek', 'Administratie',
        `Order van €${fmt(e.origineleProjectwaarde)} staat ${dagenSindsOrder} dagen open zonder factuur`
      ))
    }

    // === CONTROLE ===

    // Duplicate factuurbedrag for same order
    const bedragen = e.facturen.map(f => f.bedragInclBtw)
    const dubbels = bedragen.filter((b, i) => b > 0 && bedragen.indexOf(b) !== i)
    if (dubbels.length > 0) {
      issues.push(issue(e, 'controle', 'Controleren',
        `Mogelijk dubbele factuur: €${fmt(dubbels[0])} komt meerdere keren voor`
      ))
    }

    // Workaround detected but not confirmed and no manual override
    if (
      e.workaroundGedetecteerd &&
      !e.workaroundBevestigd &&
      e.projectwaardeSource !== 'manual'
    ) {
      issues.push(issue(e, 'controle', 'Bevestigen',
        `Aanbetaling-workaround gedetecteerd: Exact toont €${fmt(e.exactOrderwaarde)}, berekende projectwaarde €${fmt(e.origineleProjectwaarde)}`
      ))
    }

    // Negative outstanding balance (only when payment source is reliable)
    if (e.betaalStatusBron !== 'onbekend' && e.openstaand < -50) {
      issues.push(issue(e, 'controle', 'Controleren',
        `Negatief openstaand bedrag: €${fmt(e.openstaand)}`
      ))
    }

    // === WAARSCHUWING ===

    // Orderwaarde differs from projectwaarde (workaround present)
    if (
      e.projectwaardeSource === 'berekend' &&
      Math.abs(e.exactOrderwaarde - e.origineleProjectwaarde) > 100
    ) {
      issues.push(issue(e, 'waarschuwing', 'Controleren',
        `Exact orderwaarde (€${fmt(e.exactOrderwaarde)}) wijkt af van berekende projectwaarde (€${fmt(e.origineleProjectwaarde)})`
      ))
    }

    // Debiteuren >60 dagen
    if (e.debiteur && e.debiteur.gemiddeldDagen > 60 && e.debiteur.openstaand > 0) {
      issues.push(issue(e, 'waarschuwing', 'Nabellen',
        `Debiteur >60 dagen achterstallig: €${fmt(e.debiteur.openstaand)} openstaand (gem. ${Math.round(e.debiteur.gemiddeldDagen)} dagen)`
      ))
    }
  }

  return issues
}
