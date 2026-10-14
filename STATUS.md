# Calibre & Co. — Current Status

**Last reviewed:** 14 October 2026  
**Baseline:** `main` after release-hardening PR #77  
**Rule:** a feature is only marked shipped here when it is present on `main` and the repository test suite is green.

## Release state

- Canonical domain: **Item + Work + Media + Inventory + Knowledge + Ledger**
- Persisted schema: **6**
- Primary navigation: **Home · Items · Workbench · Business · Calibre**
- CI: **green after PR #77**
- Internal deployment: **test-gated**
- Public catalogue deployment: **test-gated**
- Current maturity: **internal alpha / operational workshop system**

## Shipped and repo-confirmed

### Foundation
- canonical permanent Item identity
- canonical Work records linked to Items
- first-class Media ownership by Item with optional Work context
- canonical Inventory, Knowledge, Incoming and Ledger collections
- schema migrations through version 6
- integrity checks and recovery tooling
- atomic cloud revision protection
- local safety snapshots and portable backup

### Workshop
- Workbench based on canonical Work
- watch/clock workflow routing
- manual, automatic, pocket-watch, quartz, clock and inspection paths
- bench measurements
- diagnostic intelligence
- parts-needed workflow
- donor intelligence and donor-combine leads
- Final QC support
- service-history / repair-timeline support

### Identification and knowledge
- Movement Finder
- server-side knowledge catalogue with offline fallback
- Knowledge Editor and Research Inbox
- Reference Library
- PDF/OCR reference ingestion
- sourced compatibility and reference evidence

### Capture and hardware foundations
- Capture Station
- Item / Work media attachment
- queued media retry
- QR entity identities
- QR labels and scanner routes
- device-mode handling for phone / touch / workstation-style use
- hardware capability layer

### Business and commerce
- Item economics
- finance dashboard
- Business Brain prioritisation
- potential and realised profit calculations
- labour-aware profit measures
- stock age / capital tied-up signals
- sale readiness
- listing photo pack / sale handoff
- public catalogue and public watch Passport pages
- Square Payment Link support

### Search and usability
- canonical navigation shell
- global command/search layer
- Item workspace
- Work workspace
- mobile / touch tuning

## In progress / incomplete

### Foundation Lock final pass
- persistence boundary still needs a final audit for retired Job-era fields
- some compatibility aliases remain and should be removed only when their consumers have been migrated
- old documentation still describes parts of the app as job-first

### Workshop completion
- convert stage paths into explicit versioned Work Templates
- structured task states: Done / Skipped / Blocked
- stronger required-QC gating
- consistent labour capture
- consistent parts-used transaction capture

### Timegrapher
- validate the incoming USB microphone on Android / DeX / desktop
- tune only from real microphone evidence
- retain BPH/rate/beat-error evidence history

### Listing engine
- remove remaining Job-shaped assumptions from listing code
- build canonical Item + Work + Media + Commerce listing input
- generate channel-ready eBay / Facebook / public-site copy
- evidence-safe claims and condition wording

### Acquisition engine
- auction-lot intake
- buyer's premium and postage-aware max bid
- repair risk and labour estimate
- donor usefulness against owned stock
- expected resale and profit range
- Buy / Watch / Pass recommendation

### Commerce automation
- secure server-created Square checkout
- verified Square webhook handling
- automatic Sold state
- ledger update
- checkout disablement
- transactional customer email

### Persistence scale
- progressively move large operational collections from one state blob to queryable Supabase tables
- preserve the existing Core contract and IndexedDB offline behaviour

### Acceptance testing
- complete one real watch end-to-end through acquisition/intake, Work, media, diagnosis, repair, timing, QC, valuation, listing, publish and sold flow
- add browser-level smoke tests for the critical user journeys

## Immediate priority order

1. Finish Release Hardening / Foundation Lock audit.
2. Reconcile `README.md`, `ROADMAP.md`, `ARCHITECTURE.md` and this status file.
3. Run one end-to-end acceptance watch and log every friction point.
4. Complete workshop templates and QC rules.
5. Build Acquisition Engine.
6. Complete canonical Listing Engine and commerce automation.
7. Scale persistence beneath the existing Core.
8. Expand customer outputs and controlled learning.

## Release gate for primary business use

Calibre should become the primary operating system only when all of the following are true:

- repository tests green
- deployment blocked on failed tests
- backup export and restore proven
- cloud conflict behaviour proven
- two-device sync proven
- end-to-end acceptance watch passes
- mobile / DeX / desktop smoke checks pass
- finance totals reconcile against real transactions
- no normal-runtime Job architecture remains
- project documentation reflects the actual `main` branch
