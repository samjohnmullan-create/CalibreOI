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
- `ledger`
- `settings`
- `updatedAt`

Unknown top-level Core fields are rejected. Persisted-shape changes require a schema version change and a forward migration.

## Transitional store boundary

No live top-level business/intake side buckets remain after schema 5.

`workRecords` is no longer a live transitional collection. Schema 2 migrates it forward to canonical `work`.

`tools` and `partsStock` are no longer persisted top-level collections. Schema 3 migrates them into canonical `inventory.tools` and `inventory.parts`.

`partFitEvidence`, `referenceFacts` and `referenceDocuments` are no longer persisted top-level collections. Schema 4 migrates bench fit outcomes to canonical `compatibilityEvidence` and sourced facts/documents to typed canonical `knowledge` records.

`purchaseReview` is no longer persisted as a side bucket. Schema 5 moves purchase suggestions into canonical `incoming` records using `recordType: purchase-review`. The cash `ledger` is now an intentional durable Core collection because Available Cash and business activity depend on actual money movements rather than projections.

Temporary non-enumerable runtime compatibility views keep older Parts, Reference and purchase-review UI code functional while persistence remains canonical. Those views are migration scaffolding and should be removed during FL-6 cleanup.

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

### FL-1 — document and guard — COMPLETE
- canonical/transitional boundary documented
- regression protection added

### FL-2 — Work/store convergence — COMPLETE
- schema 2 uses canonical `work`
- `workRecords` retired

### FL-3 — Inventory convergence — COMPLETE
- schema 3 moves loose parts/tools under canonical `inventory`
- cloud reconciliation merges inventory resources independently

### FL-4 — Evidence/Knowledge convergence — COMPLETE
- schema 4 moves bench fit history into canonical `compatibilityEvidence`
- sourced reference facts and technical documents move into typed canonical `knowledge`
- bench and external evidence remain explicitly distinguishable

### FL-5 — Business/intake ownership — COMPLETE
- schema 5 makes `ledger` an intentional Core collection
- purchase suggestions move into canonical `incoming` as `purchase-review` records
- Available Cash remains based only on actual ledger movements
- cloud reconciliation merges ledger entries and Incoming records independently
- Accepted suggestions are removed from the active review queue

### FL-6 — runtime/design cleanup
- remove temporary inventory/evidence/reference/purchase-review compatibility views after active UI reads canonical collections directly
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
