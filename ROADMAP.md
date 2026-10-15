# Calibre & Co. — Roadmap

_Last revised: 15 October 2026_

This file contains **future work only**. Shipped capability belongs in [`STATUS.md`](STATUS.md); stable system rules belong in [`ARCHITECTURE.md`](ARCHITECTURE.md).

Calibre's governing rule remains:

**Item is permanent. Work is activity.**

The broad lifecycle is:

**Acquire → Identify → Research → Inspect → Work → Document → Value → List → Sell → Preserve**

For watches and clocks:

**Diagnose → Service → Parts → Measure → Time → QC → Passport**

---

# Current direction

Calibre already has most of the major domain foundations: canonical Item/Work, queue versus active bench state, parts/donor intelligence, Final QC gating, listings/sales, Acquisition Engine v1, Movement Finder, Knowledge, media, QR, profit intelligence and device-aware phone/DeX behaviour.

The next stage is therefore **not another broad feature expansion**. It is to make the existing system feel like one intelligent operating system centred on the physical bench and the business decisions around it.

The three biggest product priorities are now:

1. **Bench Command Centre** — a purpose-built low-friction workshop mode around the current Work record.
2. **Workshop intelligence** — timing, evidence, donor/parts, Knowledge and exception detection surfaced automatically at the moment they matter.
3. **Business intelligence** — trustworthy transactional finance plus monthly reporting, profitability and stock-performance analysis.

---

## Phase 1 — Backend reconciliation and release foundation

Goal: make GitHub, the deployed app and the structured Supabase backend agree before deeper feature work relies on them.

The live structured backend is ahead of the browser repo in several areas. It already contains bench-session primitives, Work-step media links, safe inventory archive/restore and append-only ledger hardening. Those capabilities should be consolidated into the existing Calibre backend rather than running two parallel systems.

Remaining work:

- consolidate the structured v2 schema into the existing Calibre Supabase project while preserving current Auth/session, cloud state, Knowledge, research/media and public catalogue behaviour
- adapt v2 RLS/grants rather than replaying broad privilege changes that could damage existing public features
- bootstrap the current authenticated user into the workspace/member model
- migrate and reconcile v2 Items, Work and related records
- pin an authoritative database schema/type snapshot in the repo
- reconcile repo documentation with deployed/backend reality
- finish the remaining legacy compatibility cleanup only where it still exists
- keep internal and public deployments test-gated
- add browser-level smoke coverage around the highest-value journeys

Exit condition: one coherent backend architecture, one documented source of truth, no unsafe URL/project switch, no hidden split-brain data model.

---

## Phase 2 — Workbench becomes the Bench Command Centre

Goal: make Workbench the best place to actually repair a watch, not merely a list of Work records.

### Bench Mode

Add an explicit **Start Bench Session** action. Once started, Calibre switches from the normal operating interface to a stripped-back workshop interface designed for phone, DeX and touch use.

Bench Mode should show only what is useful while working:

- Item / watch identity
- current Work
- current task / stage
- next required task
- important blocker or exception
- running bench-session duration

Primary quick actions stay permanently available:

**Photo · Note · Measure · Part · Timing · Problem**

The interface should use large type, large controls and minimal navigation. The normal business interface remains one tap away but should not compete for attention while working.

### Active exception engine

Bench Mode should proactively surface exceptions and useful events rather than requiring the user to hunt through screens. Examples:

- ⚠ timing is worse than the pre-service baseline
- ⚠ required step has no supporting evidence
- 🔧 possible donor part found in owned stock
- 📦 reserved / required part has arrived
- 📷 required movement or condition photo still missing
- ⚠ measurement differs materially from recorded reference
- ✅ all completion requirements satisfied — ready for Final QC

Exceptions should be explainable, dismissible where appropriate and linked directly to the relevant evidence/action.

### Bench sessions and labour

Wire the existing backend session primitives into Workbench:

- Start session
- Pause / finish session
- session duration
- optional note
- Work total bench time
- Item lifetime workshop time
- labour value / labour cost
- profit after labour
- eventual profit per bench hour

Bench time is operational evidence, not merely a stopwatch.

---

## Phase 3 — Comprehensive Timegrapher inside Work

Goal: make timing a first-class part of the Work record rather than a separate utility.

Every saved timing run should support:

- rate
- beat error
- BPH
- amplitude when/if it can be measured reliably
- lift angle where applicable
- position
- runtime / sample duration
- signal confidence
- microphone / input device used
- timestamp
- Work and Item ownership
- optional note / stage context

### Timing workflow

Support meaningful comparisons:

- pre-service baseline
- intermediate timing
- post-service / Final QC
- positional averages
- best / worst position
- rate spread by position
- pre versus post improvement
- repeatability / stability across runs

Timing should feed the Bench exception engine. A worse result after service should be visible immediately rather than buried in history.

### Device validation

Validate the direct USB microphone and alternative inputs such as a suitable digital stethoscope on:

- Android phone
- Samsung DeX
- desktop

Record noise floor, missed/false beats, BPH lock stability, rate stability and beat-error stability. Do not manufacture an amplitude number until the signal/model supports it reliably.

---

## Phase 4 — Workshop Tools layer

Goal: give Calibre small tools that are directly connected to watchmaking records rather than building a generic calculator app.

### Core tools

- **Profit calculator** — buy price + parts + fees + postage + labour → minimum sale, target sale, cash margin, profit after labour and ROI
- **Measurement converter** — mm ↔ inches ↔ lignes plus useful case, crystal and movement conversions
- **Timing calculator** — BPH, rate, positional average/spread and pre/post comparisons
- **Parts measurement scratchpad** — pivot, staff, stem, crystal, case and other quick measurements, with one-tap attachment to current Work
- **Bench timers** — ultrasonic, cleaning, soak, drying and testing timers
- **Movement Finder** — surfaced from Bench Mode and global command/search
- **Parts / Donor Finder** — immediate search of owned stock, donors and compatibility evidence
- **Knowledge lookup** — calibre, lubrication, technical and reference notes
- **Quick camera** — capture movement/part/measurement directly into current Item/Work
- **QR / label tool** — generate Item, part, donor, tray/bin and storage labels

Tools should prefill context from the current Item/Work wherever possible and write useful results back rather than becoming isolated utilities.

---

## Phase 5 — Knowledge as an active diagnostic assistant

Goal: evolve the existing Knowledge Base from a reference library into an evidence-aware workshop assistant.

The existing Movement Finder, Knowledge catalogue, research inbox and compatibility evidence remain the foundation.

Add a **Finding → Suggested Knowledge** loop:

- user records a symptom, finding, measurement or timing anomaly
- Calibre searches trusted Knowledge/reference data automatically
- relevant known causes, checks, lubrication points, technical notes, compatible calibres/parts and previous successful repairs are surfaced
- confidence and provenance stay visible
- workshop outcomes can become new local evidence only when explicitly confirmed

Examples:

- balance amplitude/rate behaviour → likely checks and reference notes
- stem/crown problem → relevant keyless works and compatible stem evidence
- wheel/endshake issue → matching prior Work notes or technical references
- calibre identification → Movement Finder + owned donor/parts candidates

Calibre must never silently turn an inference into factory/reference truth.

---

## Phase 6 — Work Templates and evidence-driven workflow

Goal: make the workshop workflow dependable and repeatable without making it bureaucratic.

Add:

- versioned Work Templates for manual, automatic, pocket watch, quartz, clock, inspection and focused repair paths
- task states: **Done · Skipped · Blocked**
- required versus optional tasks
- evidence requirements where useful: photo, note, measurement, part, timing result
- template version retained on completed Work
- direct integration with Bench Mode current/next task display
- Final QC readiness driven by actual evidence and unresolved exceptions

Do not introduce a new Job object.

---

## Phase 7 — Archive / Trash and safe removal everywhere

Goal: make removal predictable without destroying valuable history.

Add a consistent **Remove / Archive** action wherever appropriate for:

- Items
- Parts
- Tools
- Consumables

Rules:

- records with Work, finance, fit, donor, provenance or stock history are soft-archived
- archived records disappear from normal operational lists, matching and search
- dedicated Archive / Trash view supports restore
- restoration preserves identity, history, cost and provenance
- genuinely accidental empty records may be permanently deleted from Trash under controlled conditions
- Work cancellation remains separate from Item archive
- Donor / Spares remains a lifecycle state, not deletion

---

## Phase 8 — Donor economics and deeper parts intelligence

Goal: treat donor watches as inventory with recoverable value rather than zero-value write-offs.

Rules:

- changing an Item to Donor must never erase its acquisition cost
- every removed donor part records source Item, recipient Work and evidence
- donor usage should support partial cost allocation to the recipient repair
- remaining donor value/cost basis stays visible
- donor-combine opportunities continue to be surfaced automatically
- successful and failed fits strengthen local compatibility evidence

Longer term, Calibre should show whether buying a donor was financially worthwhile across all recipient repairs.

---

## Phase 9 — Operational inventory and finance

Goal: make the numbers trustworthy enough to run the business from.

### Inventory transactions

Track explicit movements for:

- receive
- consume
- fit to Work
- remove from donor
- return to stock
- adjustment
- stocktake
- write-off
- archive / restore
- storage move

Track storage location, quantity and cost basis where relevant.

### Finance and profit engine

Separate and reconcile:

- purchase / hammer price
- buyer premium
- inbound postage / collection
- parts
- consumables
- tools / workshop capital
- external service
- labour
- marketplace fees
- payment fees
- outbound postage
- refunds
- actual sale proceeds

Support **general income not tied to an Item**, including:

- service income
- parts sales
- postage recovered
- reimbursements
- miscellaneous business income

Owner contributions/capital must remain separate from revenue so they cannot inflate profit.

Always distinguish:

**Projected value ≠ Realised value**

---

## Phase 10 — Business → Reports

Goal: turn the existing Business foundations into a useful monthly management view.

Add a dedicated **Reports** view under Business with month selector, interactive graphs, prior-month comparison and exportable monthly snapshot.

### Monthly headline figures

- revenue
- realised profit
- purchases
- workshop / parts costs
- other expenses
- stock acquired
- stock sold
- stock value
- capital tied up
- average profit per Item
- average days to sell
- Work completed
- parts consumed
- donor usage
- bench hours
- profit per bench hour when data quality supports it

### Month-on-month comparison

Examples:

- revenue +18%
- realised profit +$420
- stock investment −$310
- average days-to-sale improved by 7 days
- 6 Work records completed
- 3 Items blocked awaiting parts

### Useful visual analysis

- profit by Item
- profit by acquisition source
- sales channel performance
- stock ageing
- purchase spend versus sales
- potential-profit pipeline
- realised versus projected profit
- capital tied up over time
- bench time versus profit generated
- donor cost recovered

Reports should sit above the existing Overview, Stock, Listings, Sales, Ledger and Costs rather than becoming another primary navigation area.

---

## Phase 11 — Acquisition Engine expansion

Goal: turn Acquisition Engine v1 into a low-friction auction/research intake workflow.

V1 already provides saved opportunities, explicit assumptions, resale scenarios, donor/stock usefulness, explainable BUY/WATCH/PASS, max bid and Purchased → Item conversion.

Remaining work:

- durable lot photos/media
- paste/import auction title, text, URL, house, lot number and closing time
- automatic research handoff using photos and lot text
- provenance/evidence behind identity, condition, repair-risk and resale assumptions
- missing-information prompts before bidding
- category-specific models for jewellery, accessories and small collectibles
- watchlist and closing-time workflow
- acquisition-source performance from realised outcomes
- feed confirmed purchase, repair, labour, sale and days-to-sale outcomes back into future ranking

Target flow:

**Photos / lot text → identify → compare with stock → estimate risk/value → max bid → decision → purchase → Item**

---

## Phase 12 — Brand identity in the Item UI

Goal: make Items visually faster to recognise without clutter.

Add small maker marks beside watch/item brand/title where a verified asset exists.

Implementation rules:

- SVG primary format
- transparent PNG fallback
- curated library only; do not scrape arbitrary web logos
- maker text/monogram fallback when no approved mark exists
- logos remain decorative and never replace searchable brand text

This should be subtle: recognition aid, not visual decoration for its own sake.

---

## Phase 13 — Listing, customer output and commerce refinement

### Listing

- stronger evidence-safe wording rules by category
- channel-specific title/length constraints
- pricing/fee guidance from realised channel performance
- customer-facing service summary and care notes
- block unsupported claims around provenance, originality, water resistance and condition

### Customer outputs

- service certificate
- researched-item / authenticity certificate where justified
- richer public Watch Passport
- QR provenance/history entry point
- safe service-history summary
- before/after imagery
- customer care notes

Public output must distinguish sourced facts, workshop observations, confirmed repair evidence and uncertain identification.

### Commerce automation

1. Calibre requests checkout server-side.
2. Secure server/Supabase function talks to Square.
3. Checkout uses an idempotency key.
4. Square webhook is signature-verified.
5. Verified payment records the transaction.
6. Item becomes Sold.
7. Checkout closes.
8. Ledger reconciles automatically.
9. Customer confirmation is sent.

A browser redirect alone must never be authoritative proof of payment.

---

## Phase 14 — Controlled learning

Goal: allow Calibre to become progressively better from confirmed workshop and commercial outcomes.

Useful signals include:

- verified part fit / non-fit
- donor success
- repair outcome
- recorded findings and their eventual cause
- bench time
- pre/post timing
- realised sale price
- projected versus actual profit
- days to sale
- acquisition source performance
- sales channel performance

Learning may change ranking and recommendations, but never overwrite primary evidence, historical records or reference truth.

---

## Parallel hardware and physical-workshop track

### QR workshop layer

Target physical workflow:

- Item QR on bag/tag
- tray/bin QR
- donor QR
- part storage QR
- scan Item → Item / active Work
- scan donor while Work active → compatibility context
- scan tray/bin → contents

### Printing

Keep label generation device-independent. Android/DeX should generate/share a print-ready asset; desktop-only printers can use a small PC bridge rather than forcing unsupported mobile drivers.

### Bench capture hardware

Continue validating microphone/camera/measurement workflows on the actual phone + DeX setup so the interface follows real workshop ergonomics rather than desktop assumptions.

---

## Real end-to-end acceptance

Run at least one representative physical watch through:

**Intake → Identity → Research → Queue → Bench Session → Diagnosis → Parts → Repair → Timing → Final QC → Value → Listing → Publish → Sold → Passport/history**

Deliberately exercise:

- queue versus bench
- Bench Mode
- quick photo/note/measure/part/problem capture
- timing baseline and post-service comparison
- Knowledge suggestions
- Needs Parts / donor matching
- reserved-part arrival
- archive / restore
- donor/spares conversion
- labour/session capture
- Final QC
- commercial values
- listing/photo pack
- public output
- Sold / ledger history

Every friction point becomes either a defect, simplification or roadmap item.

---

## Browser-level acceptance tests

Add a small Playwright suite around the highest-value journeys:

1. create Item → start Work
2. Queue → Bench Mode → finish bench session
3. capture photo/note/measurement → reload
4. Needs Parts → donor/parts match → fit → resume
5. timing baseline → final timing → comparison
6. archive entity → hidden from active views → restore → history intact
7. Final QC → listing / publish readiness
8. acquisition candidate → Purchased → Item
9. finance transaction → monthly report reconciliation
10. cloud/reload or mocked sync-conflict path

---

# Recommended implementation order

1. **Complete backend consolidation/reconciliation.**
2. **Workbench Bench Mode + live bench sessions.**
3. **Comprehensive Timegrapher embedded in Work.**
4. **Bench quick-actions + exception engine.**
5. **Knowledge auto-suggestions from findings.**
6. **Archive/Trash UI using the backend primitives already built.**
7. **Workbench tools: measurements, timers, calculators, quick camera, donor/knowledge lookup.**
8. **Transactional finance + donor cost attribution + general income.**
9. **Business → Monthly Reports.**
10. **Versioned Work Templates/evidence requirements.**
11. **Acquisition photo/research automation.**
12. **Brand-logo library and Item visual polish.**
13. **Commerce/customer-output refinement.**
14. **Controlled learning from confirmed outcomes.**

---

## Release gate for primary business use

Calibre becomes the primary business operating system when:

- repository tests are green and failed tests block deployment
- repo and live Supabase schema/documentation agree
- backup export and restore are proven
- cloud conflict handling is proven
- two-device sync is proven
- a real physical end-to-end watch passes
- phone / DeX / desktop smoke checks pass
- Bench Mode is reliable enough to use during actual servicing
- timing evidence can be recorded and compared reliably
- finance totals reconcile against real transactions
- archive/restore is proven and destructive delete is controlled
- no normal-runtime Job architecture remains
- project documentation reflects deployed behaviour
