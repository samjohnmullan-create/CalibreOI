# Calibre & Co. — Canonical Roadmap

_Last revised: 11 October 2026_

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

## Knowledge Engine integration — LIVE

The Knowledge Engine is now part of workshop flow rather than an isolated reference module:

- verified v25 movement specifications feed Passport suggestions
- Passport fills **missing movement-owned fields only**; movement launch year never becomes watch year automatically
- Timegrapher preloads documented BPH/frequency/lift angle without changing detector maths
- missing lift angle stays unset; Calibre never invents it
- Work / Workbench / Parts surfaces sourced part references and technical documents
- exact documented part references remain distinguishable from family-reported references
- canonical imported `knowledge` facts/documents are surfaced alongside the compact v25 workshop pack
- 18 rich verified movement records currently carry Passport/Timegrapher/parts detail

## Movement Finder v1 — COMPLETE

Movement Finder is a Calibre tool, not a sixth primary destination.

Current v1 capabilities:

- lightweight compressed catalogue of **3,458 v25 calibre records**
- evidence-ranked matching by maker, calibre markings, diameter, height, BPH, winding type and jewel count where richer data exists
- every result explains the evidence that contributed to its rank
- scores represent evidence fit, not certainty
- current Item can prefill observed clues
- explicit **Use as probable** action writes a candidate only as `Probable`, never `Confirmed`
- richer verified movement records provide source URLs and deeper detail when available

Next Movement Finder expansion will add architecture/visual identification signals from Capture rather than pretending v1 text/measurement scoring is visual recognition.

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
- live Knowledge Engine workshop integration
- Movement Finder v1

## Current build order

1. **Proactive Workbench intelligence** — next action, blockers, relevant documents, part/donor candidates and QC prompts surfaced in context.
2. **Movement Finder visual/architecture expansion** — bridge `identification_signals` and Capture evidence into ranked candidates.
3. **Expand Parts + Donor intelligence** — verified fit history, donor sacrifice economics and compatibility alerts.
4. **Device experience** — Automatic / Workstation / Touch / Capture behaviour for phone, DeX monitor and Galaxy Tab microscope use.
5. **Hardware layer** — validate the USB Timegrapher microphone, then add printer/Windows bridge and QR/bin label workflows.
6. **Global search / command** — Ctrl/Cmd+K on workstation plus touch-friendly search/actions.
7. **Business brain** — potential/realised profit, ROI, profit per labour hour, stock age, capital tied up and “what should I work on next?” prioritisation.
8. **Acquisition engine** — auction triage, max bid, resale potential and donor usefulness against current Items/Work.
9. **Listing engine** — turn Item identity + research + Work + condition + media + commerce into channel-ready listings.
10. **Customer/output layer** — public Passport, QR provenance, customer-facing presentation, COA/service outputs and storefront integration.
11. **Continuous learning loop** — confirmed bench, timing, compatibility and sale outcomes improve future recommendations without overwriting provenance.

## Near-term sequence

**Proactive Workbench intelligence → visual Movement Finder expansion → Parts/Donor intelligence**

Timegrapher detector maths remains frozen until the USB microphone is validated against known watches/rates.
