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

## Knowledge Engine integration — LIVE

The Knowledge Engine is now part of workshop flow rather than an isolated reference module:

- the full v25 reference dataset is normalized in Supabase rather than copied into Core state
- 3,458 calibre records, 736 normalized part references, 1,172 calibre-part links and 9,165 compatibility edges are available server-side
- verified v25 movement specifications feed Passport suggestions
- Passport fills **missing movement-owned fields only**; movement launch year never becomes watch year automatically
- Timegrapher preloads documented BPH/frequency/lift angle without changing detector maths
- missing lift angle stays unset; Calibre never invents it
- Work / Workbench / Parts surfaces sourced part references and technical documents
- exact documented part references remain distinguishable from family-reported references
- 18 rich verified movement records remain the lightweight workshop/offline pack for Passport, Timegrapher and immediate reference use
- normal app hydration deliberately loads only those 18 rich profiles; large catalogue searches stay server-side

## Knowledge Editor / Research Inbox — LIVE

Knowledge can now grow incrementally without rebuilding or re-importing the full v25 dataset.

- Knowledge Editor lives under the existing **Calibre** destination
- normal signed-in accounts retain shared read-only Knowledge access
- only explicitly allow-listed Knowledge editors can stage or apply changes
- research is saved as **Draft** or **Ready** before it can affect shared Knowledge
- applying a submission is an explicit second action, never an automatic side effect of form entry
- supported record types are Source, Family, Calibre, Part, Calibre↔Part link and Compatibility evidence
- evidence is labelled **Confirmed**, **Supported** or **Candidate**
- existing calibres can be looked up by Knowledge ID and corrected without deleting/recreating them
- applied changes preserve before/after data in an audit log
- production Knowledge tables now allocate new IDs automatically, so individual records can be added safely without a bulk import
- family/dimensional similarity remains evidence, never proof of interchangeability

## Movement Finder — FULL CATALOGUE LIVE

Movement Finder is a Calibre tool, not a sixth primary destination.

Current capabilities:

- evidence-ranked matching across the **full 3,458-calibre v25 catalogue** when signed in
- server-side ranking by maker, calibre markings/aliases, diameter, height, BPH, winding type and jewel count
- the original 18 rich verified movements remain an automatic offline/signed-out fallback
- every result explains the evidence that contributed to its rank
- scores represent evidence fit, not certainty
- current Item can prefill observed clues
- explicit **Use as probable** action writes a candidate only as `Probable`, never `Confirmed`
- selected candidates retain the canonical Knowledge database ID so duplicate maker/calibre labels remain distinguishable
- rich verified records retain source URLs and provenance; broader catalogue records may contain less detail and are labelled accordingly

A source audit of the current 65 `identification_signals` found structured measurement/specification clues (diameter, height, jewels, BPH, winding/movement type), not bridge-shape or other photo-architecture descriptors. Therefore visual recognition is deliberately **not** claimed or scheduled as complete until richer visual signal data exists.

## Proactive Workbench intelligence — COMPLETE

Work and Workbench now surface a compact **Calibre Suggestions** rail derived from the current Item, Work and sourced Knowledge.

- maximum three suggestions at a time
- explicit blocker stays highest priority
- missing identity can point to Movement Finder
- parts waits can surface references/search
- relevant technical documents can surface in context
- missing timing can prompt a baseline run
- near-complete Work can prompt Final QC
- suggestions remain derived and non-persistent

## Parts + Donor intelligence — COMPLETE FOUNDATION

Calibre now separates **compatibility evidence** from **donor sacrifice economics**.

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
- normalized full v25 Knowledge database in Supabase
- live Knowledge Engine workshop integration
- Knowledge Editor / Research Inbox with allow-listed writes and audit history
- full-catalogue server-side Movement Finder with offline fallback
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
