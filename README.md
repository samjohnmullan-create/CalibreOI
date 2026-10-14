# Calibre & Co.

Calibre is an intelligent item-lifecycle and workshop operating system for watches, clocks, jewellery, accessories, collectibles and other small resale items.

The broad lifecycle is:

**Acquire → Identify → Research → Inspect → Work → Document → Value → List → Sell → Preserve**

Watch and clock Items unlock a deeper horology workflow:

**Diagnose → Service → Parts → Measure → Time → Final QC → Passport**

## Core model

**Item is permanent. Work is activity.**

An **Item** is the physical object and remains the same record through acquisition, research, service, listing, sale and later history.

A **Work** record describes a bounded activity performed on an Item. One Item may have no Work records, one Work record or many Work records over its lifetime.

Media, Inventory, Knowledge, Incoming and Ledger are first-class parts of the same Core. There is no active architectural role for the old Job object.

The executable domain contract lives in [`js/core.js`](js/core.js). Persisted-shape changes use forward `schemaVersion` migrations rather than parallel Core generations.

## Current product structure

Calibre has exactly five primary destinations:

**Home · Items · Workbench · Business · Calibre**

- **Home** — attention and next actions
- **Items** — everything physical owned or previously owned
- **Workbench** — active and deliberately queued Work
- **Business** — portfolio finance, sourcing and sales intelligence
- **Calibre** — Assistant, Capture, Knowledge, Inbox and Settings

New capabilities attach beneath these destinations rather than creating more top-level navigation.

## Repo-confirmed capabilities

Current `main` includes:

- canonical Item + Work runtime
- watch, clock and general-item lifecycle support
- Workbench queues and specialist repair workflows
- Passport / identity records with evidence and confidence
- Capture Station and first-class Item/Work media
- diagnostic, parts and donor intelligence
- full-catalogue Movement Finder with offline fallback
- normalized Knowledge Engine, Reference Library and Research Inbox
- bench measurements and timing-run history
- AudioWorklet Timegrapher foundation
- global search / command layer
- device modes for workstation, touch and capture use
- QR / workshop identity foundations
- Business Brain prioritisation and profitability analysis
- public catalogue and public Watch Passport pages
- Square Payment Link support
- local-first IndexedDB storage with Supabase cloud sync
- atomic cloud conflict protection, safety snapshots and portable backup
- test-gated internal and public deployments

See [`STATUS.md`](STATUS.md) for the current repo-confirmed state. A feature is treated as shipped there only when it is present on `main` and the test suite is green.

## Compatibility boundary

Foundation Lock removed the legacy Job architecture from normal runtime.

A small number of Item pages still use compatibility property names such as `passport` and `business` while those pages are migrated to direct canonical ownership. These are exposed as **non-enumerable, non-persisted views** over canonical Item fields. Persisted state remains canonical.

Legacy shapes may be handled only at explicit migration, import or archive boundaries.

## Platform direction

The intended platform split is:

- **private Calibre app** — workshop and item-management application
- **Supabase** — authentication, cloud state today and progressively more queryable structured records
- **IndexedDB** — offline/local-first cache and working state
- **Calibre public site** — catalogue and public Watch Passport presentation
- **Square** — checkout/payment path
- **Resend** — transactional email
- **GitHub** — source, CI and deployment history

The Core contract should remain stable while persistence becomes more structured underneath it.

## Current priority

The project is no longer in an architecture-design phase. The priority is now to **stabilise, prove the end-to-end workflow, then expand the business engine**.

Current order:

1. finish Foundation Lock / documentation reconciliation
2. run a real Item end-to-end acceptance journey
3. complete versioned Work Templates and Final QC rules
4. build the Acquisition Engine
5. complete canonical Listing Engine and commerce automation
6. improve operational inventory and finance reconciliation
7. progressively normalize persistence beneath the existing Core
8. expand customer outputs and controlled learning
9. validate hardware workflows, especially the USB Timegrapher microphone and printing bridge

See [`ROADMAP.md`](ROADMAP.md) for future work and [`ARCHITECTURE.md`](ARCHITECTURE.md) for the stable system rules.
