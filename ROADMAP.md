# Calibre & Co. — Roadmap

_Last revised: 14 October 2026_

This file contains **future work only**. Shipped capability belongs in [`STATUS.md`](STATUS.md); stable system rules belong in [`ARCHITECTURE.md`](ARCHITECTURE.md).

Calibre's governing rule remains:

**Item is permanent. Work is activity.**

The broad lifecycle is:

**Acquire → Identify → Research → Inspect → Work → Document → Value → List → Sell → Preserve**

For watches and clocks:

**Diagnose → Service → Parts → Measure → Time → QC → Passport**

---

## Phase 1 — Foundation cleanup

Goal: finish removing compatibility scaffolding without destabilising the working Core.

Remaining work:

- finish migrating consumers away from legacy convenience names such as `passport` / `business`
- keep those compatibility properties non-enumerable and non-persisted until the last consumer is migrated
- remove or archive stale unused Job-era browser modules
- audit explicit import/archive boundaries for retired Job-era data
- keep both internal and public deployments blocked on failed tests
- maintain `STATUS.md` as the repo-confirmed scoreboard
- add browser-level smoke tests for critical journeys

Exit condition: no normal-runtime Job architecture, no persisted compatibility aliases, documentation matches `main`, critical journeys have automated browser coverage.

---

## Phase 2 — Real end-to-end acceptance

Goal: prove Calibre on a real watch rather than judging the system page by page.

Run one representative watch through:

**Intake → Identity → Research → Work → Capture → Diagnosis → Parts → Repair → Timing → Final QC → Value → Listing → Publish → Sold → Passport/history**

The acceptance watch should deliberately exercise:

- queued stock versus active Work
- remove from Workbench / cancel Work
- Awaiting Parts
- donor/parts suggestions and actual fitting
- write-off / donor-spares behaviour
- media upload and reload
- timegrapher run history
- commercial values and labour
- Final QC completion gate
- listing photo pack
- public output
- Sold state, ledger and history preservation

Every friction point becomes either a defect, a workflow simplification or a roadmap item.

---

## Phase 3 — Workshop refinement

Goal: turn the working stage paths into a dependable, versioned workshop operating procedure without making the bench bureaucratic.

Remaining work:

- versioned **Work Templates** for manual, automatic, pocket watch, quartz, clock, inspection and focused repair paths
- task state: **Done · Skipped · Blocked**
- required versus optional tasks beyond the existing Final QC gate
- more structured observations and measurements where they improve later evidence
- consistent labour capture throughout Work
- template version retained on completed Work so old service history remains interpretable

Do not introduce a new Job object.

---

## Phase 4 — Acquisition Engine expansion

Goal: turn the shipped Acquisition Engine v1 into a low-friction research and auction-intake workflow.

V1 already handles saved opportunities, explicit assumptions, resale scenarios, donor/stock usefulness, explainable BUY/WATCH/PASS, maximum bid and Purchased → Item conversion. See [`STATUS.md`](STATUS.md).

Remaining work:

- durable lot-photo/media ownership for Incoming opportunities
- paste/import workflow for auction title, lot text, URL, house, lot number and closing time
- ChatGPT/research handoff using the opportunity's photos and lot text
- evidence/provenance behind identity, visible condition, repair-risk and resale assumptions
- clearer missing-information prompts before bidding
- category-specific risk/value models for jewellery, accessories and small collectibles
- closing-time/watchlist workflow and optional alerts
- capture auction/source performance from realised purchase, labour, sale price and time-to-sale
- use confirmed outcomes to improve future acquisition ranking without overwriting evidence

Target flow:

**Photos / lot text → identify → compare with current stock → estimate risk/value → calculate max bid → save decision → purchase → Item**

---

## Phase 5 — Operational inventory and finance

Goal: make the numbers trustworthy enough to run the business from.

### Inventory transactions

Add explicit movements for:

- receive
- consume
- fit to Work
- remove from donor
- return to stock
- adjustment
- stocktake
- write-off

The existing parts-fit flow already consumes stock/donor sources; this phase generalises that into an auditable transaction history. Track storage location and cost basis where relevant.

### Finance

Finish separating and reconciling:

- projected versus realised values
- Item costs versus workshop/tool costs
- marketplace/payment fees
- postage in and postage out
- refunds
- consumables
- external service
- labour cost/value
- actual sale proceeds

Build reconciliation views that explain why a portfolio total equals the underlying transactions.

---

## Phase 6 — Listing refinement

Goal: deepen the shipped canonical Listing/Sale engine without duplicating Item data.

Remaining work:

- stronger evidence-safe wording rules by category
- channel-specific title/length constraints where useful
- richer pricing/fee guidance from realised channel performance
- customer-facing service summaries and care notes
- prevent unsupported provenance, originality, water-resistance or condition claims by construction
- browser-level end-to-end coverage for photo selection → listing → publish

---

## Phase 7 — Commerce automation

Goal: remove the manual gap between publish, payment and sold-state bookkeeping.

Sequence:

1. Calibre Sale requests checkout server-side.
2. Secure Supabase/server function talks to Square.
3. Checkout is created with an idempotency key.
4. Square webhook is signature-verified.
5. Verified payment records the order.
6. Item becomes **Sold**.
7. Checkout is disabled/closed.
8. Ledger is updated/reconciled.
9. Customer confirmation is sent through Resend.
10. Public Passport/history remains available according to publication settings.

A browser redirect alone must never be authoritative proof of payment.

---

## Phase 8 — Persistence scale

Goal: improve queryability and multi-device behaviour without changing the user's mental model.

Progressively move operational collections from the single synced state document into structured Supabase records such as:

- items
- work
- media_assets
- inventory_transactions
- ledger_entries
- incoming
- compatibility evidence

IndexedDB remains the offline cache. Core Item/Work semantics do not change.

Do this progressively; there is no justification for another architecture rewrite.

---

## Phase 9 — Customer outputs and provenance

Build:

- service certificate
- Certificate of Authenticity / researched-item certificate where appropriate
- richer public Watch Passport
- QR provenance/history entry point
- safe service-history summary
- before/after imagery
- customer care notes

Public output must distinguish sourced facts, workshop observations and uncertain identification.

---

## Phase 10 — Controlled learning

Calibre should become smarter from confirmed outcomes while preserving provenance.

Useful learning signals include:

- verified part fit / non-fit
- donor success
- repair outcome
- actual labour time
- timing before/after service
- realised sale price
- days to sale
- acquisition source performance

Learning may influence future ranking and recommendations, but must not overwrite factory/reference truth or erase the evidence behind a conclusion.

---

## Hardware validation track

Hardware work runs alongside the roadmap where it can be validated physically.

### Timegrapher microphone

- test the direct USB microphone on Android, DeX and desktop
- compare repeated runs against a known/reference timegrapher where possible
- record noise floor, missed beats, false beats, BPH lock stability, rate stability and beat-error stability
- do not change detector maths until real evidence identifies a problem

### Printing

- validate what can print directly from Android/DeX
- where the label/demo printer is desktop-only, use a small Windows/PC print bridge rather than forcing unsupported mobile drivers
- keep label generation device-independent

### QR workshop layer

Target physical workflow:

- Item QR on bag/tag
- tray/bin QR
- donor QR
- scan Item → open Item / active Work
- scan donor while Work is active → compatibility context
- scan tray → contents

---

## Browser-level acceptance tests

Add a small Playwright suite around the highest-value journeys:

1. create Item → start Work
2. capture/upload media → save → reload
3. Needs Parts → donor/parts matching → fit → resume
4. Final QC → listing snapshot / publish readiness
5. acquisition candidate → Purchased → Item
6. cloud/reload or mocked sync conflict path

The existing unit/source/syntax tests remain useful; browser tests prove the pieces work together.

---

## Release gate for primary business use

Calibre becomes the primary business operating system when:

- repository tests are green
- failed tests block deployment
- backup export and restore are proven
- cloud conflict handling is proven
- two-device sync is proven
- a real acceptance watch passes end-to-end
- phone / DeX / desktop smoke checks pass
- finance totals reconcile against real transactions
- no normal-runtime Job architecture remains
- project documentation reflects actual `main`
