# Calibre & Co. — Canonical Roadmap

_Last revised: 12 October 2026_

## Product direction

Calibre is an item lifecycle and workshop operating system for watches, clocks, jewellery, accessories and small collectibles.

**Item is permanent. Work is activity.**

The broad lifecycle is:

**Acquire → Identify → Research → Inspect → Work → Document → Value → Sell → Preserve**

Watch and clock Items additionally support:

**Diagnose → Service → Parts → Measure → Time → QC → Passport**

## Canonical Core

Calibre has one Core. Persisted data uses `schemaVersion`; stored-shape changes require explicit forward migrations. Reference knowledge remains read-only/shared rather than being copied into every Item.

The canonical contract lives in `js/core.js`.

## Navigation rule

Calibre has five primary destinations only: **Home · Items · Workbench · Business · Calibre**. New features attach beneath these destinations rather than automatically becoming new primary navigation.

## Foundation Lock — COMPLETE

Foundation Lock completed persisted/runtime convergence through schema 6. Old field names remain only at explicit migration/archive boundaries.

## Reliability — COMPLETE

Calibre now has checked portable backups, local recovery snapshots, canonical integrity checks, a bounded audit trail and atomic cloud compare-and-swap revision protection. Stale devices fail with `CALIBRE_SYNC_CONFLICT` rather than silently overwriting newer cloud data.

See `docs/RELIABILITY.md`.

## Full v25 Knowledge Database — LIVE

The **entire v25 reference database** is now a lazy-loaded runtime asset outside Core state. The original ~5 MB JSON is stored as an integrity-checked gzip reference asset and only loads when a full-database feature needs it.

Runtime coverage includes:

- 90 sources
- 67 movement families
- **3,458 calibres**
- 736 part references
- **1,172 calibre → part-reference links**
- **9,165 compatibility edges**
- 14 aliases
- family evidence, measured parts and dimensional candidates
- 51 movement applications
- 30 application-compatibility records
- 18 rich movement specifications
- 10 technical documents
- 65 identification signals
- owned-watch profiles, research and owned-watch parts
- calibre catalogue index and manufacturer coverage
- research queue
- 41 brand/movement associations and brand identity notes
- Waltham grade index
- Knowledge rules, feature bindings and source capability records

`js/knowledge-database.js` provides indexed queries over the whole dataset while the existing rich movement pack remains useful as a high-confidence overlay. The database is reference data and is never copied wholesale into Item/Work persistence.

## Knowledge Engine integration — LIVE

The Knowledge Engine is part of workshop flow rather than an isolated reference module:

- verified movement specifications feed Passport suggestions
- Passport fills **missing movement-owned fields only**; movement launch year never becomes watch year automatically
- Timegrapher preloads documented BPH/frequency/lift angle without changing detector maths
- missing lift angle stays unset; Calibre never invents it
- Work / Workbench / Parts surfaces sourced part references and technical documents
- exact documented part references remain distinguishable from family-reported references
- canonical imported `knowledge` facts/documents remain separate from shared v25 reference data

## Movement Finder — FULL DATABASE LIVE

Movement Finder is a Calibre tool, not a sixth primary destination.

Current capabilities:

- evidence-ranked matching across the **full 3,458-calibre v25 catalogue**
- matching by maker, calibre markings/aliases, diameter, height, BPH, winding type and jewel count where available
- richer 18-record verified specs overlay deeper evidence where available
- every result explains the evidence that contributed to its rank
- scores represent evidence fit, not certainty
- current Item can prefill observed clues
- explicit **Use as probable** writes a candidate only as `Probable`, never `Confirmed`
- probable candidates retain the v25 calibre ID for later joins into parts/compatibility evidence

A source audit of the current 65 `identification_signals` found structured measurement/specification clues (diameter, height, jewels, BPH, winding/movement type), not bridge-shape or other photo-architecture descriptors. Visual recognition is therefore deliberately **not** claimed until richer visual signal data exists.

## Proactive Workbench intelligence — COMPLETE

Work and Workbench surface a compact **Calibre Suggestions** rail derived from the current Item, Work and sourced Knowledge.

- maximum three suggestions at a time
- explicit blocker stays highest priority
- missing identity can point to Movement Finder
- parts waits can surface references/search
- relevant technical documents can surface in context
- missing timing can prompt a baseline run
- near-complete Work can prompt Final QC
- suggestions remain derived and non-persistent

## Parts + Donor intelligence — COMPLETE FOUNDATION

Calibre separates **compatibility evidence** from **donor sacrifice economics**.

- Parts can compare loose-stock evidence against donor candidates
- high-value or apparently complete donors are protected when fit is not bench-verified
- similar-quality loose stock is preferred when it avoids donor sacrifice
- bench-verified low-risk donors can be promoted as sensible donor choices
- donor risk considers recorded value/investment and whether the donor is already documented as parted
- same-calibre owned donor Items can create a **combine opportunity** alert
- calibre-overlap pairs remain leads only, never proof of interchangeability
- physical/bench verification still outranks family/name similarity

## Current state

Substantially complete:

- canonical Item + Work runtime
- five-destination navigation
- Item workspace: Work · Item · Commerce
- Workbench around canonical Work
- structured workshop stages
- desktop/DeX Work workspace
- Business Item dashboard
- Capture Station
- canonical Parts matching, donor evidence and storage locations
- Reference Intelligence / Reference Library / PDF-OCR ingestion
- Timegrapher sample-clock engine and saved-run comparison
- Foundation Lock
- Reliability including atomic cloud concurrency protection
- **full v25 Knowledge Database runtime**
- live Knowledge Engine workshop integration
- full-database Movement Finder
- proactive Workbench intelligence
- donor sacrifice / donor-pair intelligence foundation

## Current build order

1. **Device experience** — Automatic / Workstation / Touch / Capture behaviour for phone, DeX monitor and Galaxy Tab microscope use.
2. **Hardware layer** — validate the USB Timegrapher microphone, then add printer/Windows bridge and QR/bin label workflows.
3. **Global search / command** — Ctrl/Cmd+K on workstation plus touch-friendly search/actions.
4. **Business brain** — potential/realised profit, ROI, profit per labour hour, stock age, capital tied up and “what should I work on next?” prioritisation.
5. **Acquisition engine** — auction triage, max bid, resale potential and donor usefulness against current Items/Work.
6. **Listing engine** — turn Item identity + research + Work + condition + media + commerce into channel-ready listings.
7. **Customer/output layer** — public Passport, QR provenance, customer-facing presentation, COA/service outputs and storefront integration.
8. **Continuous learning loop** — confirmed bench, timing, compatibility and sale outcomes improve future recommendations without overwriting provenance.
9. **Movement Finder visual expansion** — revisit when the Knowledge dataset contains genuine architecture/photo descriptors suitable for evidence-ranked visual identification.

## Near-term sequence

**Device experience → hardware layer → global search/command**

Timegrapher detector maths remains frozen until the USB microphone is validated against known watches/rates.
