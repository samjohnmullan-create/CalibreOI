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

Calibre has one Core. Product generations such as “Core v2” are not part of the architecture. Persisted data uses `schemaVersion`; stored-shape changes require explicit forward migrations.

The canonical contract lives in `js/core.js`.

Other Core collections include MediaAsset, Inventory resources/locations, Compatibility evidence, Incoming, Knowledge, Ledger and Settings.

## Navigation rule

Calibre has five primary destinations only:

1. **Home** — attention: what needs me now?
2. **Items** — every physical Item owned or previously owned.
3. **Workbench** — active or deliberately queued Work only.
4. **Business** — portfolio money, sourcing and sales intelligence.
5. **Calibre** — assistant, inbox, capture, knowledge and settings.

New features do not automatically get new destinations.

## Item workspace

Every Item is organised into three mental models:

- **Work** — what am I physically doing?
- **Item** — what is it?
- **Commerce** — what did it cost and how do I sell it?

## Foundation Lock — COMPLETE

Foundation Lock completed the persisted/runtime convergence work through schema 6. Active Parts, Tools, Workshop IDs, Reference and Incoming UI now use canonical owners directly; old field names remain only at explicit migration/archive boundaries.

## Reliability — COMPLETE

The practical reliability layer now protects canonical data without adding another Core model:

- canonical Recovery & health screen
- schema-aware checked portable backups
- up to five browser-local recovery snapshots outside Core state
- forced safety points before restore/cloud pull/cloud push
- canonical Item → Work → MediaAsset integrity checks
- bounded reliability audit trail
- failed/conflicted cloud pushes keep local work intact
- **atomic database revision guard** on `calibre_state`
- normal writes use an authenticated compare-and-swap RPC rather than direct upsert
- stale devices receive `CALIBRE_SYNC_CONFLICT` rather than overwriting newer cloud data
- safe pull records the revision seen; explicit safe push writes against the current revision and still fails safely if another write races it

See `docs/RELIABILITY.md`.

Later reliability additions such as off-device scheduled backup, recovery drills and safe repair helpers can be added as needed rather than blocking intelligence work.

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
- canonical Parts matching and donor evidence
- canonical Workshop IDs and storage locations
- Reference Intelligence and Reference Library
- CSV/JSON/PDF/OCR reference import
- Timegrapher sample-clock engine and saved-run comparison
- Knowledge Engine foundation
- Foundation Lock
- Reliability including atomic cloud concurrency protection

## Current build order

1. **Integrate Knowledge Engine** — Passport, Timegrapher defaults, Parts, Workbench and technical documents should consume the same sourced knowledge.
2. **Build Movement Finder** — evidence-ranked identification by maker/calibre markings, measurements, mechanical traits and visual architecture.
3. **Build proactive Workbench intelligence** — next action, blockers, relevant documents, part/donor candidates and QC prompts.
4. **Expand Parts + Donor intelligence** — verified fit history, donor sacrifice economics and compatibility alerts.
5. **Device experience** — Automatic / Workstation / Touch / Capture behaviour for phone, DeX monitor and Galaxy Tab microscope use.
6. **Hardware layer** — validate the USB Timegrapher microphone, then add printer/Windows bridge and QR/bin label workflows.
7. **Global search / command** — Ctrl/Cmd+K on workstation plus touch-friendly search/actions.
8. **Business brain** — potential/realised profit, ROI, profit per labour hour, stock age, capital tied up and “what should I work on next?” prioritisation.
9. **Acquisition engine** — auction triage, max bid, resale potential and donor usefulness against current Items/Work.
10. **Listing engine** — turn Item identity + research + Work + condition + media + commerce into channel-ready listings.
11. **Customer/output layer** — public Passport, QR provenance, customer-facing presentation, COA/service outputs and storefront integration.
12. **Continuous learning loop** — confirmed bench, timing, compatibility and sale outcomes improve future recommendations without overwriting provenance.

## Near-term sequence

**Knowledge Engine integration → Movement Finder → proactive Workbench intelligence**

Timegrapher detector maths should not be expanded until the incoming USB microphone is validated against known watches/rates. Knowledge integration can preload verified BPH/frequency/lift-angle defaults in the meantime.
