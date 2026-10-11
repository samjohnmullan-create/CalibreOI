# Foundation Lock

Foundation Lock is the stabilisation phase between Calibre’s legacy cutover and the next major intelligence features.

The goal is not to redesign the app. The goal is to make persistence, ownership and runtime boundaries explicit enough that future features can build on them without creating another parallel architecture.

## Canonical Core contract

`js/core.js` is the domain contract.

Canonical top-level Core fields are:

- `schemaVersion`
- `currentItemId`
- `currentWorkId`
- `items`
- `work`
- `mediaAssets`
- `inventory`
- `compatibilityEvidence`
- `incoming`
- `knowledge`
- `settings`
- `updatedAt`

Unknown top-level Core fields are rejected. Persisted-shape changes require a schema version change and a forward migration.

## Transitional store boundary

The local/cloud store currently preserves additional collections that predate or sit beside the strict Core contract. They are live data and must not be deleted merely because they are not yet represented by `js/core.js`.

Current transitional collections are:

- `workRecords` — active store name for canonical Work records; must converge to Core `work`
- `ledger` — business cash events; ownership/model must be resolved before migration
- `tools` — currently separate from canonical `inventory.tools`
- `partsStock` — currently separate from canonical `inventory.parts`
- `purchaseReview` — review/intake workflow state; determine whether derived, Incoming-owned or specialist state
- `partFitEvidence` — bench compatibility evidence; migrate deliberately to canonical compatibility evidence without losing verdict semantics
- `referenceFacts` — sourced external compatibility/reference evidence; determine production Knowledge/Compatibility ownership
- `referenceDocuments` — technical source-document index; determine Knowledge ownership

These fields are **migration debt, not a licence to add more top-level buckets**.

## Rules during Foundation Lock

1. Do not add a new top-level persisted collection without updating the Core contract and migration plan.
2. Do not remove or rename a transitional collection without a tested forward migration.
3. Do not merge bench-verified fit evidence with external reference claims. Provenance and evidence type must survive migration.
4. Do not copy full Knowledge records into Items. Items should reference shared knowledge.
5. Keep derived dashboards and summaries derived.
6. Keep page/UI state out of Core unless it is genuinely durable domain data.
7. External backend column names can remain transitional until a database migration; they must not define the internal domain model.
8. Backup/archive compatibility may preserve legacy shapes, but active runtime code must not depend on them.

## Planned convergence

Foundation Lock should proceed in small migrations:

### FL-1 — document and guard
- update roadmap terminology
- document the canonical/transitional boundary
- add regression protection so transitional debt cannot grow silently

### FL-2 — Work/store convergence
- make store persistence use canonical `work`
- retain a forward migration from existing `workRecords`
- update selectors/callers deliberately

### FL-3 — Inventory convergence
- move loose parts/tools/consumables/donors under `inventory`
- migrate `partsStock` and `tools`
- preserve IDs and compatibility evidence links

### FL-4 — Evidence/Knowledge convergence
- map bench fit evidence and sourced reference evidence into explicit canonical evidence/knowledge records
- preserve source document IDs, URLs, confidence and bench verdicts

### FL-5 — Business/intake ownership
- resolve `ledger` and `purchaseReview`
- keep Available Cash based on actual ledger money
- avoid duplicating commercial totals onto multiple records

### FL-6 — runtime/design cleanup
- move reusable styling out of runtime JavaScript
- retire duplicate/obsolete active pages and aliases only after route usage is audited
- update architecture/tests/docs to the final persisted contract

## Exit criteria

Foundation Lock is complete when:

- local/cloud persisted state has one documented schema contract
- all live top-level collections are intentional Core fields or clearly isolated non-Core storage
- every old persisted shape has an explicit forward migration
- no active feature requires retired Job architecture
- Parts, Reference Intelligence and Knowledge use one evidence/provenance model without losing distinctions
- store code loads/migrates/validates/saves rather than carrying business logic
- architecture documents describe the runtime that actually ships
