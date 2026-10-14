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
| Part allocations | 0 | 0 | No transfer required |
| Part applications | 0 | 0 | No transfer required |
| Part fit evidence | 0 | 0 | No transfer required |
| Part fit verifications | 0 | 0 | No transfer required |
| Item relationships | 0 | 0 | No transfer required |

The single live Part and single open Part Need were transferred with their existing IDs preserved.

### Security check

Supabase Security Advisor was run after the inventory migration. It reported no new warnings caused by these tables. Remaining warnings are pre-existing items concerning:

- a legacy function with mutable `search_path`
- the existing research media grant `SECURITY DEFINER` function
- leaked-password protection being disabled in Auth

Those are being kept separate from the reconciliation work so unrelated security changes are not mixed into migration checkpoints.

## Safety boundary retained

The following existing systems have not been replaced or destructively modified:

- `calibre_state`
- current browser Auth/session
- Knowledge / Movement Finder tables
- research request/media infrastructure
- public catalogue/public-watch infrastructure
- current browser sync/conflict path

The separate `Calibre v2` project remains intact as the reference source.

## Next consolidation slice

1. Purchases / invoices / receiving / storage-move history.
2. Costs / valuations / sales / business ledger.
3. Safe archive/restore RPCs on the consolidated target.
4. Reconcile counts and financial totals again.
5. Add the application bridge for structured reads/writes.
6. Begin Bench Mode, Archive/Restore and bench-session UI only after that reconciliation passes.
