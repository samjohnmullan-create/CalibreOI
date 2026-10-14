# Calibre & Co. — Architecture

_Last revised: 14 October 2026_

## Product definition

Calibre is an item-lifecycle and workshop operating system for watches, clocks, jewellery, accessories and small collectibles, with a specialist horology layer for watches and clocks.

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
├── donors[]
└── locations[]             # trays, drawers, bins, cabinets

compatibilityEvidence[]
incoming[]
knowledge[]
ledger[]
settings
```

`js/core.js` is the executable domain contract. Local/cloud persistence code owns migration, normalisation, reconciliation and sync metadata; business/workshop logic belongs in domain modules.

Current persisted schema: **6**.

Migration history:

- schema 2: `workRecords` → `work`
- schema 3: `tools` / `partsStock` → `inventory`
- schema 4: bench fit evidence → `compatibilityEvidence`; reference facts/documents → typed `knowledge`
- schema 5: purchase review suggestions → typed `incoming`; ledger made intentional Core data
- schema 6: `workshopAssets` → canonical inventory parts/tools/locations

Legacy names may remain only inside explicit migration/import/archive boundaries. Normal runtime must use canonical owners directly.

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

Watch / clock: **Diagnosis · Service · Measurements · Timing · Parts · QC**

Jewellery: **Inspect · Clean · Restore · Measurements · QC**

## Item

What is it?

**Identity · Passport where applicable · Research · Media · History · Documents**

## Commerce

What did it cost and how do I sell it?

**Costs · Valuation · Listing · Sale**

These are the mental model. Individual sections should not become top-level application navigation.

---

# Evidence and Knowledge

Bench-confirmed evidence and sourced external claims are deliberately different.

- `compatibilityEvidence` contains workshop evidence such as bench-fit results.
- `knowledge` contains sourced/reference records.
- source URL, document ID, confidence, evidence class and verdict remain explicit.
- family membership or dimensional similarity may suggest a candidate but do not prove interchangeability.
- exact factory/shared part references and serial-range-specific evidence outrank general family inference.

Items may reference Knowledge but should not duplicate entire shared Knowledge records.

A learned bench result adds evidence; it does not rewrite factory/reference truth.

---

# Inventory and workshop storage

Physical workshop resources use one Inventory owner.

- loose parts → `inventory.parts`
- tools → `inventory.tools`
- consumables → `inventory.consumables`
- donor resources → `inventory.donors` and donor Items where appropriate
- trays, drawers, bins and cabinets → `inventory.locations`

QR/Workshop IDs reference these canonical resources. There is no separate `workshopAssets` runtime collection.

Operational inventory will progressively gain transaction history for receive, consume, fit, remove from donor, return, adjustment, stocktake and write-off.

---

# Device modes

One application supports four interface densities/modes:

- **Automatic** — default responsive selection
- **Workstation** — DeX, monitor, desktop, keyboard/mouse; compact and information-dense
- **Touch** — phone/bench; large targets and fewer simultaneous controls
- **Capture** — capture/microscope station; capture-first and minimal

Device mode changes presentation, not the underlying data model.

---

# Search and commands

Calibre has one global find/command layer for locating Items and Work and for fast contextual actions.

The command layer belongs to the application shell; it is not another primary destination.

Desktop target shortcut: **Ctrl/Cmd + K**.

---

# Business intelligence

Business analytics operate across resale Items rather than only watches.

Useful outputs include:

- projected and realised cash profit
- profit after labour
- ROI
- profit per labour hour
- stock age
- capital tied up
- category/source/channel profitability
- average days to sale
- restoration uplift
- sale readiness
- best-next-work prioritisation

`ledger` is reserved for real business money movements. Projected Item profit does not alter real cash position.

Tool costs and inventory-resource costs remain separate from Item profitability unless explicitly allocated.

---

# Media

Media is a first-class record. A MediaAsset belongs to an Item and may optionally belong to a Work record.

Capture, microscope and workshop photography all use the same ownership model; there is no special Job attachment path.

Older Item-page photo convenience structures may remain temporarily while their UI consumers are migrated, but the long-term owner is first-class MediaAsset data.

---

# Persistence

Canonical business collections are:

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

IndexedDB remains the local/offline layer. Supabase remains the cloud/auth platform and will progressively hold more queryable structured records.

Persistence code should stay boring:

**load → migrate → normalise → reconcile → validate → save**

Cloud revision protection uses compare-and-swap semantics so stale devices fail rather than silently overwrite newer state.

Large operational collections may move from the current synced state document to structured Supabase tables later. That is a persistence change beneath Core, not a new Core generation.

---

# Compatibility boundary

Foundation Lock removed the legacy Job architecture from normal runtime.

The active runtime does not read or write `state.jobs` and does not use a Job `currentId`.

Retired active concepts include:

- Job as permanent identity
- Job mirroring
- legacy/specialist Job IDs
- `workRecords`
- top-level `partsStock` / `tools`
- `partFitEvidence`
- `referenceFacts` / `referenceDocuments`
- `purchaseReview`
- `workshopAssets`

An explicit persistence boundary may name retired fields only to reject or strip them safely. A Job-only legacy state must never be silently discarded.

Some Item pages still consume convenience property names such as `passport`, `business`, `offers`, `channel` and `watchName`. While those consumers are migrated, these names are exposed as **non-enumerable compatibility views** over canonical Item ownership and are removed before persistence. They are not a second data model.

---

# Work Templates

Current stage paths are the basis for the next workshop hardening step.

Future Work Templates must be versioned and retained on completed Work so historical service records remain understandable after templates evolve.

Task semantics should support:

**Done · Skipped · Blocked**

Templates may define required/optional steps and required Final QC evidence, but should not make routine bench work bureaucratic.

---

# Public catalogue and commerce

The public catalogue is a projection of canonical Item data, not a separate CMS truth source.

Target commerce flow:

**Item → publish → Square checkout → verified webhook → Sold → ledger/history → customer confirmation**

A browser redirect is never authoritative evidence of payment. Payment state must come from verified server-side Square events.

---

# UI system

The visual direction remains quiet sage + graphite: modern, restrained and instrument-like.

Rules:

- design tokens live in shared CSS
- runtime JavaScript must not introduce a competing palette
- Workstation uses tighter rows, tables, panes and sticky context
- Touch uses stacked content, larger targets and fewer simultaneous controls
- breadcrumbs show context
- avoid giant cards for every piece of information

Reusable component styling should migrate into shared CSS once a component stabilises.

---

# Non-negotiable rules

1. One physical object gets one permanent Item identity.
2. Work never becomes the permanent identity of an Item.
3. Passport belongs to the Item, not a single service.
4. Watch-only fields do not pollute generic Item workflows.
5. Shared financial logic works across resale categories.
6. Media references Item and optional Work directly.
7. Research claims remain evidence-aware and reviewable.
8. Offline use remains first-class.
9. No new active feature may depend on the legacy Job model or retired runtime aliases.
10. Adding a feature does not automatically add a navigation destination.
11. Important objects and commands must be quick to find.
12. Calibre may learn from confirmed bench and sales evidence without overwriting provenance.
13. Persistence changes must not require another product-level architecture rewrite.
14. Data loss must fail loudly rather than happen silently.

---

# Current implementation direction

Architecture design is no longer the main task. Current implementation priorities are:

1. finish Foundation Lock consumer cleanup and browser-level regression coverage
2. prove one real Item end-to-end
3. version Work Templates and strengthen Final QC
4. build Acquisition Engine
5. complete canonical Listing Engine and commerce automation
6. make inventory/finance transactional and reconcilable
7. progressively normalize persistence beneath the existing Core
8. expand customer outputs and controlled learning
9. validate physical hardware workflows with real devices

See [`STATUS.md`](STATUS.md) for what is shipped and [`ROADMAP.md`](ROADMAP.md) for future work.
