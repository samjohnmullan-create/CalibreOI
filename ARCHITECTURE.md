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

An Item is the physical thing. It survives acquisition, restoration, service, listing, sale and future history.

## Work is activity

A Work record describes something done to an Item. An Item may have no Work records, one Work record or many Work records over its lifetime.

There is no active architectural role for a legacy Job object.

---

# Canonical Core object model

Calibre has one Core. Persisted-shape evolution is represented by `schemaVersion`, not by parallel Core generations.

```text
item
├── id
├── type / purpose / status
├── title
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
├── type / status
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
├── workId?                 # optional Work context
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
ledger[]
settings
```

`js/core.js` is the executable domain contract. `js/store-base.js` owns local persisted-shape migration and normalisation; `js/store-cloud-core.js` owns cloud reconciliation of canonical collections.

Current persisted schema: **5**.

Migration history:

- schema 2: `workRecords` → `work`
- schema 3: `tools` / `partsStock` → `inventory`
- schema 4: bench fit evidence → `compatibilityEvidence`; reference facts/documents → typed `knowledge`
- schema 5: purchase review suggestions → typed `incoming`; ledger made intentional Core data

Legacy names may remain inside migration/archive code only. Active runtime code must use canonical owners directly.

---

# Navigation architecture

Calibre has exactly five primary destinations:

**Home · Items · Workbench · Business · Calibre**

## Home
Attention only: what needs action now?

## Items
Everything physical owned or previously owned.

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

## Item
What is it?

**Identity · Passport where applicable · Research · Media · History · Documents**

## Commerce
What did it cost and how do I sell it?

**Costs · Valuation · Listing · Sale**

The three areas are the mental model. Individual sections should not become top-level application navigation.

---

# Evidence and Knowledge

Bench-confirmed evidence and sourced external claims are deliberately different.

- `compatibilityEvidence` contains workshop evidence such as `recordType: bench-fit`.
- `knowledge` contains sourced/reference records such as `reference-fact` and `reference-document`.
- source URL, document ID, confidence, evidence class and verdict must remain explicit.
- family membership or dimensional similarity may suggest a candidate, but do not prove part interchangeability.
- exact factory/shared part references and serial-range-specific evidence outrank general family inference.

Items may reference Knowledge but should not duplicate entire shared Knowledge records.

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

Calibre will have one global find/command layer capable of locating Items and Work by name, maker, calibre, serial, status, tag, part or workflow state.

Contextual commands may include:

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
- category/source/channel profitability
- realised vs projected profit
- average days to sale
- preparation/restoration uplift

`ledger` records real business money movements. Available Cash is derived from ledger movements only; projected Item profit does not alter cash position.

Tool costs and inventory-resource costs remain separate from Item profitability unless explicitly allocated.

---

# Media

Media is a first-class record.

A MediaAsset always belongs to an Item and may optionally belong to a Work record.

Typical categories include intake, identity, movement, workshop, damage, part, progress, finished, sale/listing and document.

The Galaxy Tab microscope workflow uses the same MediaAsset model; there is no special Job attachment path.

---

# Storage direction

Canonical local/cloud collections are:

```text
items
work
mediaAssets
inventory
compatibilityEvidence
incoming
knowledge
ledger
settings
```

IndexedDB remains useful for offline/local-first behaviour. Supabase remains the cloud/auth platform unless there is a reason to change it.

Persistence code should stay boring: load, migrate, normalise, merge and save. Specialist workshop/business logic belongs in domain modules.

Foundation Lock removed the runtime compatibility aliases used during schema convergence. Old shapes are accepted only at explicit migration/import boundaries.

---

# Legacy cutover

The active runtime does not load or write `state.jobs`.

Retired active concepts include:

- `currentId` as current Job
- `legacyJobId`
- `specialistJobId`
- Job → Item mirroring
- Job → Work mirroring
- `workRecords`
- top-level `partsStock` / `tools`
- top-level `partFitEvidence`
- top-level `referenceFacts` / `referenceDocuments`
- top-level `purchaseReview`

Current ownership uses:

- `currentItemId`
- `currentWorkId`
- direct `work.itemId`
- Work-derived history
- canonical Inventory / Evidence / Knowledge / Incoming

Legacy conversion code may remain only as explicit archive/import/migration tooling.

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

Runtime-injected component styles may exist during feature development, but reusable styles should migrate into shared CSS when the component stabilises.

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
9. No new active feature should depend on the legacy Job model or retired runtime aliases.
10. Adding a feature does not automatically add a navigation destination.
11. The user should be able to find important objects and commands quickly.
12. Calibre should learn from confirmed bench and sales evidence over time.

---

# Current implementation sequence

Foundation Lock is complete. Next priorities are:

1. reliability layer: sync/conflict recovery, backups, integrity checks and audit history
2. Knowledge Engine integration across Passport, Timegrapher, Parts, Workbench and technical documents
3. Movement Finder
4. proactive Workbench intelligence
5. parts/donor intelligence expansion
6. device modes and hardware workflows
7. global search/command
8. Business prioritisation and acquisition intelligence
9. listing/public Passport/customer layer
