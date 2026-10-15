# Calibre & Co. — Status

_Last updated: 15 October 2026_

Calibre is an internal workshop and resale operating system. The canonical model is **Item + Work + Media + Inventory + Knowledge + Ledger**. The browser app is in active internal alpha.

## Current state

The major pre-existing foundations are still in place: Item identity, Work records, Workbench queue/bench flow, parts/donor intelligence, Final QC, Movement Finder, Knowledge, Capture Station, QR, finance/profit, listings/sales, Acquisition Engine v1, global search, mobile/DeX tuning and device-aware layouts.

The Foundation Lock remains intact: there is **no normal-runtime `state.jobs` architecture**, and deployment remains **test-gated deployment** rather than an unchecked direct publish path.

A live backend reconciliation is now underway because the deployed browser app and the newer normalized `Calibre v2` schema had diverged across two Supabase projects.

### Backend consolidation completed so far

The existing browser/backend project remains the long-term Calibre backend. The following normalized structures have now been added there without replacing `calibre_state`, browser Auth/session, Knowledge, research/media or the public catalogue:

- workspace + membership
- storage locations + sources
- Items + identity + Passports + facts/evidence
- Work + events + templates + checklist + QC
- measurements + timing runs + bench sessions
- Parts + Tools + Consumables + Work Part Needs
- acquisition invoices + invoice lines
- purchases + lots + Item/cost links
- storage movement history
- costs + valuations + Sales + business ledger schema
- safe Archive / Restore RPCs for Items, Parts, Tools and Consumables
- structured media ownership for Item + optional Work + optional checklist step

Current structured data has been reconciled from the separate v2 project. Counts and financial aggregates match for the migrated slices.

Commercial reconciliation currently includes:

- 9 acquisition invoices
- 29 invoice lines
- 5 purchases
- 21 purchase lots
- 14 purchase-to-Item links
- 32 component cost links
- 33 cost entries
- 4 storage movement events
- 3 valuations
- AUD $1,471.59 total purchases
- AUD $984.05 total Item cost entries

The separate v2 project remains intact until invoice file storage and any remaining source-only archival evidence are explicitly handled.

## Browser bridge now underway

A structured browser adapter now exists in `js/structured-cloud.js`.

The bridge is intentionally additive: structured records overlay the existing state where their IDs are known, while unmatched legacy records remain visible. Structured rows are not written back into the legacy `calibre_state` blob.

### Workbench

`workbench.html` can now overlay structured Item / Work data and write structured Workbench actions directly to the consolidated tables while preserving the legacy path for older records.

Structured Work cards are visibly identified and open the new Bench Mode instead of legacy `work.html`.

### Bench Mode

`bench.html` is now the first structured-native workshop screen.

Live features:

- Start / Finish Bench Session
- live elapsed bench timer
- current / next checklist task
- mark checklist steps Done
- Work notes
- Work problem/blocker capture
- measurements
- open Part Needs
- recent measurements
- recent structured timing-run display
- **Photo** quick action through structured Bench Capture
- **Part** quick action through the structured Parts / Donor Finder

Bench Capture reuses the existing private media bucket, thumbnail generation and retry queue, then records structured ownership against Item + Work + current checklist step.

The Parts / Donor Finder can create Part Needs, mark Work waiting on parts, update need status, rank loose stock, and show donor candidates using recorded calibre/family/maker evidence. Maker-only matches remain low-confidence leads rather than claimed interchangeability.

The **Timegrapher** quick action is the remaining major Bench action still awaiting structured Work integration.

## Important safety boundaries

The following remain authoritative and untouched by the structured bridge unless explicitly migrated later:

- current Auth/session
- `calibre_state` sync/conflict path
- current Knowledge / Movement Finder (`calibre_kb_*`)
- existing private media storage bucket and upload queue
- research infrastructure
- public catalogue/public-watch infrastructure

No URL flip to the separate v2 Supabase project is planned.

## Immediate next implementation order

1. Comprehensive structured Timegrapher integration
2. Archive / Restore UI
3. Bench exception engine
4. Invoice Storage migration / v2 retirement gate
5. real-device Samsung phone + DeX acceptance
6. monthly Business Reports and deeper finance after workshop bridge stabilizes

See `docs/BACKEND_RECONCILIATION_PROGRESS.md` for live checkpoint detail and `ROADMAP.md` for the wider product sequence.
