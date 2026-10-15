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

## Checkpoint 3 — acquisition / receiving / finance foundation

**Status: complete and reconciled for current structured data**

Migration applied:

- `006_commercial_purchase_finance_foundation`

### Schema now present on the target

- acquisition_invoices
- acquisition_invoice_lines
- purchases
- purchase_lots
- purchase_item_links
- purchase_item_cost_links
- purchase_stock_links
- purchase_receiving_exceptions
- storage_location_events
- cost_entries
- valuations
- sales
- business_ledger_entries

The commercial tables use workspace-scoped RLS and explicit authenticated grants. The original broad v2 privilege migration was not replayed.

Two canonical acquisition-source rows used by Purchase history were also transferred so purchase provenance is preserved:

- Hannams Auctioneers
- Gowans Auctions

### Commercial reconciliation

Counts now match exactly between `Calibre v2` and the consolidated target:

| Record | Source v2 | Target | Result |
| --- | ---: | ---: | --- |
| Acquisition invoices | 9 | 9 | Match |
| Acquisition invoice lines | 29 | 29 | Match |
| Purchases | 5 | 5 | Match |
| Purchase lots | 21 | 21 | Match |
| Purchase → Item links | 14 | 14 | Match |
| Purchase item cost links | 32 | 32 | Match |
| Purchase stock links | 0 | 0 | Match |
| Receiving exceptions | 0 | 0 | Match |
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

The cost allocation graph was preserved rather than flattened. Purchase cost, buyer premium, postage and unclassified invoice charges remain separate cost entries and are linked back to the relevant Purchase/lot/Item where v2 had that evidence.

Original purchase statuses and reconciliation notes were retained, including small invoice-total discrepancies rather than silently correcting source documents.

### Invoice-storage boundary

Invoice metadata is consolidated, but the actual invoice files still physically live in the v2 Storage project. Their original storage paths and file hashes were retained for reconciliation. File bytes have **not** yet been copied to target Storage.

The very large raw invoice `extraction_payload` JSON blobs were also left in v2 for this checkpoint. The target retains the structured invoice lines and all core invoice metadata. This avoids mangling large historical extraction blobs during the cross-project move while the source remains intact.

A later storage bridge/copy step must either:

1. copy the invoice files and any required raw extraction payloads into the target, or
2. explicitly mark those historical fields as source-only archival evidence before v2 can be retired.

### Security check

Supabase Security Advisor was run after the commercial migration and reported no new findings caused by the new commercial tables. Remaining warnings are unchanged:

- legacy `calibre_sync_legacy_job_changes_to_items` has a mutable `search_path`
- existing `resolve_research_media_grant` is a public/authenticated `SECURITY DEFINER` RPC by design and requires separate review
- leaked-password protection is disabled in Auth

Reference remediation pages:

- https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable
- https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable
- https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

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

1. Port safe Archive / Restore RPCs to the consolidated target.
2. Port the remaining receiving / stock / allocation helper RPCs actually required by current UI flows.
3. Reconcile archive behavior and active-record filtering.
4. Bridge/copy invoice Storage before v2 retirement.
5. Add the application bridge for structured reads/writes.
6. Begin Bench Mode, Archive/Restore and bench-session UI after those checks pass.
