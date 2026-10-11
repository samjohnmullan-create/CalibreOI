# Calibre & Co. — Architecture

_Last revised: 11 October 2026_

## Product definition

Calibre is an item lifecycle and workshop operating system for watches, clocks, jewellery, accessories and small collectibles, with a specialist horology layer for watches and clocks.

The broad lifecycle is:

**Acquire → Identify → Research → Inspect → Work → Document → Value → Sell → Preserve**

Watch and clock Items additionally support:

**Diagnose → Service → Parts → Measure → Time → QC → Passport**

---

# Core rule

## Item is permanent

An Item is the physical thing.

Examples:
- wristwatch
- pocket watch
- clock
- brooch
- ring
- bracelet
- cufflinks
- lighter
- pen
- small collectible

The Item survives acquisition, restoration, service, listing, sale and future history.

## Work is activity

A Work record describes something done to an Item.

Examples:
- full service
- regulation
- inspection
- cleaning
- restoration
- preparation
- photography preparation
- listing preparation

An Item may have no Work records, one Work record or many Work records over its lifetime.

There is no active architectural role for a legacy Job object in Core v2.

---

# Canonical Core v2 object model

```text
item
├── id
├── type
├── purpose
├── title
├── status
├── identity
├── condition
├── research[]
├── mediaAssetIds[]
├── commercial
├── sale
├── workIds[]
├── tags[]
├── notes
└── watch?                  # watch/clock extension only
    ├── passport
    ├── movement
    ├── timingHistory[]
    └── publicPassport

work
├── id
├── itemId
├── number
├── type
├── title
├── status
├── diagnosis
├── faults[]
├── diagnosticFaults[]
├── stages[]
├── measurements[]
├── partIds[]
├── labour
├── timingRuns[]
├── repairPerformed
├── decision
├── nextAction
├── blocker
└── finalQC

mediaAsset
├── id
├── itemId
├── workId?                 # optional work context
├── category
├── source
├── storageKey / URL
├── thumbnailURL
├── metadata
├── caption / evidence note
└── visibility

inventory
├── parts[]
├── tools[]
├── consumables[]
└── donors[]

compatibilityEvidence[]
incoming[]
knowledge[]
settings
```

`js/core-v2.js` is the executable schema contract for the new model.

---

# Navigation architecture

Calibre has exactly five primary destinations:

**Home · Items · Workbench · Business · Calibre**

## Home

Attention only: what needs action now?

## Items

Everything physical owned or previously owned.

Filters may include Watches, Clocks, Jewellery, Accessories, Collectibles, Donors and Sold.

## Workbench

Active or deliberately queued Work only.

Workbench groups:

**Now · Next · Waiting · Ready · Queue**

## Business

Portfolio financial, sourcing and sales intelligence.

## Calibre

Assistant, Inbox, Capture, Knowledge and Settings.

New features attach to one of these places. They do not automatically create new top-level destinations.

`js/navigation-model.js` is the executable navigation contract.

---

# Item workspace

Every Item uses three high-level areas.

## Work

What am I physically doing?

Watch / clock:

**Diagnosis · Service · Measurements · Timing · Parts · QC**

Jewellery:

**Inspect · Clean · Restore · Measurements · QC**

Other Items use an appropriate reduced Work set.

## Item

What is it?

**Identity · Passport where applicable · Research · Media · History · Documents**

## Commerce

What did it cost and how do I sell it?

**Costs · Valuation · Listing · Sale**

The three areas are the mental model. Individual sections should not become top-level application navigation.

---

# Device modes

One application supports four interface densities/modes:

- **Automatic** — default responsive selection
- **Workstation** — DeX, monitor, desktop, keyboard/mouse; compact and information-dense
- **Touch** — phone/bench; large targets, reduced simultaneous controls
- **Capture** — Galaxy Tab/microscope station; capture-first and minimal

Device mode changes presentation, not the underlying data model.

---

# Search and commands

Calibre will have one global find/command layer.

It must be capable of locating Items and Work by useful identifiers such as name, maker, calibre, serial, status, tag, part or workflow state.

It may also expose contextual commands such as:

- start Work
- capture image
- add part
- time watch
- mark waiting
- print label
- create listing

Desktop target shortcut: **Ctrl/Cmd + K**.

---

# Business intelligence

Business analytics operate across all resale Items, not only watches.

Useful outputs include:

- available cash
- cash profit
- profit after labour
- ROI
- profit per labour hour
- stock age
- capital tied up
- category profitability
- source profitability
- channel profitability
- realised vs projected profit
- average days to sale
- preparation/restoration uplift

Tool costs and inventory-resource costs remain separate from Item profitability unless explicitly allocated.

---

# Media

Media is a first-class record.

A MediaAsset always belongs to an Item and may optionally belong to a Work record.

Typical categories:

- original/intake
- identity
- movement
- workshop
- fault/damage
- part
- progress
- finished
- sale/listing
- document

The Galaxy Tab microscope workflow uses the same MediaAsset model; there is no special Job attachment path.

---

# Storage direction

The active Core v2 state uses canonical collections only.

Target local/cloud collections:

```text
items
work
mediaAssets
inventory
compatibilityEvidence
incoming
knowledge
settings
```

IndexedDB remains useful for offline/local-first behaviour. Supabase remains the cloud/auth platform unless there is a reason to change it.

Persistence should become simpler over time: storage code stores and syncs canonical records; specialist business logic belongs outside the store layer.

---

# Legacy cutover

The old progressive compatibility strategy is retired.

## Before cutover

1. export the full existing legacy state
2. keep the export as a frozen archive
3. run a one-shot converter into Core v2
4. preserve useful identity, Passport, research, commercial, media, faults, parts, timing and service information where it maps cleanly
5. log anything skipped or ambiguous
6. validate the converted Core v2 state

## After cutover

The active runtime does not load or write `state.jobs`.

Retire:

- `currentId` as current Job
- `legacyJobId`
- `specialistJobId`
- Job → Item mirroring
- Job → Work mirroring
- bridge/reconciliation code whose only purpose is dual-model compatibility

Replace with:

- `currentItemId`
- `currentWorkId`
- direct `work.itemId`
- Work-derived history

Legacy conversion code may remain only as explicit archive/import tooling until no longer useful.

---

# UI system

The visual direction remains quiet sage + graphite: modern, restrained and instrument-like.

Rules:

- design tokens live in shared CSS
- runtime JavaScript must not introduce a competing palette
- Workstation uses tighter rows, tables, panes and sticky context
- Touch uses stacked content, large targets and fewer simultaneous controls
- breadcrumbs show context, e.g. `Items › Olma Caravelle › Work › Full Service`
- avoid creating a giant card for every piece of information

---

# Non-negotiable rules

1. One physical object gets one permanent Item identity.
2. Work never becomes the permanent identity of an Item.
3. Passport belongs to the Item, not a single service.
4. Watch-only fields do not pollute generic Item workflows.
5. Shared financial logic works across all resale categories.
6. Media references Item and optional Work directly.
7. Research claims remain evidence-aware and reviewable.
8. Offline use remains first-class.
9. No new active feature should depend on the legacy Job model.
10. Adding a feature does not automatically add a navigation destination.
11. The user should be able to find important objects and commands quickly.
12. Calibre should learn from confirmed bench and sales evidence over time.

---

# Implementation sequence

1. Core v2 schema
2. canonical navigation model
3. Item workspace: Work / Item / Commerce
4. Workbench around Work only
5. global search/command palette
6. frozen legacy export + converter
7. runtime cutover from Jobs
8. simplified persistence/store layer
9. CSS/design consolidation
10. Workstation / Touch / Capture modes
11. microscope Capture workflow
12. diagnostics / next action / QC intelligence
13. donor / compatibility intelligence
14. finance and intake automation
15. print bridge
16. timegrapher hardware validation
17. listing/public Passport/customer layer
