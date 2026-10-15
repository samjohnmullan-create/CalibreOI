# Calibre backend reconciliation — progress

_Last updated: 15 October 2026_

This file records live consolidation checkpoints while the separate `Calibre v2` project is being folded into the existing Calibre backend.

## Checkpoint 1 — structured Item / workshop foundation

**Status: complete and reconciled**

Target backend: existing Calibre project used by the deployed app.

### Schema now present on the target

- workspaces / workspace_members
- storage_locations / sources
- items / item_identity
- passports
- item_facts / item_fact_sources
- work_templates / work_template_steps
- work_records / work_events
- work_checklist_steps
- work_qc_checks
- measurements
- timing_runs
- work_sessions

All 18 structured tables in this checkpoint have RLS enabled. The target currently has 70 policies across these tables.

### Target migrations applied

- `calibre_structured_workspace_foundation`
- `calibre_structured_item_foundation`
- `003_workshop_core_timing_sessions`
- `004_seed_core_work_templates`

The original broad v2 privilege migration was **not** replayed. Grants/RLS were scoped only to the new structured tables so the existing state, Knowledge, research and public catalogue systems remain untouched.

### Workspace bootstrap

The existing Calibre authenticated account now owns the consolidated workspace and has an owner membership. No Auth cutover was performed.

### Seeded Work templates

- Mechanical Watch Service v1 — 10 template steps
- Inspection / Assessment v1 — 6 template steps

These are target-side templates for future Work. Historical v2 checklist snapshots were transferred independently so their evidence does not depend on newly generated template IDs.

## Data reconciliation

Counts now match exactly between `Calibre v2` and the consolidated target for this slice:

| Record | Source v2 | Target | Result |
| --- | ---: | ---: | --- |
| Items | 15 | 15 | Match |
| Item identities | 15 | 15 | Match |
| Passports | 13 | 13 | Match |
| Item facts | 22 | 22 | Match |
| Work records | 2 | 2 | Match |
| Work checklist steps | 16 | 16 | Match |
| Work events | 5 | 5 | Match |
| Work sessions | 0 | 0 | Match |
| Timing runs | 0 | 0 | Match |
| Measurements | 0 | 0 | Match |

Existing source record IDs were preserved where possible. Workspace/user ownership was remapped to the existing Calibre account rather than copying foreign Auth IDs.

### Historical Work preserved

- Work #1 — Oris inspection and service assessment — `cancelled`
- Work #2 — Waltham Mechanical service — `queued`

The Waltham's 16 historical checklist snapshots and five Work events were preserved. Historical checklist rows are intentionally not rebound to newly seeded template IDs.

## Checkpoint 2 — Parts / tools / consumables foundation

**Status: complete for current live data**

### Schema now present on the target

- parts
- tools
- consumables
- work_part_needs

All four tables use workspace-scoped RLS and explicit authenticated grants. The tables include archive fields needed by the planned Archive / Trash UI.

Migration applied:

- `005_inventory_parts_tools_foundation`

The `parts.knowledge_part_ref_id` column is retained as a bridge field but deliberately has no FK. The consolidated backend's authoritative Knowledge system remains the existing `calibre_kb_*` model, so v2's separate `knowledge_part_refs` table was not recreated merely to satisfy an old foreign key.

### Inventory reconciliation

Current live v2 data for this slice is intentionally small:

| Record | Source v2 | Target | Result |
| --- | ---: | ---: | --- |
| Parts | 1 | 1 | Match |
| Work part needs | 1 | 1 | Match |
| Tools | 0 | 0 | Match |
| Consumables | 0 | 0 | Match |

## Checkpoint 3 — acquisition / receiving / finance foundation

**Status: complete and reconciled for current structured data**

Migration applied:

- `006_commercial_purchase_finance_foundation`

### Commercial reconciliation

| Record | Source v2 | Target | Result |
| --- | ---: | ---: | --- |
| Acquisition invoices | 9 | 9 | Match |
| Acquisition invoice lines | 29 | 29 | Match |
| Purchases | 5 | 5 | Match |
| Purchase lots | 21 | 21 | Match |
| Purchase → Item links | 14 | 14 | Match |
| Purchase item cost links | 32 | 32 | Match |
| Storage movement events | 4 | 4 | Match |
| Cost entries | 33 | 33 | Match |
| Valuations | 3 | 3 | Match |
| Sales | 0 | 0 | Match |
| Business ledger entries | 0 | 0 | Match |

Financial aggregates also reconcile exactly:

| Aggregate | Source v2 | Target | Result |
| --- | ---: | ---: | --- |
| Purchase total (AUD) | $1,471.59 | $1,471.59 | Match |
| Allocated purchase cost (AUD) | $722.99 | $722.99 | Match |
| Allocated shared cost (AUD) | $249.06 | $249.06 | Match |
| Cost-entry total (AUD) | $984.05 | $984.05 | Match |

### Invoice-storage boundary

Invoice metadata is consolidated, but the actual invoice files still physically live in the v2 Storage project. The large historical raw extraction payloads also remain source-side for now. v2 must remain intact until that storage boundary is explicitly resolved.

## Checkpoint 4 — safe inventory Archive / Restore RPCs

**Status: complete at backend level**

Migration applied:

- `007_safe_inventory_archive_restore`

Items, Parts, Tools and Consumables can now be soft archived/restored through authenticated `SECURITY INVOKER` RPCs. Archive history is retained and no live inventory was archived during installation.

## Checkpoint 5 — application bridge + first Bench Mode slice

**Status: first browser bridge implemented on PR branch**

New browser module:

- `js/structured-cloud.js`

The bridge deliberately overlays structured records onto the existing app state instead of replacing the legacy/cloud-state document wholesale. Structured records are authoritative where the same IDs exist; unmatched legacy records remain visible so the transition does not make non-migrated records disappear.

### Workbench bridge

`workbench.html` now:

- loads the existing app state first
- overlays structured Item / Work data from the consolidated backend
- marks structured Work cards visibly
- writes Queue / On bench / Waiting / Priority changes directly to structured `work_records`
- keeps legacy Work actions on the existing `saveState` path
- never persists the structured overlay back into `calibre_state`
- routes structured Work to `bench.html` rather than legacy `work.html`

The overlay currently pulls structured Items, identity, Work, checklist steps, part needs, costs, valuations and bench sessions. Costs and valuation are projected into the existing Workbench card model so the current UI can show invested/target/potential values during the transition.

### First Bench Mode

New page:

- `bench.html`

Live structured actions implemented:

- Start Bench Session
- Finish Bench Session with optional note
- live session elapsed-time display
- current checklist step
- next checklist step
- mark checklist step Done
- add/update Work note
- record/clear a Work problem/blocker
- add a numeric measurement with unit
- surface open Part Needs
- show recent measurements
- show recent timing results already stored against the Work

The first Bench Mode intentionally keeps Photo, Part Finder and full Timegrapher integration as follow-on bridges rather than pretending the existing legacy-context tools are already structured-aware.

### Safety boundary retained

The existing `calibre_state`, browser Auth/session, Knowledge/Movement Finder, research/media and public catalogue paths remain in place. The bridge is additive and reversible.

## Current next work

1. Make Capture Station structured-Work aware and wire the Bench Photo quick action.
2. Wire Part / Donor Finder into Bench context.
3. Bridge the existing Timegrapher to structured Work and write full timing runs directly to `timing_runs`.
4. Expose Archive / Restore in Item and inventory UI.
5. Add active exception rules to Bench Mode.
6. Complete invoice Storage migration before retiring v2.
7. Run real-device acceptance on Samsung phone + DeX using a physical watch.
