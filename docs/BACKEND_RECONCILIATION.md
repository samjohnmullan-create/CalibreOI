# Calibre backend reconciliation

_Last reviewed: 15 October 2026_

## Why this exists

Calibre currently has two Supabase projects with different responsibilities. This split was not represented clearly in the repository and must be resolved before the structured v2 database is wired into normal app UI.

## Current reality

### Existing app project — `Calibre Project`

Project ref: `jdeqnboljrgrpnvkfthx`

This is the backend the shipped browser app currently uses through `js/cloud.js`.

It owns the current browser-facing identity and compatibility layer, including:

- Supabase Auth used by the deployed app
- `calibre_state` synced state document and atomic revision guard
- `calibre_inbox`
- current Knowledge database used by Movement Finder / Parts intelligence
- research request/media infrastructure
- public catalogue and public-watch media infrastructure
- current app session persistence

The browser's existing authenticated session belongs to this project.

### Structured project — `Calibre v2`

Project ref: `zmhbrqkzvgajmvhhorba`

This project contains the newer normalized operational model, including:

- workspace and membership model
- Items, identity, facts and Passports
- Work records, events, templates, checklist/QC and bench sessions
- media assets and Work-step media links
- Parts, fit evidence, donor compatibility and part-needs workflow
- measurements and timing runs
- purchases, invoice intake, receiving and storage movement
- costs, valuations, sales and offers
- business ledger and summary views
- safe inventory archive/restore
- audit and hardening migrations

At the time of this review it contains 15 Items and 2 Work records.

## Critical rule

**Do not change `SUPABASE_URL` in `js/cloud.js` from the existing app project to Calibre v2 as a shortcut.**

Doing so would change the Auth authority and disconnect the browser from the existing synced state, Knowledge tables, inbox, public catalogue and existing session. The v2 project also does not currently contain `calibre_state` or the existing Knowledge tables expected by the shipped browser runtime.

## Consolidation decision

Use the **existing app project** (`jdeqnboljrgrpnvkfthx`) as the long-term Calibre backend and migrate the normalized v2 operational schema into it.

Reasons:

1. It preserves the existing login/session and avoids an Auth cutover.
2. It preserves the current synced state and conflict-protection path during migration.
3. It preserves current Knowledge, research/media and public catalogue integrations.
4. The existing app project currently has no naming collisions for the major v2 operational tables (`workspaces`, `items`, `work_records`, `work_sessions`, `parts`, `tools`, `consumables`, `business_ledger_entries`, `purchases`, `media_assets`, etc.).
5. The v2 migration chain is structured and can be replayed/audited rather than recreating its schema by hand.

Calibre v2 remains the reference/staging source until the consolidation has been validated.

## Migration sequence

### Gate A — capture and review

- preserve the v2 migration chain in source control
- generate/pin database types for the target schema
- inventory existing app-project policies/buckets/functions that could be affected by broad grants/revokes
- review every migration that changes global `public` privileges or Storage policies before applying it to the existing project
- do not treat a successful SQL execution as sufficient proof

### Gate B — schema on the existing project

Replay/adapt the v2 schema into the existing app project in controlled batches:

1. core workspace / Item / identity / Passport foundation
2. Work / Media / Research
3. Parts / measurements / timing / commerce foundations
4. RLS and privileges, adapted so existing Calibre tables remain functional
5. later parts, purchase, receiving, storage, QC, Work-session, archive and ledger migrations

Important: the original v2 `004_rls_and_privileges` migration contains broad `revoke all on all tables in schema public from anon` behaviour. That is safe in the isolated v2 project but **must not be replayed blindly** into the existing app project because it also contains public catalogue and other established tables. Privileges must be narrowed to the new structured tables.

### Gate C — identity/workspace bootstrap

- create one workspace owned by the existing authenticated Calibre user
- add the owner membership
- confirm RLS using the existing app login
- prove read/write access from a temporary browser integration before changing normal app code

### Gate D — data transfer

Copy structured operational records from Calibre v2 into the new tables on the existing project while preserving relationships and provenance.

Start with:

- workspace-scoped lookup/source/storage data
- Items / identity / Passport/facts
- Work and Work evidence
- Parts/tools/consumables
- purchases/invoices/receiving/storage history
- costs/valuations/sales/ledger

Record old→new IDs when user IDs/workspace IDs differ. Do not manufacture foreign keys by guessing.

The existing `calibre_state` document remains untouched during this step.

### Gate E — reconciliation

Compare:

- structured Item count and titles
- Work count/status
- Parts/tools stock
- costs and valuation totals
- purchase/invoice links
- media references
- ledger totals

No source project is deleted or mutated to "match" a failed transfer. Fix the importer/mapping and rerun safely.

### Gate F — application bridge

Only after schema + data are proven:

- add structured API helpers to the existing `supabaseClient()`
- begin dual-writing selected operations where required
- read structured records for new features such as Archive/Restore and bench sessions
- keep `calibre_state` as the compatibility/offline contract while consumers are migrated
- add browser acceptance coverage before each ownership change

### Gate G — retire the split

The separate Calibre v2 project can be considered for retirement only when:

- all required schema/migrations exist in the existing app project
- all required v2 records reconcile
- existing browser login works against structured RLS
- Archive/Restore and bench sessions work from the deployed app
- existing Knowledge, state sync, research/media and public catalogue still work
- backup/restore is proven
- acceptance tests pass on phone and DeX/workstation

## Immediate coding order after consolidation foundation

1. Archive / Restore UI for Item, Part, Tool and Consumable.
2. Active views/search/matching exclude archived records by default.
3. Explicit Archive view with restore action and reason/history.
4. Bench-session Start / Finish in Work and Workbench.
5. Labour/time summaries derived from bench sessions.
6. Real end-to-end acceptance watch.

## Safety notes

- Soft archive is the normal removal mechanism for operational inventory.
- Cancellation preserves Work history; donor/spares is a lifecycle change, not deletion.
- Financial/provenance records should not be destructively deleted merely to clean a screen.
- Existing public access must be regression-tested whenever RLS/grants are changed.
