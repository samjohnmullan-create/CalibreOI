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
- Inventory resources
- Compatibility evidence
- Incoming
- Knowledge
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
- compatibility/import tooling must remain isolated from normal runtime

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
- Reference Intelligence
- CSV/JSON reference import
- technical PDF import
- scanned-PDF OCR review
- Reference Library
- deployment freshness guard
- Timegrapher sample-clock engine and saved-run comparison
- Knowledge Engine foundation

## Current build order

1. **Foundation Lock** — reconcile persistence with the canonical Core, remove stale terminology, document transitional collections, consolidate design/runtime boundaries.
2. **Validate Timegrapher with real hardware** — USB timing microphone, multiple BPH rates/positions and known-watch comparisons.
3. **Integrate Knowledge Engine** — Passport, Timegrapher defaults, Parts, Workbench and technical documents.
4. **Build Movement Finder** — maker/calibre/size/jewels/BPH/geometry-assisted identification.
5. **Build proactive Workbench intelligence** — next action, blockers, relevant documents, parts and QC prompts.
6. **Deepen parts/donor intelligence** — factory refs, variants/serial restrictions, donor economics and sourcing.
7. **Finish business intelligence** — stock age, ROI, repair economics, capital efficiency and work-next ranking.
8. **Build intake automation** — purchases, email, postage/tracking and arrivals.
9. **Finish listing automation** — Passport + research + Work + condition + media + commerce into channel-specific listings.
10. **Build global search / command palette.**
11. **Add explicit Workstation / Touch / Capture interface modes.**
12. **Finish Galaxy Tab microscope Capture workflow.**
13. **Build Print Queue / Windows hardware bridge.**
14. **Finish public Passport and customer-facing layer.**

## Foundation Lock rules

Until Foundation Lock is complete:

- do not add new top-level persisted collections casually
- do not delete transitional store buckets without a migration
- do not create parallel Item/Work models
- keep Reference/Knowledge provenance explicit
- preserve bench evidence separately from external reference evidence
- keep design tokens and reusable layout rules in CSS rather than growing page-specific runtime styling

See `docs/FOUNDATION-LOCK.md`.

## UI direction

Calibre should feel like a precision workshop instrument, not a collection of SaaS cards.

### Workstation
- compact rows and tables where appropriate
- split panes
- slim sidebars
- sticky context headers
- collapsible detail panels
- fewer oversized headings
- reduced vertical padding

### Phone
- stacked content
- larger touch targets
- fewer controls visible at once
- persistent contextual actions where useful

### Context
Use breadcrumbs such as:

**Items › Olma Caravelle › Work › Full Service**

The user should never need to remember the page structure to know where they are.

## Design system

The visual direction remains modern, restrained and workshop-focused.

Design tokens and responsive rules belong in shared CSS. Runtime JavaScript should not become a second design system.

## Success tests

Calibre is moving in the right direction when:

- every physical object has one Item identity
- every activity is a Work record
- a watch may have many Work records without duplicating its Passport
- Workbench shows Work, not inventory
- adding a feature does not require adding another primary navigation destination
- important Items, parts, references and commands are quickly discoverable
- the same data drives bench work, history, finance and sale output
- phone, DeX/monitor and Galaxy Tab each feel intentional
- legacy Jobs are not required by the active runtime
- persisted state has one documented canonical contract and explicit migrations
