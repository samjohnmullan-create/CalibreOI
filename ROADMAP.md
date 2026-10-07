# Calibre & Co. — Product Roadmap

_Last updated: 7 October 2026_

## Product direction

Calibre is an intelligent digital watchmaker's bench that follows a watch through its full lifecycle:

**Acquire → Identify → Inspect → Diagnose → Service → Time → Document → Value → Sell → Preserve history**

The watch remains the centre of the system. The Passport is its permanent identity and history. Jobs describe work performed on it. Timing, parts, costs, documents, photographs, provenance and eventual sale all connect back to the same watch.

The custom `calibreco.com.au` domain changes the scope of the product. Calibre is no longer only a local/PWA workshop tool. It can now become a small platform with a private workshop app, durable media/document storage, public digital watch passports, branded authentication email and a public-facing Calibre & Co. site.

---

# Product rules

1. **The watch is the centre of the system.** Every repair, timing run, photo, part, cost, document and sale belongs to a watch record.
2. **The Passport is the permanent record.** Jobs can finish; the Passport remains.
3. **A Job records work, not identity.** Service notes, stages, faults, labour and parts belong to the job.
4. **Business data stays structured.** Purchase cost, parts, fees, tools, labour, target sale and actual sale should not be buried in notes.
5. **One source of truth.** Avoid duplicate fields living on different pages.
6. **Bench-first UX.** Mobile remains touch-friendly; desktop remains compact and information-dense.
7. **Do not fake measurements.** Especially timing, amplitude and diagnostic data. Show confidence and limitations.
8. **Offline should remain useful.** Cloud sync enhances the bench workflow; it must not make the app unusable without a connection.
9. **AI should enrich structured data, not replace it.** Research suggestions should be reviewable before becoming Passport facts.
10. **Public data is explicit.** A watch is never made public merely because it exists in Calibre.
11. **Files are files, data is data.** Photos/PDFs should live in file storage; structured watch/job records should remain in the database.
12. **Security before convenience.** Private workshop notes, customer details and credentials must never leak into public passport pages or frontend secrets.

---

# Current state

## Product foundation — largely complete

- Five-destination shell: Home / Workshop / Collection / Business / Calibre.
- Sage + graphite visual system replacing the earlier bronze/brown direction.
- Approved Calibre crescent mark and horizontal/stacked SVG lockups.
- Compact desktop shell and lighter visual density.
- Simplified Calibre intelligence hub.
- Passport/Identity workflow with confidence, evidence and source awareness.
- Structured jobs, stages, business records, parts, photos and timing runs.
- Local/offline-first state with Supabase cloud sync.
- Account sign-in plus password reset UI.
- Timegrapher 2.0 signal engine implemented but hardware validation paused pending real-world testing.

## New infrastructure now available

- `calibreco.com.au` registered with web hosting/storage.
- Resend sending domain configured and awaiting/undergoing DNS verification.
- Supabase remains the structured-data/authentication layer.
- GitHub remains the application source/deployment pipeline for now.

---

# Platform architecture

Calibre should now be treated as four cooperating layers.

## 1. Workshop application

**Target:** `app.calibreco.com.au`

Responsibilities:
- repair workflow
- Passport editing
- timing
- parts
- money/sale workflow
- job handoff
- AI/research assistance
- offline operation

The app should continue as a lightweight PWA. A framework rewrite is not a current priority.

## 2. Structured data and authentication

**Platform:** Supabase

Responsibilities:
- user accounts
- watch/passport/job records
- business records
- relationships and IDs
- sync
- permissions
- public/private state

Supabase remains the system of record for structured data.

## 3. Media and document storage

**Initial target:** Calibre web-hosting storage where technically suitable, with a clean storage abstraction so this can move later if required.

Responsibilities:
- original watch photography
- workshop/evidence photos
- movement images
- invoices and purchase records
- generated certificates/passports
- listing images
- exports/backups
- technical reference files where licensing permits

The database should store URLs, metadata, hashes and relationships — not large image payloads inside synced records.

Suggested watch media structure:

```text
/watches/<watch-id>/
  /original/
  /identity/
  /workshop/
  /movement/
  /documents/
  /sale/
```

## 4. Public web layer

**Targets:**
- `calibreco.com.au` — public Calibre & Co. site
- `passport.calibreco.com.au` — public watch passports/history
- future optional `docs.calibreco.com.au` — product/reference documentation

Public content must be deliberately published from private structured data, never exposed directly from workshop records.

---

# Core objects

## Watch
Stable physical item across acquisition, repair, sale and future service.

## Passport
Permanent identity/history:
- maker, model, reference, serial
- calibre and movement details
- dimensions/materials
- dial/case markings and hallmarks
- historical research and sources
- provenance
- known service history
- timing history
- evidence photographs
- public/private publication state

## Job
Work performed on a watch:
- intake condition
- faults/diagnosis
- repair path and stages
- notes/photos
- parts fitted
- labour
- before/after timing
- final QC

## Commercial record
- acquisition cost
- premium/postage
- parts/consumables
- labour value
- marketplace fees
- target/minimum/actual sale
- channel
- cash profit
- profit after labour
- ROI

## Media asset
New first-class concept:
- asset ID
- watch/job relationship
- original filename
- storage URL/key
- category
- MIME/type
- dimensions/file size
- capture/upload date
- checksum/hash where practical
- public/private flag
- caption/evidence note

## Document
- certificate
- service report
- customer passport PDF
- invoice/receipt
- research document
- export/backup

---

# Information architecture

Keep five primary destinations.

## Home
What needs attention today?

- current watch
- jobs needing action
- incoming purchases/parts/tools
- awaiting parts
- ready to list
- recent Calibre activity
- quick actions

## Workshop
Work on the current watch through contextual sections:

**Repair / Identity / Timing / Parts / Money / Sale / Summary / Documents**

## Collection
Everything owned, sold, on the bench or retained as spares.

## Business
Profitability, stock value, capital tied up, fees, tool investment and sales performance.

## Calibre
Intelligence/system hub:
- Research/Assistant
- Job handoff
- Updates
- Account/sync/settings

Do not let Calibre become a dumping ground for unrelated features.

---

# Visual and brand direction

## Character

**Modern precision instrument. Quiet, compact, sophisticated and durable.**

Avoid antique-shop styling, faux leather/brass, blue-as-brand, giant SaaS cards, literal gears and decorative watch clichés.

## Settled palette

### Light
- `--bg: #f1f3ee`
- `--surface: #ffffff`
- `--surface-2: #e8ece5`
- `--ink: #151815`
- `--muted: #687067`
- `--line: #d5dad2`
- `--nav: #151815`
- `--accent: #607558`
- `--accent-soft: #91a28a`

### Dark
- `--bg: #10120f`
- `--surface: #171a16`
- `--surface-2: #20241e`
- `--ink: #f0f1ec`
- `--muted: #92978f`
- `--line: #2b3029`
- `--nav: #0e100d`
- `--accent: #7f9277`
- `--accent-soft: #aab69f`

## Brand mark

The approved mark is the rounded crescent/C silhouette with the separate upper sweep. Use the existing SVG brand assets as the source of truth. Do not restart logo exploration unless the brand direction itself changes.

---

# Revised build phases

## Phase 1 — Product foundation — substantially complete

Completed or established:
- settled sage/graphite direction
- approved logo system
- compact desktop shell
- five-destination navigation
- simplified Calibre hub
- Passport evidence/confidence workflow
- cloud account/sync foundation

Remaining polish should be handled opportunistically rather than blocking platform work.

---

## Phase 2 — Trustworthy timing — implemented, hardware validation paused

The Timegrapher engine now has improved transient detection, robust interval analysis, confidence logic and a beginner-facing workflow.

Next timing work resumes when real contact-microphone hardware/data is available:
- validate supported BPH rates
- tune noise rejection
- test beat-error reliability
- confirm saved timing metadata
- only investigate amplitude once defensible

Timegrapher work should not block the new web-platform sprint.

---

## Phase 3 — Domain, authentication and media platform — ACTIVE

### 3A. Email/authentication
- [x] Add password-reset flow to Calibre.
- [x] Register/configure `calibreco.com.au` in Resend.
- [ ] Complete Resend DNS verification.
- [ ] Create a least-privilege sending credential.
- [ ] Configure Supabase custom SMTP.
- [ ] Use a branded sender such as `Calibre & Co. <no-reply@calibreco.com.au>`.
- [ ] Configure permitted reset redirect URLs.
- [ ] Test reset flow end-to-end on a second device.

### 3B. App domain
- [ ] Create `app.calibreco.com.au`.
- [ ] Point it to the production Calibre app.
- [ ] Make it the canonical application URL.
- [ ] Update auth redirect URLs and share/job-card links.
- [ ] Update PWA metadata/install behaviour for the canonical domain.
- [ ] Preserve redirects/compatibility for existing GitHub Pages links during transition.

### 3C. Media storage
- [ ] Confirm the hosting account's file/SFTP/API capabilities before coupling Calibre to it.
- [ ] Define a storage adapter/interface rather than hard-coding one provider.
- [ ] Create a `mediaAsset` record shape.
- [ ] Upload originals once; derive thumbnails/previews separately.
- [ ] Move new job/passport photos to file storage and save URLs/metadata in Calibre.
- [ ] Keep existing embedded photos readable during migration.
- [ ] Add upload progress, failure/retry and offline queueing.
- [ ] Add orphan-file detection/cleanup strategy.
- [ ] Define retention and backup rules.

### 3D. Backup/export
- [ ] One-click full watch export.
- [ ] Periodic structured JSON backup.
- [ ] Media manifest with checksums/paths.
- [ ] Restore/import validation.
- [ ] Keep backups separate from live storage where possible.

**Exit condition:** Sign-in/reset works reliably on any device, the app has a stable Calibre domain, and new watch media is no longer bloating synced app state.

---

## Phase 4 — Digital Passport and customer-facing records

### 4A. Publish model
- [ ] Add explicit private/public Passport state.
- [ ] Generate stable public Passport IDs/slugs separate from internal database IDs.
- [ ] Define which fields can be published.
- [ ] Never expose private notes, acquisition price, customer details or internal diagnosis by default.
- [ ] Add preview-before-publish.

### 4B. Public Passport

Target URL:

`passport.calibreco.com.au/<public-id>`

Possible content:
- watch identity
- movement/calibre
- approximate date with confidence/source language
- provenance summary
- selected photographs
- service summary
- timing summary
- certificate/service-document links
- QR code

### 4C. Transfer/history
- [ ] Preserve permanent history when a watch is sold.
- [ ] Add owner-neutral public history rather than exposing customer identity.
- [ ] Future ownership-transfer workflow if the product grows beyond internal use.

### 4D. Documents
- [ ] Generate clean archival certificate PDFs.
- [ ] Generate service reports from the same data.
- [ ] QR-link documents back to the public Passport when published.
- [ ] Version generated documents so later edits do not silently alter historical paperwork.

**Exit condition:** A completed watch can move from private bench record to a deliberate, attractive public history page and matching document set without re-entering data.

---

## Phase 5 — Workshop intelligence

- diagnostic fault tree tied to observed checks
- fault → probable causes → confirmation tests
- lubrication/reference guidance by calibre/family where supported
- stage-specific photo prompts
- parts-needed workflow
- donor/stock compatibility matching
- before/after observations
- final QC gate before Ready to list
- fast voice/dictated bench notes
- movement-family and compatibility knowledge

---

## Phase 6 — Commercial intelligence and intake automation

- separate watch, parts, consumables and tool costs
- watch-level profit/ROI
- profit after labour
- stock ageing/capital tied up
- profitable brands/types/sources
- sales-channel performance
- tool/equipment ledger
- incoming purchase/parts/tool extraction from receipts/emails
- parts-arrival matching
- listing generation from Passport + sale data
- sold-watch archive

---

## Phase 7 — Public Calibre & Co. presence

Use the root domain for a restrained public site rather than a duplicate of the app.

Potential sections:
- what Calibre & Co. is
- selected completed watches
- watch Passport lookup
- educational/reference content
- contact/about
- privacy/terms
- future service or sales offering if desired

Technical additions:
- metadata/Open Graph cards
- sitemap/robots
- favicon/PWA brand assets
- analytics only if useful and privacy-conscious
- structured data for public watch/article pages where appropriate

The public site should remain small until there is content worth publishing.

---

# Further opportunities unlocked by the domain

These are not immediate blockers, but the domain makes them realistic:

## Secure customer handoff
A service completion page can provide a customer with the final report, selected images and Passport link without exposing the private workshop.

## QR identity
Each certificate/job card can carry a stable Calibre URL rather than a GitHub Pages URL.

## Watch search and internal reference library
Over time, confirmed Passport data can become a private calibre/maker/reference knowledge base, reducing repeated research.

## Public provenance archive
Selected sold watches can remain discoverable as documented examples even after inventory status changes.

## Media-derived automation
Future AI can classify movement/dial/case photos, suggest crop/rotation, detect duplicate uploads and prepare listing image sets while preserving originals.

## Hosting health/admin view
A small system-status panel in Settings can show:
- cloud sync state
- last backup
- media-storage usage
- email-domain status
- current app version
- queued offline uploads

## Versioned data migrations
As the model grows from one job record toward stable Watch → Jobs relationships, migrations should be explicit, versioned and recoverable.

---

# Data model direction

Long term:

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
  ├── mediaAssets[]
  └── documents[]

mediaAsset
  ├── storageKey/url
  ├── watchId/jobId
  ├── category
  ├── metadata
  └── visibility

tool / part / supplier are separate records
```

Do not perform a large destructive migration until the compatibility and rollback plan is defined.

---

# Immediate build order

1. **Finish Resend domain verification and Supabase custom SMTP.**
2. **Test password reset end-to-end.**
3. **Set up `app.calibreco.com.au` as the canonical application address.**
4. **Define media storage capabilities and the `mediaAsset` contract.**
5. **Implement new photo/file uploads outside the synced JSON state.**
6. **Add backup/export foundations before migrating old media.**
7. **Build explicit Passport publish/privacy controls.**
8. **Build the first public digital Passport page + QR link.**
9. **Create a minimal root `calibreco.com.au` landing page.**
10. **Resume Timegrapher hardware validation when the contact mic/testing data is available.**

---

# Success tests

Calibre is moving in the right direction when:

- A new watch is entered once and reused everywhere.
- Sign-in and password reset work reliably from any device.
- The app has a stable branded URL that is not tied to a repository username.
- Photos and PDFs no longer inflate the structured sync payload.
- Original media is retained at useful quality with clear ownership/relationships.
- Private workshop data can be selectively published without accidental leakage.
- A finished watch can produce a public Passport, QR code, certificate and listing from the same source data.
- Costs/profit can be understood without a separate spreadsheet.
- Offline work remains safe and syncable.
- Backups can be restored, not merely downloaded.
- New features extend core objects instead of creating isolated pages.
