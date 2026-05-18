import type { EnrichedOrder, Issue, Severity, ActieLabel } from '../types'
import { daysSince } from './excelDate'

function fmt(n: number): string {
  return Math.round(n).toLocaleString('nl-NL')
}

function issue(e: EnrichedOrder, severity: Severity, actieLabel: ActieLabel, omschrijving: string): Issue {
  return { ordernummer: e.ordernummer, klantnaam: e.klantnaam, severity, actieLabel, omschrijving }
}

export function detectIssues(orders: EnrichedOrder[]): Issue[] {
  const issues: Issue[] = []

  for (const e of orders) {
    if (e.categorie === 'geannuleerd') {
      issues.push(issue(e, 'info', 'Administratie', `Order geannuleerd`))
      continue
    }

    if (e.categorie !== 'commercieel') continue

    const dagenSindsOrder = daysSince(e.orderdatum)
    const betaalStatus = e.betalingsstatus.toLowerCase()
    const notitie = e.notitie

    // === KRITIEK ===
    if (betaalStatus.includes('niet betaald') && dagenSindsOrder > 30 && e.orderbedrag > 5000) {
      issues.push(issue(e, 'kritiek', 'Nabellen',
        `Niet betaald: €${fmt(e.openstaand)} openstaand, ${dagenSindsOrder} dagen oud`
      ))
    }

    // === CONTROLE ===

    // Volledig gefactureerd maar deels betaald
    if (betaalStatus.includes('deels betaald') && e.factuurstatus.toLowerCase() === 'volledig') {
      issues.push(issue(e, 'controle', 'Nabellen',
        `Volledig gefactureerd maar deels betaald: €${fmt(e.openstaand)} openstaand`
      ))
    }

    // Vraagteken in opmerking
    if (notitie && notitie.includes('?')) {
      issues.push(issue(e, 'controle', 'Controleren',
        `Opmerking bevat vraagteken: "${notitie}"`
      ))
    }

    // Actie-keywords in opmerking
    const noticieLower = notitie.toLowerCase()
    if (notitie && (noticieLower.includes('status') || noticieLower.includes('wanneer') || noticieLower.includes('factureren'))) {
      issues.push(issue(e, 'controle', 'Administratie',
        `Opmerking vereist actie: "${notitie}"`
      ))
    }
  }

  return issues
}
