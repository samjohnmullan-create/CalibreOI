# Foundation Lock

Foundation Lock is the stabilisation phase between Calibre’s legacy cutover and the next major intelligence features.

The goal was not to redesign the app. The goal was to make persistence, ownership and runtime boundaries explicit enough that future features can build on them without creating another parallel architecture.

## Canonical Core contract

`js/core.js` is the domain contract. Persisted data uses `schemaVersion`; the Core itself is not named by product generation.

Canonical top-level fields are:

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

Canonical `inventory` resources are:

- `parts`
- `tools`
- `consumables`
- `donors`
- `locations` — trays, drawers, bins and other physical storage locations

Unknown top-level Core fields are rejected. Persisted-shape changes require a schema version change and a forward migration.

## Migration history

- Schema 2: `workRecords` → canonical `work`.
- Schema 3: `tools` / `partsStock` → `inventory.tools` / `inventory.parts`.
- Schema 4: `partFitEvidence` → `compatibilityEvidence`; `referenceFacts` / `referenceDocuments` → typed `knowledge` records.
- Schema 5: `purchaseReview` → typed `incoming` records; `ledger` becomes an intentional durable Core collection.
- Schema 6: legacy `workshopAssets` → canonical `inventory.locations`, `inventory.tools` and `inventory.parts`; retired `donorJobId` is preserved only as a neutral `legacyWorkRef` during migration.

Legacy field names remain only inside forward-migration and archive/import boundaries. Active runtime features read and write canonical collections directly.

## Evidence rules

1. Bench evidence and external reference evidence remain different record classes.
2. `recordType: bench-fit` with `evidenceClass: bench` represents workshop-confirmed compatibility evidence.
3. `recordType: reference-fact` with `evidenceClass: external` represents sourced claims.
4. `recordType: reference-document` with `evidenceClass: source-document` represents technical/reference source documents.
5. Family membership and dimensional similarity remain candidate evidence, not proof of interchangeability.
6. Provenance, source URLs, document IDs, confidence and bench verdicts must survive migrations.

## Completed convergence

### FL-1 — document and guard — COMPLETE
- canonical/transitional boundary documented
- regression protection added

### FL-2 — Work/store convergence — COMPLETE
- canonical `work` owns runtime Work persistence
- `workRecords` retired from active runtime

### FL-3 — Inventory convergence — COMPLETE
- parts, tools, consumables and donors live under canonical `inventory`
- cloud reconciliation merges inventory resources independently

### FL-4 — Evidence/Knowledge convergence — COMPLETE
- bench fit history lives under `compatibilityEvidence`
- sourced reference facts and technical documents live under typed `knowledge`
- bench and external evidence remain explicitly distinguishable

### FL-5 — Business/intake ownership — COMPLETE
- `ledger` is an intentional Core collection
- purchase suggestions live in `incoming` as `purchase-review` records
- Available Cash remains based only on actual ledger movements
- cloud reconciliation merges ledger entries and Incoming records independently

### FL-6 — runtime/design cleanup — COMPLETE
- active Parts code reads `inventory.parts` directly
- active Tools UI reads `inventory.tools` directly
- Workshop IDs use `inventory.locations`, `inventory.tools` and `inventory.parts` directly
- bench fit history reads/writes `compatibilityEvidence` directly
- Reference Intelligence, imports and Reference Library read/write typed `knowledge` records directly
- Incoming review UI reads typed `incoming` records directly
- temporary runtime compatibility aliases/proxies removed from the store
- hidden `workshopAssets` side-state retired through schema 6
- architecture terminology aligned to one Core + schema versions
- regression tests now assert canonical runtime ownership rather than compatibility aliases

## Rules after Foundation Lock

1. Do not add a new top-level persisted collection without updating `js/core.js` and the migration plan.
2. Do not reintroduce retired runtime aliases to make a feature convenient.
3. Keep derived dashboards and summaries derived.
4. Keep page/UI state out of Core unless it is genuinely durable domain data.
5. Keep storage code focused on load, migrate, normalise, merge and save.
6. Keep specialist business logic in domain modules, not the store.
7. Keep legacy archive/import support isolated from normal runtime.

## Exit state

Foundation Lock is complete: local/cloud persisted state has one documented schema contract, current runtime features use canonical owners directly, historical shapes have explicit forward migrations, and no active feature requires the retired Job architecture.

The next architecture work should focus on reliability and Knowledge Engine integration rather than further persistence restructuring.
