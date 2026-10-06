# Calibre & Co. — Product Roadmap

_Last updated: 7 October 2026_

## Product direction

Calibre is not just job-management software. It is an intelligent digital watchmaker's bench that follows a watch through its full lifecycle:

**Acquire → Identify → Inspect → Diagnose → Service → Time → Document → Value → Sell → Preserve history**

The aim is to make Calibre useful at the bench first, while creating a structured record that can later power research, listings, certificates, valuations, profitability and AI assistance.

## Product rules

1. **The watch is the centre of the system.** Every repair, timing run, photo, part, cost, document and sale belongs to a watch record.
2. **The Passport is the permanent record.** Jobs can finish; the Passport remains.
3. **A Job records work, not identity.** Service notes, stages, faults, labour and parts belong to the job.
4. **Business data stays structured.** Purchase cost, parts, fees, tools, labour, target sale and actual sale should not be buried in notes.
5. **No new top-level page unless it earns its place.** Prefer contextual tools and sections over adding navigation.
6. **One source of truth.** Avoid duplicate fields living on different pages.
7. **Bench-first UX.** Large enough to use with dirty hands and on mobile, but dense and efficient on desktop.
8. **Do not fake measurements.** Especially timing/amplitude/diagnostic data. Show confidence and limitations.
9. **Offline should remain useful.** Cloud sync is enhancement and backup, not a requirement for bench work.
10. **AI should enrich structured data, not replace it.** Research suggestions should be reviewable before becoming facts in the Passport.

---

# Product architecture

## Core objects

### 1. Watch
The physical item. Stable identity across purchase, repair, listing and sale.

### 2. Passport
Permanent identity/history:
- maker, model, reference, serial
- calibre and movement details
- dimensions and materials
- dial/case markings and hallmarks
- historical research and sources
- photos
- provenance
- known service history
- timing history

### 3. Job
Work performed on a watch:
- intake condition
- diagnostic faults
- repair path and stages
- notes/photos
- parts fitted
- labour
- before/after timing
- final QC

A watch may eventually have multiple jobs.

### 4. Business record
Commercial lifecycle:
- acquisition cost
- premium/postage
- parts and consumables
- labour value
- marketplace fees
- target/minimum/actual sale
- channel
- cash profit
- profit after labour
- ROI

### 5. Parts & tools
Separate operational assets:
- incoming orders
- stock/spares
- donor movements
- consumables
- tools/equipment
- supplier
- cost
- compatibility

---

# Information architecture

Keep five primary destinations.

## Home
**Purpose:** What needs attention today?

- current watch
- jobs needing action
- incoming purchases/parts/tools
- awaiting parts
- ready to list
- recent Calibre updates
- quick actions

## Workshop
**Purpose:** Work on the current watch.

Context sections:
- Repair
- Identity
- Timing
- Parts
- Money
- Sale
- Summary
- Documents

The existing watch strip and contextual navigation are the correct direction. Do not add these as top-level navigation items.

## Collection
**Purpose:** Everything owned, sold, on the bench or retained as spares.

Eventually support filters/views for:
- Watches
- Clocks
- Movements/donors
- Parts
- Tools
- Sold archive

## Business
**Purpose:** Understand the business rather than simply storing costs.

- profitability
- stock value
- capital tied up
- watch-by-watch profit
- sales performance
- fees/shipping
- tool/equipment investment
- parts/consumables spend
- ageing inventory

## Calibre
**Purpose:** Intelligence and system tools.

This should remain compact:
- Research/Assistant
- Job handoff
- Updates
- Settings/account/sync

Do not let Calibre become a dumping ground for unrelated features.

---

# Visual direction

## Brand character

**Modern precision instrument, not antique shop and not generic SaaS.**

The visual language should feel like a contemporary watchmaker's instrument: quiet, compact, precise and durable. Use horological cues through proportion, typography, measurement, rhythm and detail rather than literal gears or ornamental watch imagery.

Avoid:
- blue as a core brand colour
- faux brass/brown leather/steampunk styling
- generic SaaS gradients
- excessive glass/translucency effects
- giant rounded cards
- heavy shadows and borders everywhere
- oversized desktop spacing

### Working palette — Warm Instrument

The brand direction is **graphite + ivory + restrained bronze**, supported by warm neutral greys.

#### Dark appearance
- `--bg`: `#11110F` — deep warm graphite
- `--surface`: `#191815`
- `--surface-2`: `#22211D`
- `--ink`: `#F1EEE7` — soft instrument ivory
- `--muted`: `#969188`
- `--line`: `#312F2A`
- `--accent`: `#B98248` — restrained bronze/amber
- `--accent-soft`: `#D3AE7B`
- `--ok`: `#7D9270`
- `--danger`: `#B96658`

#### Light appearance
- `--bg`: `#F3F0E9`
- `--surface`: `#FAF8F3`
- `--surface-2`: `#E8E3D9`
- `--ink`: `#1A1916`
- `--muted`: `#706C64`
- `--line`: `#D5CEC2`
- `--accent`: `#95652E`
- `--accent-soft`: `#B78B58`
- `--ok`: `#718368`
- `--danger`: `#AA5F53`

### Visual rules

- Dark mode is the flagship appearance, but light mode must remain first-class.
- Bronze/amber is an **interaction and emphasis accent**, not a large-area fill.
- The interface should still work if the accent is removed; hierarchy must come from typography, spacing and surface contrast.
- Navigation should be visually recessive so the current watch/work area dominates.
- Reduce borders, shadows and nested cards. Structure should be felt more through spacing and grouping than boxes.
- Desktop should be approximately **20–30% denser** than the current prototype while mobile remains touch-friendly.
- Numbers should use tabular figures where timing, dimensions and finance data are shown.
- Prefer smaller, quieter icons and controls over large decorative elements.
- Avoid trend effects that compromise readability. Borrow the content-first principle from current interface design, not superficial glass or gradient styling.

## Logo direction

The mark must work at favicon size and must not literally illustrate a watch.

Explore 3 families:
1. **Abstract C / concentric calibre geometry**
2. **Escapement/pallet geometry reduced to a symbol**
3. **Timing arcs / balance oscillation transformed into a monogram**

Logo rules:
- The mark must work first in monochrome: ivory on graphite and graphite on ivory.
- Bronze may be used as an optional accent, never as a requirement for recognition.
- Avoid obvious gear icons, watch silhouettes and repair-shop clichés.

Deliverables once a mark is chosen:
- primary SVG mark
- wordmark
- horizontal lockup
- square app icon
- monochrome black/white
- transparent PNG exports
- favicon/maskable PWA icon

Do not lock the brand until candidates have been tested at 16 px, 32 px, mobile header and desktop header sizes.

---

# Build phases

## Phase 1 — Foundation and identity

**Goal:** Make the existing app feel like one deliberate product before expanding it.

### 1A. Design system
- [x] Choose Warm Instrument as the working colour direction
- [x] Introduce semantic `accent` / `accent-soft` colour tokens with temporary legacy aliases
- [ ] Test palette across all major pages in dark and light appearances
- [ ] Define typography scale
- [ ] Define spacing/radius/button/input/card tokens
- [ ] Create dense desktop variants
- [ ] Audit dark/light contrast

### 1B. Brand mark
- [ ] Produce broad logo exploration
- [ ] Shortlist 2–3 marks
- [ ] Test at favicon/app/header sizes
- [ ] Choose primary mark and wordmark
- [ ] Replace temporary raster-heavy brand assets with optimised SVG/PNG assets

### 1C. App shell
- [ ] Keep five primary destinations
- [ ] Refine desktop navigation proportions and density
- [ ] Standardise page headers
- [ ] Remove unnecessary hero blocks/cards
- [ ] Standardise watch context strip
- [ ] Standardise empty/loading/error states
- [ ] Reduce one-off page CSS where possible

### 1D. Calibre page
- [ ] Keep it an intelligence/system hub rather than another dashboard
- [ ] Remove duplicated current-watch information if already visible in the shell
- [ ] Make Research/Assistant the main action
- [ ] Keep Updates and Settings secondary

**Exit condition:** The major pages look and behave like the same application on desktop and mobile.

---

## Phase 2 — Timegrapher 2.0

**Goal:** Build the first genuinely specialist Calibre feature around the incoming USB/contact microphone.

### 2A. Audio input layer
- [ ] Enumerate available audio-input devices after permission is granted
- [ ] Allow explicit microphone selection
- [ ] Show selected device and reconnect state
- [ ] Detect/disclose sample rate
- [ ] Test Android USB audio behaviour
- [ ] Test Windows USB audio behaviour
- [ ] Add input-level/noise-floor diagnostic view

### 2B. Signal processing
The current peak-threshold detector is a prototype. Replace it with a staged pipeline:

`input → conditioning → band-pass/filtering → transient detection → refractory/debounce → tick/tock classification → interval analysis`

Tasks:
- [ ] Record raw diagnostic samples from real watches/mic
- [ ] Analyse contact-mic frequency content
- [ ] Add high/low-pass or band-pass filtering appropriate to the hardware
- [ ] Replace block-level peak detection with sample/transient detection
- [ ] Separate mechanical events from handling noise
- [ ] Improve automatic BPH locking
- [ ] Track dropped/false events
- [ ] Produce a signal-quality/confidence score grounded in actual detection quality

### 2C. Measurements
- [ ] Rate (s/day)
- [ ] BPH
- [ ] Beat error
- [ ] Jitter/stability
- [ ] Trace/paper view
- [ ] Measurement duration
- [ ] Position
- [ ] Lift angle metadata
- [ ] Investigate amplitude calculation and calibration

**Important:** Do not display amplitude until it can be defensibly calculated from the captured signal and lift-angle assumptions.

### 2D. Bench workflow
- [ ] Before-service run
- [ ] During-service run
- [ ] Regulation run
- [ ] Final run
- [ ] Six-position guided test: DU, DD, CU, CD, CL, CR
- [ ] Show positional delta and average rate
- [ ] Compare pre/post-service measurements
- [ ] Save timing report to Passport/Job

### 2E. Timing history
- [ ] Plot timing runs over the watch's history
- [ ] Compare runs by service stage and position
- [ ] Include timing summary in final QC and sale documentation

**Exit condition:** A real USB contact microphone can be selected on Android/Windows and produces repeatable rate/BPH/beat-error measurements on known watches.

---

## Phase 3 — Passport as the knowledge core

**Goal:** Turn research into reusable structured knowledge.

- [ ] Separate observed facts from inferred/researched values
- [ ] Per-field confidence and source support
- [ ] Research sources with title/URL/date/notes
- [ ] Calibre identification history
- [ ] Movement-family relationships
- [ ] Provenance timeline
- [ ] Service/timing history
- [ ] Parts compatibility notes
- [ ] AI research suggestions that require confirmation before writing core identity fields
- [ ] Generate listing/certificate/valuation material from the same Passport data

**Exit condition:** We do not need to research the same watch twice to recreate its identity/history.

---

## Phase 4 — Workshop intelligence

**Goal:** Make Calibre useful while the watch is physically on the bench.

- [ ] Diagnostic fault tree tied to observed checks
- [ ] Fault → probable causes → confirmation tests
- [ ] Lubrication/reference guidance by calibre/family where supported
- [ ] Parts-needed workflow
- [ ] Donor/stock compatibility matching
- [ ] Stage-specific photo prompts
- [ ] Before/after observations
- [ ] Final QC gate before status can become Ready to list
- [ ] Bench notes that can be dictated quickly on mobile

---

## Phase 5 — Commercial intelligence

**Goal:** Tell us what actually makes money.

- [ ] Separate inventory acquisition, repair parts, consumables and tool/equipment costs
- [ ] Watch-level profit and ROI
- [ ] Profit after labour
- [ ] Stock ageing and capital tied up
- [ ] Most profitable brands/types/sources
- [ ] Average repair cost by movement/watch type
- [ ] Sales-channel performance
- [ ] Tool investment ledger and optional depreciation/use tracking
- [ ] Monthly/yearly business dashboard
- [ ] Incoming purchases from connected sources where appropriate

---

## Phase 6 — Automation and outputs

- [ ] Incoming watch/tool/part intake from receipts/purchase emails
- [ ] Jobcard handoff into Calibre
- [ ] Passport research enrichment
- [ ] Parts arrival matching
- [ ] Ready-to-list workflow
- [ ] Listing generation
- [ ] Sales certificate / service report
- [ ] Sold-watch archive
- [ ] Backup/export/import

---

# Technical priorities

## Data model

The current single job record has been useful for prototyping, but the long-term model should evolve toward stable IDs and relationships:

```text
watch
  ├── passport
  ├── jobs[]
  │     ├── stages[]
  │     ├── faults[]
  │     ├── parts[]
  │     └── timingRuns[]
  ├── commercialRecord
  ├── provenance[]
  └── documents[]

tool / part / supplier are separate records
```

Do not perform a large migration until the schema and compatibility plan are defined.

## Front-end

Short term: keep the current lightweight web/PWA architecture.

Priorities:
- shared components/styles
- fewer inline page styles
- clearer modules
- robust offline state
- reliable cloud sync
- export/backup
- progressive enhancement for hardware/audio APIs

A framework rewrite is **not** currently a priority. Improve the product architecture before changing technology for its own sake.

---

# Immediate build order

This is the active order until Phase 1 and the Timegrapher foundation are complete:

1. **Warm Instrument palette and design tokens**
2. **Logo exploration and mark selection**
3. **Desktop shell/navigation density pass**
4. **Calibre page simplification**
5. **Timegrapher microphone/device selector**
6. **Timegrapher diagnostic audio view**
7. **Capture/test real contact-mic data**
8. **Timegrapher detection-engine upgrade**
9. **Pre/post timing comparison**
10. **Six-position test workflow**

Anything not supporting these ten items goes into the backlog unless it fixes a bug or protects existing data.

---

# Success tests

Calibre is moving in the right direction when:

- A new watch can be entered once and its information reused everywhere.
- The desktop UI feels compact while mobile remains bench-friendly.
- A watch can be timed repeatably with the external mic and the result saved without manual transcription.
- We can see what changed between incoming and final timing.
- Research and evidence remain attached to the watch.
- Costs and profit can be understood without a spreadsheet.
- A completed watch can move from bench to listing/certificate using the data already captured.
- New features extend the core objects rather than creating isolated pages.
