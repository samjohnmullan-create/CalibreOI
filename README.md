# Calibre & Co.

Calibre is an intelligent item lifecycle and watchmaker's workbench application for watches, jewellery, accessories, clocks, collectibles and other small resale items.

It is built around the broad lifecycle:

**Acquire → Identify → Inspect → Research → Prepare / Service → Value → List → Sell → Preserve history**

Watch and clock Items unlock a deeper horology workflow:

**Diagnose → Service → Parts → Time → Final QC → Watch Passport**

## Product principle

The **Item** is the permanent centre of the system. A physical item keeps one identity throughout acquisition, research, restoration/service, sale and later history.

A **Work record** describes something done to that Item. A traditional watch Job Card is therefore one specialised Work record rather than the permanent identity of the watch.

For watches, the Passport remains the permanent watch identity/history layer and service Jobs describe work performed on it.

See [`ARCHITECTURE.md`](ARCHITECTURE.md) for the target object model and non-destructive migration plan.

## Current capabilities

- Structured watch jobs with repair-stage workflows
- Watch Passport / identity records with confidence and evidence support
- Intake faults, diagnostic notes and repair guidance
- Photos attached to jobs, stages and Passport records
- Parts and supplier tracking
- Donor and loose-parts compatibility evidence
- Business, cost, sale and profitability data
- Timing runs with rate, BPH, beat-error estimate, confidence and position metadata
- AudioWorklet-based Timegrapher with improved transient/interval analysis
- Collection/inventory views
- Incoming purchase tracking
- Tool and loose-parts libraries
- Listing photo-pack and sale handoff workflow
- Job handoff and Calibre assistant tooling
- Local/offline data with Supabase cloud sync
- Account sign-in and password-reset flow
- Approved Calibre brand system

## Architecture transition

The existing app is still largely **job-first**: a watch Job currently carries Passport, commercial, timing and work data together.

The migration is deliberately non-destructive.

The first compatibility layer is `js/item-model.js`, which introduces canonical Item types and can derive Item/Work views from existing watch Job data without rewriting the current database.

The intended progression is:

1. establish the Item model and compatibility layer
2. add first-class non-watch Items
3. link watch Jobs to stable Item IDs
4. separate permanent Item/Passport identity from Work records
5. move shared Business analytics to Item-level data
6. progressively separate structured cloud records once the model is stable

Existing watch records must remain readable throughout the transition.

## Target navigation

Primary product concepts:

**Home · Items · Workbench · Business · Calibre**

Watch/clock context:

**Service · Passport · Timing · Parts · Costs · Sale · Record**

General resale Item context:

**Identity · Condition · Research · Prep · Costs · Sale · Record**

Calibre system context:

**Assistant · Inbox · Activity · Settings**

The UI will move toward these labels progressively as the underlying pages are adapted.

## Platform direction

The `calibreco.com.au` domain expands Calibre beyond a repository-hosted PWA.

The intended platform split is:

- **`app.calibreco.com.au`** — private workshop and item-management application
- **Supabase** — accounts, structured data, relationships and permissions
- **Calibre web hosting** — web delivery plus media/document storage where technically suitable
- **Resend** — branded authentication and transactional email
- **`passport.calibreco.com.au`** — deliberate public watch-history pages
- **`calibreco.com.au`** — small public Calibre & Co. presence
- **GitHub** — source repository and application change history

Photos and documents should progressively move out of large synced state payloads into proper file storage, with Calibre storing URLs/keys and metadata rather than embedded file data.

## Active build direction

Current priority is the architecture transition while preserving the working app:

1. define and stabilise the Item/Work model
2. expand Collection into an Item-first inventory for watches and non-watch stock
3. add non-watch purchase/research/preparation/sale records
4. link legacy watch Jobs to stable Items
5. make finance/business intelligence work across all Item categories
6. continue media-storage and backup foundations
7. separate permanent Watch Passport data from service Work records
8. resume Timegrapher hardware validation when real contact-mic testing is available
9. build public Passport/domain features after the internal data model is stable

See [`ROADMAP.md`](ROADMAP.md) for the broader roadmap, [`ARCHITECTURE.md`](ARCHITECTURE.md) for the current target architecture, [`docs/PHASE-1.md`](docs/PHASE-1.md) for the established foundation and [`docs/PHASE-2.md`](docs/PHASE-2.md) for Timegrapher signal intelligence.
