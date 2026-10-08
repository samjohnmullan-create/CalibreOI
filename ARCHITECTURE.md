# Calibre & Co. — Architecture

_Last revised: 9 October 2026_

## Product definition

Calibre is no longer only a watchmaking job-card application.

It is an item lifecycle system for watches, jewellery, accessories, clocks, collectibles and other small resale items, with an advanced watchmaking layer for watches and clocks.

The broad lifecycle is:

**Acquire → Identify → Inspect → Research → Prepare / Service → Value → List → Sell → Preserve history**

Watch-capable items additionally support:

**Diagnose → Service → Parts → Time → Final QC → Watch Passport**

---

# Core architectural rule

## Item is the permanent centre of the system

An **Item** is the physical thing being owned, researched, restored, serviced, listed or sold.

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
- small antique or collectible

The Item survives every workflow performed on it.

## Work records activity, not identity

A **Work record** describes something done to an Item.

Examples:
- full watch service
- regulation
- inspection
- cleaning
- jewellery preparation
- restoration
- photography preparation
- listing preparation

An Item may have no Work records, one Work record or many Work records over its lifetime.

A traditional watch Job Card becomes one specialised kind of Work record rather than the permanent identity of the watch.

---

# Canonical object model

```text
item
├── id
├── type
├── title
├── status
├── identity
├── condition
├── research[]
├── mediaAssets[]
├── commercial
├── sale
├── workIds[]
├── tags[]
├── notes
└── watch?                  # watch/clock extension only
    ├── passport
    ├── movement
    ├── timingHistory[]
    ├── serviceHistory[]
    └── publicPassport

work
├── id
├── itemId
├── number
├── type
├── status
├── diagnosis
├── faults[]
├── diagnosticFaults[]
├── stages[]
├── parts[]
├── labour
├── timingRuns[]
├── repairPerformed
├── decision
└── finalQC

inventory
├── parts[]
├── tools[]
├── consumables[]
└── donor relationships

knowledge
├── research evidence
├── source records
├── movement/calibre knowledge
├── compatibility evidence
├── repair outcomes
└── identification evidence
```

---

# Item types

Initial canonical types:

- `watch`
- `clock`
- `jewellery`
- `accessory`
- `collectible`
- `other`

The type controls which specialist tools and tabs become available.

A watch should never be forced through a generic-only workflow, and a brooch should never be forced through a watch Job Card.

---

# Shared Item data

Every saleable Item can share:

## Identity
- maker / brand
- model / title
- country
- era / year
- materials
- marks / hallmarks / signatures
- reference / serial where applicable
- dimensions
- weight
- research notes

## Condition
- as acquired
- faults / defects
- cleaning or restoration needs
- final condition

## Commercial record
- purchase price
- buyer premium
- postage
- preparation cost
- repair cost
- parts
- consumables
- external work
- labour value
- target sale
- minimum sale
- actual sale
- marketplace fees
- buyer shipping
- source
- sale channel
- dates

## Media
- intake/original photos
- identity/evidence photos
- preparation/restoration photos
- listing photos
- documents

## Sale
- listing title
- description
- listing photo pack
- channel
- asking price
- offers
- sold result

---

# Watch extension

Watch and clock Items unlock the specialist horology layer.

## Passport
Permanent watch identity and history:
- maker
- model
- reference
- serial
- calibre
- calibre family
- movement maker
- jewels
- escapement
- beat rate
- case material
- dimensions
- hallmarks
- provenance
- evidence and confidence

## Work / Service Job
A service job records:
- intake
- pre-service timing
- diagnosis
- dismantling
- cleaning
- repair / replacement parts
- lubrication and reassembly
- train / escapement
- balance / beat
- casing
- regulation
- final QC

The Passport belongs to the Item, not to a single service job.

## Timing
Timing runs belong to a Work record while also contributing to the permanent watch history.

## Parts compatibility
Compatibility evidence belongs to the Knowledge layer and references:
- target Item / calibre
- source stock or donor
- part
- result: verified / used / ruled out
- bench notes

---

# Navigation architecture

## Primary navigation

Target labels:

**Home · Items · Workbench · Business · Calibre**

### Home
What needs attention now?

### Items
Everything owned, incoming, retained, listed or sold.

Expected filters:
- All
- Watches
- Jewellery
- Accessories
- Collectibles
- Donors / spares
- Sold

Tools and loose parts remain inventory resources, not sale Items unless deliberately converted into an Item.

### Workbench
Active work.

The contextual tabs depend on Item type.

### Business
Portfolio-level financial and sourcing intelligence across all Items.

### Calibre
Assistant, inbound automation, activity and system controls.

---

# Contextual tabs

## Watch / clock Item

Target direction:

**Service · Passport · Timing · Parts · Costs · Sale · Record**

- **Service** — diagnosis, stages, repair and final QC
- **Passport** — permanent watch identity and research
- **Timing** — timegrapher and timing history
- **Parts** — parts required, stock and donors
- **Costs** — acquisition and work economics for this Item
- **Sale** — listing preparation and sale workflow
- **Record** — permanent history, documents, photos and completed work

During migration the existing Summary and Documents pages may remain separate until Record can safely replace them.

## Jewellery / accessory / collectible Item

Target direction:

**Identity · Condition · Research · Prep · Costs · Sale · Record**

Specialist fields may be introduced by category, for example hallmark/material fields for jewellery.

---

# Calibre system tabs

Target labels:

**Assistant · Inbox · Activity · Settings**

- **Assistant** — research, interpretation and decision support
- **Inbox** — pushed job cards, purchases, email-derived intake, arrivals and external handoff
- **Activity** — meaningful system/import/sync events
- **Settings** — account, cloud, backup, theme and system configuration

---

# Business intelligence

Business analytics must operate across all resale Items, not watches only.

Useful outputs include:
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
- watches vs jewellery vs accessories performance

Tool costs and stock/inventory costs remain separate from Item profitability unless explicitly allocated.

---

# Storage model

## Current reality

The existing application is job-first and stores watch identity, commercial data, timing and work data together in legacy Job records.

The current cloud model synchronises a large state document for simplicity and offline reliability.

## Migration rule

Do **not** perform a destructive migration.

The migration must be progressive and reversible.

### Stage A — compatibility layer

- introduce canonical Item definitions
- derive Item views from existing watch Jobs
- continue writing existing Job records
- do not break existing job cards or cloud state

### Stage B — first-class Items

- add `state.items[]`
- allow non-watch Items to be created directly
- link existing watch Jobs to stable `itemId`
- existing Job remains valid work data

### Stage C — separate Work records

- new watch service jobs reference `itemId`
- move permanent Passport identity to Item
- preserve legacy reads during transition

### Stage D — structured cloud tables

When justified by scale and stability, move from one large state payload toward relational records such as:

```text
items
work
passports
commercial_records
media_assets
timing_runs
parts
compatibility_evidence
incoming
```

IndexedDB remains the local/offline cache.

---

# Current compatibility implementation

`js/item-model.js` is the first non-destructive architecture layer.

It provides:
- canonical Item types
- canonical Item statuses
- common commercial and identity shapes
- watch extension shape
- `legacyJobToItem()`
- `legacyJobToWork()`
- `allItems(state)` for combining future Items with legacy watch Jobs

This file intentionally does not alter existing storage yet.

---

# Immediate implementation order

1. Establish Item model and migration contract without changing existing Job storage.
2. Rename top-level UI concepts to Item-first language where safe.
3. Expand the existing Collection screen into Items and support non-watch sale records.
4. Add stable `itemId` links to watch Jobs.
5. Create non-watch Item creation/edit workflow.
6. Make Business analytics consume Items plus legacy watch-derived Items.
7. Separate permanent watch Passport from service Job data.
8. Introduce reusable Work records for service, cleaning, restoration and preparation.
9. Consolidate Summary/Documents into Record after the underlying model is stable.
10. Only then consider relational cloud-table migration.

---

# Non-negotiable rules

1. Existing watch data must remain readable throughout migration.
2. A physical Item gets one permanent identity.
3. Work records never become the permanent identity of the Item.
4. Watch-only fields must not pollute jewellery/general Item workflows.
5. Shared financial logic should work across every resale category.
6. Media assets should reference Items and Work rather than be duplicated.
7. Research claims remain evidence-aware and reviewable.
8. Offline use remains a first-class requirement.
9. No destructive data migration without backup and rollback.
10. Calibre should learn from confirmed bench and sales evidence over time.
