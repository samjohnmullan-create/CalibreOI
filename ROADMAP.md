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

```text
Item
├── Identity
├── Condition
├── Research
├── Commercial
├── Sale
├── Media references
├── Work references
└── Watch extension?
    ├── Passport
    ├── Movement
    ├── Timing history
    └── Public Passport

Work
├── Item ID
├── Type / status
├── Diagnosis
├── Faults
├── Stages
├── Measurements
├── Parts references
├── Labour
├── Timing runs
├── Repair performed
├── Next action / blocker
└── Final QC
```

Other Core collections:

- MediaAsset
- Inventory resources — parts, tools, consumables, donors and storage locations
- Compatibility evidence
- Incoming
- Knowledge
- Ledger
- Settings

## Navigation rule

Calibre has five primary destinations only:

1. **Home** — attention: what needs me now?
2. **Items** — every physical Item owned or previously owned.
3. **Workbench** — active or deliberately queued Work only.
4. **Business** — portfolio money, sourcing and sales intelligence.
5. **Calibre** — assistant, inbox, capture, knowledge and settings.

New features do not automatically get new destinations. They attach to Item, Work, Business or Calibre.

## Item workspace

Every Item is organised into three mental models:

### Work
What am I physically doing?

Watch / clock: Diagnosis · Service · Measurements · Timing · Parts · QC

Jewellery: Inspect · Clean · Restore · Measurements · QC

### Item
What is it?

Identity · Passport where applicable · Research · Media · History · Documents

### Commerce
What did it cost and how do I sell it?

Costs · Valuation · Listing · Sale

## Workbench

Workbench is task-oriented, not an inventory dashboard.

- **Now** — on bench / high priority
- **Next** — ready to start / awaiting inspection
- **Waiting** — parts / external work / research
- **Ready** — QC / photos / listing
- **Queue** — intentionally parked

Every row/card should answer:

- What is it?
- What Work is happening?
- What is next?
- What is blocking it?

## Global find / command layer

Calibre will gain one global search/command surface usable from keyboard and touch.

Target examples:

- open an Item by name, calibre, serial or tag
- filter awaiting parts / sold / donors
- start Work
- capture image
- add part
- time watch
- print label
- create listing

Desktop target shortcut: **Ctrl/Cmd + K**.

## Device modes

The same app will support:

- **Automatic** — default responsive mode
- **Workstation** — DeX / monitor / keyboard and mouse; compact and information-dense
- **Touch** — phone / bench; large targets and reduced simultaneous controls
- **Capture** — Galaxy Tab / microscope station; minimal capture-first UI

## Legacy cutover status

The active runtime has been cut over from legacy Jobs to Item + Work.

Current rules:

- `state.jobs` is not part of active runtime state
- `currentItemId` and `currentWorkId` own selection
- Work history replaces Job-derived service history
- active runtime must not reintroduce Job fields
- compatibility/import tooling remains isolated from normal runtime

## Foundation Lock — COMPLETE

Foundation Lock has completed the persisted/runtime convergence work:

- schema 2: Work persistence converged on canonical `work`
- schema 3: loose parts/tools converged under `inventory`
- schema 4: bench fit evidence converged under `compatibilityEvidence`; sourced facts/documents under typed `knowledge`
- schema 5: purchase review converged under typed `incoming`; `ledger` made intentional Core data
- schema 6: legacy Workshop IDs converged into `inventory.locations`, `inventory.tools` and `inventory.parts`
- active Parts, Tools, Workshop IDs, Reference and Incoming UI now read/write canonical collections directly
- temporary runtime compatibility aliases/proxies have been removed
- architecture documentation now describes one Core + schema versions

Old field names remain supported only at explicit forward-migration/archive boundaries.

## Reliability foundation — COMPLETE

The first safety layer now protects canonical data without adding another Core model:

- the Job-era Backup screen has been replaced by canonical **Recovery & health**
- portable backups include schema metadata plus a corruption-detection checksum
- backup restore validates before replacement and refuses unsupported newer schema
- Calibre keeps up to five browser-local safety snapshots outside Core state
- autosave creates a throttled recovery point before overwrites
- explicit cloud pull/push and restore create forced pre-operation safety points
- system health checks canonical Item → Work → MediaAsset ownership, duplicate IDs, missing storage references and stale current selections
- normal cloud writes refuse to silently overwrite a remote copy changed since the device last saw it
- failed/conflicted cloud pushes keep the local save intact
- safe cloud pull merges canonical collections; safe cloud push is an explicit intentional override
- meaningful reliability events are retained in a bounded audit trail under Settings

Known remaining hardening: the remote freshness check and write are two operations, so full atomic compare-and-swap still needs a database-side revision guard.

See `docs/RELIABILITY.md`.

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
- Reference Intelligence
- CSV/JSON reference import
- technical PDF import
- scanned-PDF OCR review
- Reference Library
- deployment freshness guard
- Timegrapher sample-clock engine and saved-run comparison
- Knowledge Engine foundation
- Foundation Lock persistence/runtime convergence
- Reliability foundation: checked backups, recovery snapshots, integrity health, audit events and cloud overwrite protection

## Current build order

1. **Reliability hardening** — database-side atomic revision guard, recovery-drill tests, prominent unresolved conflict status and optional off-device backup destination.
2. **Integrate Knowledge Engine** — Passport, Timegrapher defaults, Parts, Workbench and technical documents should consume the same sourced knowledge.
3. **Build Movement Finder** — evidence-ranked identification by maker/calibre markings, measurements, mechanical traits and visual architecture.
4. **Build proactive Workbench intelligence** — next action, blockers, relevant documents, part/donor candidates and QC prompts.
5. **Expand Parts + Donor intelligence** — physical storage locations, verified fit history, donor sacrifice economics and compatibility alerts.
6. **Device experience** — Automatic / Workstation / Touch / Capture behaviour for phone, DeX monitor and Galaxy Tab microscope use.
7. **Hardware layer** — validate the USB Timegrapher microphone, then add printer/Windows bridge and QR/bin label workflows.
8. **Global search / command** — Ctrl/Cmd+K on workstation plus touch-friendly search/actions.
9. **Business brain** — potential/realised profit, ROI, profit per labour hour, stock age, capital tied up and “what should I work on next?” prioritisation.
10. **Acquisition engine** — auction triage, max bid, resale potential and donor usefulness against current Items/Work.
11. **Listing engine** — turn Item identity + research + Work + condition + media + commerce into channel-ready listings.
12. **Customer/output layer** — public Passport, QR provenance, customer-facing presentation, COA/service outputs and storefront integration.
13. **Continuous learning loop** — confirmed bench, timing, compatibility and sale outcomes improve future recommendations without overwriting provenance.

## Near-term sequence

The next practical run is:

**Reliability hardening → Knowledge Engine integration → Movement Finder → proactive Workbench intelligence**

Timegrapher detector maths should not be expanded until the incoming USB microphone is validated against known watches/rates. Knowledge integration can still preload verified BPH/frequency/lift-angle defaults in the meantime.
