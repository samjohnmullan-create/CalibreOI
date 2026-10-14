# Calibre & Co. — Current Status

**Last reviewed:** 14 October 2026  
**Baseline:** `main` after PR #86, Acquisition Engine v1.  
**Rule:** a feature is only marked shipped here when it is present on `main` and the repository test suite is green.

## Release state

- Canonical domain: **Item + Work + Media + Inventory + Knowledge + Ledger**
- Persisted schema: **6**
- Primary navigation: **Home · Items · Workbench · Business · Calibre**
- CI: **green**
- Internal deployment: **test-gated**
- Public catalogue deployment: **test-gated**
- Current maturity: **internal alpha / operational workshop and resale system**

## Shipped and repo-confirmed

### Foundation
- canonical permanent Item identity
- canonical Work records linked to Items
- first-class Media ownership by Item with optional Work context
- canonical Inventory, Knowledge, Incoming and Ledger collections
- schema migrations through version 6
- no normal-runtime `state.jobs` architecture
- explicit persistence boundary for retired Job-era top-level fields
- protection against silently discarding Job-only legacy data
- non-persisted compatibility views for older Item-page consumers
- integrity checks and recovery tooling
- atomic cloud revision protection
- local safety snapshots and portable backup
- test-gated deployment

### Workshop lifecycle
- Workbench based on canonical Work
- newly planned Work defaults to Queue rather than active bench work
- explicit Queue → Add to bench → In progress lifecycle
- cancelling Work preserves workshop history
- explicit Item write-off to Donor / Spares without deleting Work history
- donor Items remain visible to compatibility intelligence
- manual, automatic, pocket-watch, quartz, clock and inspection workflow routing
- bench measurements and diagnostic intelligence
- parts-needed workflow
- donor intelligence and donor-combine leads
- required-part lifecycle: Needed → Sourced → Received → Fitted
- loose-stock consumption on fitting
- donor-part usage recorded against the donor Item
- fitted parts preserved on Work as parts-used history
- successful fitted sources automatically become bench compatibility evidence
- Waiting Work resumes only when all required parts are on hand
- real Final QC completion gate
- completion blocked by unanswered/failed QC, unfitted required parts, Waiting state or unresolved blockers
- claimed final timing requires a usable saved timing run
- both Complete and Status=Complete-save routes use the same completion gate
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

### Business and commercial lifecycle
- canonical Item Costs / Valuation page
- Item-first economics and profit intelligence
- finance dashboard
- Business Brain prioritisation
- potential and realised profit calculations
- labour-aware profit measures
- stock age / capital tied-up signals
- canonical Sale workspace based on Item + Work rather than legacy Job ownership
- Item-owned listing copy, pricing, offers, channel strategy and commercial state
- Item-media listing photo pack with private archive thumbnail support
- Sale readiness tied to completed Work/QC, final condition, workshop record, listing copy, photo pack and target price
- channel-ready Facebook, eBay and Calibre & Co. website copy generation
- public catalogue / public Passport publishing from Item data plus selected Work evidence
- explicit public fact and photo controls
- Square Payment Link support keyed to Item identity
- legacy public rows keyed to Work ID are migrated when encountered
- Sold updates the permanent Item and creates one idempotent sale ledger receipt
- manually marking Sold closes public availability and removes public checkout
- public `for_sale` publication is blocked until canonical sale readiness passes

### Acquisition Engine v1
- Acquisition lives beneath **Business**, not as a new primary system
- auction / private / marketplace / dealer opportunities persist as canonical Incoming records
- watches-first intake with support for clock, jewellery, accessory, collectible and other categories
- explicit assumptions for buyer premium, postage/collection, parts, consumables, outside work and repair contingency
- explicit labour estimate and labour value
- explicit selling fee and outbound shipping assumptions
- low / expected / high resale scenarios
- capital-at-risk, cash profit, profit-after-labour and ROI calculations
- conservative / expected / optimistic maximum hammer-bid calculations
- explainable **BUY · WATCH · PASS** recommendation
- high repair risk and low identity confidence remain visible decision warnings rather than hidden score adjustments
- candidate calibre/maker compared against owned Items, active Work, donors and loose parts for usefulness
- saved acquisition watchlist / decision records
- Purchased converts a candidate into a permanent Item while preserving the acquisition snapshot
- purchase conversion is idempotent and deliberately does **not** create Work automatically

### Search and usability
- canonical navigation shell
- global command/search layer
- Item workspace
- Work workspace
- mobile / touch tuning

## In progress / incomplete

### Foundation cleanup
- migrate remaining convenience aliases such as `passport` / `business` away from older consumers
- remove compatibility views once no consumer needs them
- remove or archive stale, unused Job-era browser modules
- add browser-level regression coverage for the most important journeys

### Workshop refinement
- convert stage paths into explicit versioned Work Templates
- structured task states: Done / Skipped / Blocked
- consistent labour capture throughout Work
- richer inventory transaction history beyond fitted-part consumption

### Timegrapher
- validate the incoming USB microphone on Android / DeX / desktop
- tune detector behaviour only from real microphone evidence
- retain BPH/rate/beat-error evidence history

### Acquisition Engine — next slices
- attach durable lot photographs/media to Incoming opportunities
- create a research handoff so lot photos/text can be identified and enriched without retyping
- record evidence/provenance behind identity, condition and resale assumptions
- import or paste auction listings with less manual field entry
- auction closing-time / watchlist workflow and optional alerts
- category-specific risk/value rules for jewellery, accessories and other small collectibles
- feed realised purchase, labour and sale outcomes back into acquisition-source performance

### Commerce automation
- secure server-created Square checkout
- verified Square webhook handling
- webhook-authoritative automatic Sold state
- payment/fee reconciliation
- transactional customer email

### Operational inventory and finance
- inventory receive / return / adjustment / stocktake / write-off transactions
- exact cost basis and location history where useful
- marketplace/payment fees, postage, refunds and ledger reconciliation
- explicit separation of projected and realised financial values

### Persistence scale
- progressively move large operational collections from one state blob to queryable Supabase tables
- preserve the existing Core contract and IndexedDB offline behaviour

### Real-device acceptance
- run one real watch from intake through queue, bench, parts if needed, repair, timing, QC, valuation, listing, publish and sold flow
- verify the same record on phone, DeX/workstation and a second device
- verify private photo previews/public photo publishing using real captured media
- verify backup restore and cloud-conflict behaviour in practice
- add browser-level smoke tests for the critical journeys

## Immediate priority order

1. Run a real physical end-to-end acceptance watch on the deployed build and log every friction point.
2. Make inventory and finance fully transactional/reconcilable.
3. Extend Acquisition with photo/research intake and lower-friction auction capture.
4. Complete secure Square checkout creation + verified webhook automation.
5. Introduce versioned Work Templates and richer task states.
6. Scale persistence beneath the existing Core only when usage/data volume justifies it.
7. Expand customer documents / Passport outputs and controlled learning.
8. Validate USB timegrapher microphone and printing/QR hardware on phone + DeX.

## Release gate for primary business use

Calibre should become the primary operating system only when all of the following are true:

- repository tests green
- deployment blocked on failed tests
- backup export and restore proven
- cloud conflict behaviour proven
- two-device sync proven
- one real end-to-end acceptance watch passes
- mobile / DeX / desktop smoke checks pass
- finance totals reconcile against real transactions
- no normal-runtime Job architecture remains
- project documentation reflects the actual `main` branch
