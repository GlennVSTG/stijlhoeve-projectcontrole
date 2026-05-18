# Stijlhoeve Projectcontrole — Rebuild Design Spec
**Date:** 2026-05-18  
**Status:** Approved  
**Scope:** Full rebuild of `src/` within existing `stijlhoeve-projectcontrole` project

---

## 1. What We're Building

An internal webapp for Stijlhoeve Comfort Centre B.V. (solar panels, heat pumps, home batteries, EV chargers). The app loads raw Excel exports from Exact Online, normalizes them, and turns them into reliable financial insight per project.

**Users:** Glenn Versteeg (admin), Sander Peulken (commercial), Joram (sales)  
**Hosting:** Netlify or Render  
**Stack:** React + Vite + TypeScript + Tailwind CSS, `xlsx` library for Excel parsing, localStorage for manual state, client-side only — no backend, no database, no login

---

## 2. Known Business Problems (All Must Be Solved)

### Problem 1 — Aanbetaling workaround distorts order value (CRITICAL)
Exact Online has no clean deposit invoice feature. Stijlhoeve's workaround:
- Step 1: Create a deposit invoice (e.g. €4.500)
- Step 2: Add a negative correction line of -€4.500 to the order itself

Result: Exact shows `Orderbedrag = €10.500` for a project worth €15.000.  
The app must detect this, reconstruct the real value, and display both clearly.

### Problem 2 — Leverstatus is unreliable
The werkvoorbereider chronically lags behind updating delivery status in Exact. `Leverstatus = 'Open'` does NOT mean the project is incomplete. **Leverstatus must never be used as a trigger for any action or issue detection.**

### Problem 3 — Service/garantie orders contaminate commercial KPIs
Orders with `orderbedrag < €600` or `orderbedrag = €0` are always service/repair/warranty — never new installations. They must be completely excluded from all commercial KPIs and commercial views. They appear only in their own dedicated tab.

### Problem 4 — Inconsistent export formatting
Exact exports have variable numbers of metadata rows at the top. The real column header can appear at row 1 or row 13 or 14. Solution: scan the first 30 rows dynamically for the target column name.

```ts
const headerRowIndex = rawRows.slice(0, 30).findIndex(row =>
  row.some(cell => String(cell ?? '').trim() === ZOEKKOLOM)
)
```

### Problem 5 — Order number format differs per export
- Orders export: `"2242324"` (plain number string)
- Facturen export: sometimes `"SO-2024-0842"` (prefixed), sometimes `"2242386"`

Normalization: `raw.match(/(\d{6,})$/)?.[1] ?? raw`

### Problem 6 — Debiteuren customer number format differs
- Debiteuren export: `"K1002"`
- Orders export: `"52686"`

Cannot join on customer number. Join on fuzzy customer name match: first word of `klantnaam`, lowercased. **Only attribute debiteuren data to an order if that customer has exactly one open order** — otherwise fall through to 'onbekend' to avoid cross-order contamination.

### Problem 7 — Amounts sometimes arrive as strings
`"369,05"` instead of `369.05`

Fix: `parseFloat(String(v).replace(',', '.').replace(/[^\d.-]/g, ''))`

---

## 3. Data Sources

### Export 1 — Verkooporders
- Zoekkolom: `'Ordernummer'`
- Key columns: Ordernummer, Omschrijving, Besteld door (klantnr), Klantnaam, Orderstatus, Orderbedrag+Btw, Orderdatum, Leverstatus, Factuurstatus, Afleverdatum
- Categorization: `orderbedrag >= 600` → commercieel; `< 600` or `= 0` → service

### Export 2 — Verkoopfacturen
- Zoekkolom: `'Factuurnummer'`
- Key columns: Ordernummer, Omschrijving, Factuurnummer, Type, Klantnr, Klantnaam, Bedrag excl BTW, Bedrag+Btw, Orderdatum
- Aanbetalingsfactuur detection: omschrijving (lowercased) contains any of: `['aanbetaling', 'deelfactuur', '30%', '40%', '50%']`

### Export 3 — Debiteuren
- Zoekkolom: `'Openstaand'`
- Key columns: Code, Naam, Datum, Vervaldatum, Openstaand, Gemiddeld (dagen)
- KPI filter: only rows with `gemiddeldDagen <= 60` feed into main KPIs; rows `> 60` appear only in Datakwaliteit

### Export 4 — Bank/Kas (optional)
- Zoekkolom: `'Bankrekening'`
- Key columns: Datum, Bankrekening, Bedrag in, Bedrag uit, Omschrijving, Grootboekrekening, Relatie
- Klantbetalingen: rows where `Grootboekrekening = "1300 - Debiteuren"`

### Export 5 — Betalingsstatus referentie (optional)
- File: `Betalingsstatus_Orders_2026_v3.xlsx` (user's manual tracking workbook)
- Key columns: Type (ORDER/BETALING), Ordernummer, Orderbedrag, Betaaldatum, Betaalbedrag, Betalingsstatus
- Rule: supplementary reference only — **never overwrites Exact data**. Highest-priority source for `origineleProjectwaarde` and `totalBetaald`.

### Date handling
All Exact dates are Excel serial numbers. Conversion:
```ts
new Date((serial - 25569) * 86400 * 1000)
```
If value is not a number (already a string date), fall back to `new Date(v)`.

---

## 4. Architecture

### Approach: Layered Transform Pipeline

```
Excel files (raw)
      │
  ┌───▼──────────────────────────────────┐
  │ PARSE                                 │
  │ Dynamic header detection              │
  │ Excel serial → Date                   │
  │ String amounts → numbers              │
  │ Output: RawOrder[], RawFactuur[], ... │
  │ Never throws — collects warnings      │
  └───┬──────────────────────────────────┘
      │
  ┌───▼──────────────────────────────────┐
  │ NORMALIZE                             │
  │ Ordernumber normalization             │
  │ Service/garantie categorization       │
  │ Aanbetalingsfactuur detection         │
  │ Fuzzy key prep (first word of name)   │
  │ Output: Order[], Factuur[], ...       │
  └───┬──────────────────────────────────┘
      │
  ┌───▼──────────────────────────────────┐
  │ ENRICH                                │
  │ Join orders ↔ facturen (normOrdnr)    │
  │ Join orders ↔ debiteuren (fuzzyKey,   │
  │   only if customer has 1 open order)  │
  │ Join orders ↔ bank (relatie + 1-order │
  │   constraint)                         │
  │ Projectwaarde reconstruction          │
  │ totalBetaald with source priority     │
  │ Merge localStorage overrides          │
  │ Output: EnrichedOrder[]               │
  └───┬──────────────────────────────────┘
      │
  ┌───▼──────────────────────────────────┐
  │ DETECT                                │
  │ Issue checks on EnrichedOrder[]       │
  │ Leverstatus never read                │
  │ Output: Issue[]                       │
  └───┬──────────────────────────────────┘
      │
  React Context (AppState)
      │
  UI Screens (read-only views)
```

The pipeline runs once after any file upload. localStorage writes (notes, on-hold, confirmed projectwaarden, manual overrides) trigger a re-enrich of the affected order only.

---

## 5. TypeScript Types

```ts
// === RAW (Parse output) ===
interface RawOrder {
  ordernummer: string; klantnummer: string; klantnaam: string
  orderbedrag: number; orderstatus: string; factuurstatus: string
  orderdatum: Date; leverstatus: string; afleverdatum: Date | null
  omschrijving: string
}
interface RawFactuur {
  ordernummer: string; factuurnummer: string; omschrijving: string
  bedragExclBtw: number; bedragInclBtw: number
  orderdatum: Date; klantnummer: string; klantnaam: string
}
interface RawDebiteur {
  code: string; naam: string; datum: Date; vervaldatum: Date
  nietAchterstallig: number; dagen31_60: number; dagenOver60: number
  openstaand: number; gemiddeldDagen: number
}
interface RawBankregel {
  datum: Date; bankrekening: string; bedragIn: number; bedragUit: number
  omschrijving: string; grootboek: string; relatie: string
}
interface RawReferentieRegel {
  type: 'ORDER' | 'BETALING'; ordernummer: string; klant: string
  orderbedrag: number; betaaldatum: Date | null
  betaalbedrag: number; betalingsstatus: string; opmerking: string
}

// === NORMALIZED ===
interface Order extends RawOrder {
  normOrdnr: string
  categorie: 'commercieel' | 'service'
}
interface Factuur extends RawFactuur {
  normOrdnr: string
  isAanbetaling: boolean
}
interface Debiteur extends RawDebiteur {
  fuzzyKey: string
}

// === ENRICHED ===
type ProjectwaardeSource = 'manual' | 'referentie' | 'berekend' | 'exact'
type BetaalStatusBron = 'referentie' | 'bank' | 'debiteuren' | 'onbekend'
type OnHoldStatus =
  | 'open'
  | 'on-hold-netbeheerder'
  | 'on-hold-klant'
  | 'on-hold-planning'
  | 'klaar-om-te-factureren'

interface EnrichedOrder {
  order: Order
  facturen: Factuur[]
  aanbetalingFacturen: Factuur[]
  debiteur: Debiteur | null
  bankregels: RawBankregel[]
  referentie: RawReferentieRegel | null

  // Financials
  exactOrderwaarde: number
  origineleProjectwaarde: number
  projectwaardeSource: ProjectwaardeSource
  projectwaardeHandmatig: number | null       // localStorage, highest priority
  aanbetalingGefactureerd: number
  aanbetalingBetaald: number
  totalGefactureerd: number
  totalBetaald: number
  betaalStatusBron: BetaalStatusBron
  openstaand: number
  nogTeFactureren: number

  // Workaround
  workaroundGedetecteerd: boolean
  workaroundBevestigd: boolean                // localStorage

  // Manual (localStorage)
  onHoldStatus: OnHoldStatus
  notitie: string
}

// === ISSUES ===
type Severity = 'kritiek' | 'controle' | 'waarschuwing' | 'info'
type ActieLabel = 'Nabellen' | 'Controleren' | 'Bevestigen' | 'Administratie'

interface Issue {
  ordernummer: string
  severity: Severity
  actieLabel: ActieLabel
  omschrijving: string
}

// === APPSTATE ===
interface AppState {
  enrichedOrders: EnrichedOrder[]
  issues: Issue[]
  pipelineStatus: {
    lastRun: Date | null
    filesLoaded: {
      orders: boolean
      facturen: boolean
      debiteuren: boolean
      bank: boolean
      referentie: boolean
    }
    warnings: string[]
  }
}
```

---

## 6. Pipeline Layer Details

### Parse layer (`lib/parse*.ts`)
All five parsers share the same structure:
1. Scan first 30 rows for zoekkolom to find header row index
2. Map data rows to typed raw objects
3. Parse amounts: `parseFloat(String(v).replace(',', '.').replace(/[^\d.-]/g, ''))`
4. Parse dates: check if numeric (serial) → convert; else `new Date(v)`
5. Return `{ rows: RawX[], warnings: string[] }` — never throw

### Normalize layer (`lib/normalize.ts`)
- `normalizeOrdnr(raw)`: `raw.match(/(\d{6,})$/)?.[1] ?? raw`
- `categorize(orderbedrag)`: `orderbedrag <= 0 || orderbedrag < 600 ? 'service' : 'commercieel'`
- `isAanbetalingFactuur(omschrijving)`: checks for `['aanbetaling', 'deelfactuur', '30%', '40%', '50%']`
- `fuzzyKey(naam)`: `naam.trim().split(/\s+/)[0].toLowerCase()`

### Enrich layer (`lib/enrichOrder.ts`)

**Joining:**
- Orders ↔ facturen: exact `normOrdnr` match
- Orders ↔ debiteuren: `fuzzyKey` match, but only if that customer has exactly 1 order; otherwise `debiteur = null`
- Orders ↔ bank: `relatie` fuzzy match + `grootboek = '1300 - Debiteuren'`, same single-order constraint
- Orders ↔ referentie: `normOrdnr` match

**Projectwaarde priority (highest to lowest):**
1. `localStorage` manual input → `source: 'manual'`
2. `referentie.orderbedrag` where `type = 'ORDER'` and `normOrdnr` matches → `source: 'referentie'`
3. `exactOrderwaarde + sum(aanbetalingFacturen.bedragInclBtw)` → `source: 'berekend'`
4. `exactOrderwaarde` alone → `source: 'exact'`

**totalBetaald priority:**
1. `referentie`: sum of betaalregels where `type = 'BETALING'` and `normOrdnr` matches → `bron: 'referentie'`
2. `bank`: sum of `bedragIn` where single-order constraint holds → `bron: 'bank'`
3. `debiteuren`: `totalGefactureerd - debiteur.openstaand` where single-order constraint holds → `bron: 'debiteuren'`
4. Fallback: `totalBetaald = 0`, `bron: 'onbekend'`

**localStorage merging:**
- `projectwaardeHandmatig`: stored as `pw_${normOrdnr}`
- `workaroundBevestigd`: stored as `wb_${normOrdnr}`
- `onHoldStatus`: stored as `oh_${normOrdnr}`
- `notitie`: stored as `nt_${normOrdnr}`

### Detect layer (`lib/detectIssues.ts`)
Leverstatus is never read. Issue checks:

| Severity | Condition | ActieLabel |
|---|---|---|
| Kritiek | Volledig gefactureerd AND `betaalStatusBron ≠ 'onbekend'` AND `totalBetaald < totalGefactureerd` AND dagen since laatste factuur > 30 | Nabellen |
| Kritiek | `origineleProjectwaarde > 5000` AND `facturen.length = 0` AND dagen since `orderdatum > 30` | Administratie |
| Controle | Duplicate factuur: same `bedragInclBtw` for same `klantnaam` within 30 days | Controleren |
| Controle | `workaroundGedetecteerd = true` AND `workaroundBevestigd = false` AND `projectwaardeSource ≠ 'manual'` | Bevestigen |
| Controle | `openstaand < 0` AND `betaalStatusBron ≠ 'onbekend'` | Controleren |
| Waarschuwing | `projectwaardeSource = 'berekend'` AND `exactOrderwaarde ≠ origineleProjectwaarde` | Controleren |
| Waarschuwing | `debiteur.gemiddeldDagen > 60` | Nabellen |

---

## 7. Screens

### Navigation
Topbar with 5 tabs: Dashboard · Actielijst · Orders · Importeer · Datakwaliteit  
Right side: `pipelineStatus.lastRun` timestamp.  
Active tab: green accent underline.

### Screen 1 — Dashboard
**KPI Row 1** (commercial only):
- Totale projectwaarde: `sum(origineleProjectwaarde)` where `categorie = 'commercieel'`
- Gefactureerd: `sum(totalGefactureerd)` commercial
- Openstaand ≤60d: `sum(openstaand)` where `betaalStatusBron ≠ 'onbekend'` AND `debiteur.gemiddeldDagen ≤ 60`
- Nog te factureren: `sum(nogTeFactureren)` commercial

**KPI Row 2:**
- Aanbetalingen herkend: `count(workaroundGedetecteerd = true)` where `categorie = 'commercieel'`
- Kritieke issues: `count(issues where severity = 'kritiek')`
- Service/garantie: `count(categorie = 'service')`
- Volledig afgerond: `count(orderstatus = 'Volledig' AND openstaand ≤ 0)`

**Body 60/40:**
- Left: open commercial orders table (klant, ordernr, projectwaarde, gefactureerd, openstaand, status). Clickable → ProjectKaart modal.
- Right: top 5 actiepunten (kritiek first) + betaalstatus donut (betaald / deels betaald / openstaand / onbekend).

### Screen 2 — Actielijst
All issues sorted Kritiek → Controle → Waarschuwing → Info. Severity filter chips at top. Each item: severity badge, actielabel chip, klantnaam, ordernummer, omschrijving. Click → ProjectKaart.

### Screen 3 — Orders
Search bar (klantnaam or ordernummer). Filter tabs: **Alle · Open · Deels betaald · Afgerond · Service/Garantie**.  
- First four tabs: commercial orders only.  
- Service/Garantie tab: service orders only, with own columns (no projectwaarde).  
Each row clickable → ProjectKaart.

### Screen 4 — ProjectKaart (modal, slides in from right)
- Header: ordernummer (DM Mono), klantnaam (Syne), omschrijving, statusbadge, `projectwaardeSource` badge
  - Green: "Bevestigd via referentie"
  - Amber: "Berekend — controleer"
  - Grey: "Exact orderwaarde"
  - Blue: "Handmatig ingevoerd"
- 3 hero numbers: Projectwaarde | Betaald | Openstaand (DM Mono, colored)
- Progress bar: `totalBetaald / origineleProjectwaarde`, 3px, green
- Financial table:

| Label | Bedrag | Badge |
|---|---|---|
| Originele projectwaarde | €X | source badge |
| Exact orderwaarde | €X | |
| Aanbetaling gefactureerd | €X | |
| Aanbetaling betaald | €X | source badge: green "Via referentie" / green "Via bank" / blue "Via debiteuren" / amber "Onbekend — controleer" |
| Totaal gefactureerd | €X | |
| Totaal betaald | €X | same source badge as above |
| Nog te factureren | €X | |
| Nog te ontvangen | €X | |

- **Projectwaarde aanpassen**: input always visible below financial table, placeholder "Voer projectwaarde in...", saves to localStorage on blur or Enter, source badge flips to "Handmatig ingevoerd"
- Workaround blok (amber, only if `workaroundGedetecteerd && !workaroundBevestigd && projectwaardeSource ≠ 'manual'`): explanation + Bevestig button → sets `workaroundBevestigd = true` in localStorage
- On-hold selector: 5 pill buttons (Open / On hold netbeheerder / On hold klant / On hold planning intern / Klaar om te factureren)
- Notitieveld: free text textarea, auto-saves on blur
- Issues list: all issues for this order, sorted by severity

### Screen 5 — Importeer
Five upload zones (drag + click): Orders · Facturen · Debiteuren · Bank (optioneel) · Referentie (optioneel).  
Each zone after upload: filename, timestamp, row count, parse warnings from `pipelineStatus.warnings`.  
"Laad data" button triggers full pipeline run.  
Export instructions accordion (collapsed by default).

### Screen 6 — Datakwaliteit
Four collapsible severity sections (Kritiek / Controle / Waarschuwing / Info). Count badge per header. Full issue context per row. Empty state per section: "Geen [kritieke] issues gevonden."

---

## 8. Design System

**Colors (CSS variables in `src/index.css`):**
- `--bg`: `#0F2137` — page background
- `--topbar`: `#0A1A2E`
- `--card`: `rgba(255,255,255,0.05)` — glass cards
- `--text`: `rgba(255,255,255,0.90)`
- `--text-muted`: `rgba(255,255,255,0.45)`
- `--green`: `#3DAF85` / `--green-bright`: `#4DCFA0`
- `--amber`: `#C8A84B` / `--amber-bright`: `#FFCF5C`
- `--red`: `#C84B4B` / `--red-bright`: `#FF8080`
- `--blue`: `#4B8EC8` / `--blue-bright`: `#80BFFF`

**Typography:**
- Display/headers: Syne (Google Fonts)
- Numbers/codes: DM Mono (Google Fonts)
- Labels: uppercase, 10–11px, `letter-spacing: 0.08em`

**Details:**
- All clickable elements: hover state
- Transitions: `all 0.15s ease`
- Badges: pill shape, `border-radius: 20px`, semi-transparent
- Progress bars: 3px height
- Card shadow: `0 4px 24px rgba(0,0,0,0.20)`
- Card backdrop: `blur(16px)`

---

## 9. File Structure

```
src/
  components/
    Topbar.tsx
    Dashboard.tsx
    KPICard.tsx
    Actielijst.tsx
    Orders.tsx
    ProjectKaart.tsx      ← modal
    Importeer.tsx
    Datakwaliteit.tsx
    StatusBadge.tsx
  lib/
    parseOrders.ts
    parseFacturen.ts
    parseDebiteuren.ts
    parseBank.ts
    parseBetalingsstatus.ts
    normalize.ts           ← new, extracted
    matchData.ts           ← join only
    enrichOrder.ts         ← new, financial logic
    detectIssues.ts
    excelDate.ts
    storage.ts
  types/
    index.ts
  App.tsx
  main.tsx
  index.css
```

---

## 10. Out of Scope

- No backend, no API, no authentication
- No Exact Online live API connection (future phase)
- No multi-user sync
- No mobile layout optimization (desktop internal tool)
