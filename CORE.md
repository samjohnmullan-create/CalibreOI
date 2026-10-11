# Calibre Core

Calibre has one Core. Product generations such as "Core v2" are not part of the architecture.

Persisted data uses an explicit `schemaVersion`. When the stored shape changes, Calibre adds a forward migration. It does not create a second parallel Core model.

## Stable primitives

The Core owns only durable domain objects and references:

- Item — the physical thing
- Work — activity performed on an Item
- MediaAsset — a stored image/document belonging to an Item and optionally Work
- Inventory resources — parts, tools, consumables and donors
- Compatibility evidence
- Incoming records
- Knowledge records
- Settings

Passport, movement and permanent watch identity belong to the watch/clock Item extension. Timing performed during service belongs to Work and may contribute to permanent Item history.

## Rules that prevent another legacy system

1. **One source of truth.** Do not duplicate the same fact across Item, Work and a page-specific record.
2. **No parallel domain models.** New features extend the existing primitives or live in a clearly owned specialist module; they do not create a second Item/Work system.
3. **Schema versions, not Core generations.** Persisted changes increment `schemaVersion` and require a migration.
4. **No silent compatibility forever.** Import/conversion code is temporary tooling and is not part of the normal runtime after cutover.
5. **Derived data is derived.** Dashboards, service history summaries, totals and status groupings should be computed from canonical records rather than copied into another persistent store.
6. **References are explicit.** Work uses `itemId`; MediaAsset uses `itemId` and optional `workId`.
7. **Storage stays boring.** Persistence loads, validates, migrates and saves canonical records. Diagnosis, finance, donors, printing and UI behaviour do not become store wrappers.
8. **Navigation is not a data model.** Pages and tabs may change without forcing schema changes.
9. **Unknown top-level state is rejected.** New top-level collections require an intentional Core contract change and migration rather than becoming a junk drawer.
10. **Legacy Job fields are forbidden in canonical Core state.**

## Change process

A change to the Core contract must answer:

- Is this genuinely permanent domain data?
- Which existing object owns it?
- Can it be derived instead of stored?
- Does it create a second source of truth?
- Does the persisted shape change?
- If yes, what is the forward migration and validation test?

If those questions do not have clean answers, the feature stays outside Core until they do.
