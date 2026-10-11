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

- evidence-ranked matching across the **18 rich verified movement records** currently in the workshop Knowledge pack
- matching by maker, calibre markings, diameter, height, BPH, winding type and jewel count
- every result explains the evidence that contributed to its rank
- scores represent evidence fit, not certainty
- current Item can prefill observed clues
- explicit **Use as probable** action writes a candidate only as `Probable`, never `Confirmed`
- verified movement records retain source URLs and provenance

The wider **3,458-calibre v25 catalogue** remains available as source material for the next Finder indexing phase. It will be introduced alongside `identification_signals` and Capture/architecture evidence rather than shipping a broad but shallow compressed lookup layer in v1.

## Proactive Workbench intelligence — COMPLETE

Work and Workbench now surface a compact **Calibre Suggestions** rail derived from the current Item, Work and sourced Knowledge.

Rules:

- maximum three suggestions at a time
- suggestions are derived only; they do not create another persisted model
- an explicit Work blocker stays highest priority
- unknown movement identity points to Movement Finder
- parts-related waiting can surface exact or family-labelled references and Parts tools
- relevant technical documents can be surfaced in context
- watch Work without a timing run can prompt a baseline Timegrapher run
- Work nearing completion can prompt Final QC
- explicit recorded next action remains visible when no blocker outranks it
- every suggestion explains why it appeared and identifies its confidence/provenance class

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
- proactive Workbench intelligence

## Current build order

1. **Movement Finder visual/architecture expansion** — bridge the wider v25 catalogue, `identification_signals` and Capture evidence into ranked candidates.
2. **Expand Parts + Donor intelligence** — verified fit history, donor sacrifice economics and compatibility alerts.
3. **Device experience** — Automatic / Workstation / Touch / Capture behaviour for phone, DeX monitor and Galaxy Tab microscope use.
4. **Hardware layer** — validate the USB Timegrapher microphone, then add printer/Windows bridge and QR/bin label workflows.
5. **Global search / command** — Ctrl/Cmd+K on workstation plus touch-friendly search/actions.
6. **Business brain** — potential/realised profit, ROI, profit per labour hour, stock age, capital tied up and “what should I work on next?” prioritisation.
7. **Acquisition engine** — auction triage, max bid, resale potential and donor usefulness against current Items/Work.
8. **Listing engine** — turn Item identity + research + Work + condition + media + commerce into channel-ready listings.
9. **Customer/output layer** — public Passport, QR provenance, customer-facing presentation, COA/service outputs and storefront integration.
10. **Continuous learning loop** — confirmed bench, timing, compatibility and sale outcomes improve future recommendations without overwriting provenance.

## Near-term sequence

**Visual Movement Finder expansion → Parts/Donor intelligence → Device experience**

Timegrapher detector maths remains frozen until the USB microphone is validated against known watches/rates.
