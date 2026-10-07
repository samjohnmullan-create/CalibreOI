# Calibre & Co. — Phase 3: Web Platform, Identity & Media

## Objective

Use the new `calibreco.com.au` domain and hosting to make Calibre a durable platform rather than only a repository-hosted PWA.

This phase is about infrastructure that unlocks reliable sign-in, branded URLs, proper file storage, public digital watch passports and future customer-facing records.

---

# Architecture decision

Use each platform for the job it is best at.

## Supabase
Keep as the structured-data and authentication layer.

Use it for:
- accounts
- watch/passport/job records
- business data
- stable IDs and relationships
- permissions
- sync
- public/private publication state

Do not move the database simply because the web-hosting plan includes disk space.

## Web hosting
Use primarily for web delivery and file/media storage where the hosting capabilities are suitable.

Potential uses:
- app/public web assets
- original watch photos
- workshop/evidence photos
- generated PDFs
- listing media
- exports/backups
- technical documents where licensing permits

Before writing storage code, confirm whether the hosting account exposes SFTP/FTP, WebDAV, an HTTP upload API or another secure server-side upload mechanism.

## Resend
Use for transactional email delivery.

Initial use:
- password reset
- account confirmation/authentication mail

Future use:
- service completion notifications
- customer Passport links
- internal alerts if genuinely useful

## GitHub
Keep as the source repository and change history.

Deployment can continue from GitHub while the custom domain becomes the stable public address.

---

# Workstream A — Authentication email

## Current state

- Password reset exists in the Calibre Settings/account flow.
- Resend domain is configured.
- DNS verification is in progress.

## Tasks

- [ ] Confirm `calibreco.com.au` is verified by Resend.
- [ ] Create a least-privilege sending credential for authentication only.
- [ ] Configure Supabase custom SMTP.
- [ ] Use `Calibre & Co. <no-reply@calibreco.com.au>` as the auth sender unless another sender is deliberately chosen.
- [ ] Add the production app URL to Supabase permitted redirect URLs.
- [ ] Test Forgot Password from a logged-out second device.
- [ ] Confirm the link lands on Calibre and allows a new password to be set.
- [ ] Test expired/used reset links and show a clear recovery path.
- [ ] Confirm secrets never enter the frontend repository.

### Acceptance test

A user can request a reset from a different device, receive the Calibre-branded message, set a new password and sign in successfully.

---

# Workstream B — Canonical app domain

## Target

`https://app.calibreco.com.au`

## Tasks

- [ ] Create DNS for the app subdomain after choosing/confirming the production hosting target.
- [ ] Configure HTTPS.
- [ ] Set `app.calibreco.com.au` as the canonical app URL.
- [ ] Update Supabase Site URL / redirect allow-list.
- [ ] Update job-card and handoff links to use the branded domain.
- [ ] Update any generated QR codes.
- [ ] Update manifest/start URL as required by the final deployment path.
- [ ] Preserve existing GitHub Pages links during transition with redirects or compatibility handling.
- [ ] Test installed PWA behaviour after moving domains.

### Acceptance test

Opening Calibre, password reset links, job cards and future QR links all resolve through the branded domain rather than a repository-user URL.

---

# Workstream C — Media asset model

Photos are currently valuable but potentially expensive to sync if embedded in the main state object. New media should become separate first-class assets.

## Proposed record

```js
mediaAsset = {
  id,
  watchId,
  jobId,
  stageId,
  category,       // original, identity, movement, workshop, document, sale
  storageKey,
  url,
  thumbnailUrl,
  originalName,
  mimeType,
  bytes,
  width,
  height,
  createdAt,
  caption,
  evidenceNote,
  checksum,
  visibility      // private | public
}
```

Not every field is mandatory on day one; the contract is intentionally extensible.

## File layout

```text
/watches/<watch-id>/
  original/
  identity/
  movement/
  workshop/
  documents/
  sale/
```

Use stable internal watch IDs for storage paths. Do not rely on model names, which can change during identification.

## Tasks

- [ ] Confirm the hosting account's upload/access mechanisms.
- [ ] Choose secure upload architecture.
- [ ] Add `mediaAsset` storage to Calibre's structured data model.
- [ ] Compress/resize preview images client-side where sensible while retaining originals.
- [ ] Upload originals separately from thumbnails/previews.
- [ ] Store only URLs/keys and metadata in watch/job records.
- [ ] Add retryable upload queue.
- [ ] Allow bench work/photos to remain usable offline until upload succeeds.
- [ ] Surface upload state: local / queued / uploaded / failed.
- [ ] Keep legacy embedded-photo records readable.
- [ ] Plan a later migration tool rather than silently rewriting historical records.

### Security rule

Never make a storage directory public merely because it is web-addressable. Private media should require an access-control mechanism or non-public storage path appropriate to the hosting environment.

### Acceptance test

A new watch can have multiple full-resolution photos without materially increasing the structured sync payload.

---

# Workstream D — Backup and restore

Backups matter more as Calibre becomes multi-device and media-heavy.

## Tasks

- [ ] Create versioned JSON export schema.
- [ ] Add export metadata: app version, schema version, export time.
- [ ] Generate media manifest containing storage keys/URLs/checksums.
- [ ] Add one-watch export.
- [ ] Add full-account/business export where appropriate.
- [ ] Validate imports before writing data.
- [ ] Provide dry-run/import summary before destructive restore.
- [ ] Store periodic backup copies away from the live data path.
- [ ] Add Settings status: Last successful backup.

### Acceptance test

A backup can be restored into a clean environment and recreate structured watch/job data with clear references to its media assets.

---

# Workstream E — Digital Passport publishing

The private Passport remains the source. Public Passports are deliberate published views.

## Target

`https://passport.calibreco.com.au/<public-id>`

## Privacy model

A public Passport should have a separate publication object or explicit allow-list of fields.

Never publish by default:
- acquisition cost
- internal profit/margins
- private workshop notes
- customer names/contact details
- private diagnosis notes not intended for the customer
- account/internal IDs

Potential public fields:
- maker/model/reference
- calibre/movement
- serial where appropriate
- approximate date with confidence language
- case/material/dimensions
- selected research/provenance
- selected service history
- selected timing results
- selected photographs
- certificate/service-report links

## Tasks

- [ ] Add publish/private control.
- [ ] Create stable public ID separate from internal record ID.
- [ ] Add public-field selection or safe publication schema.
- [ ] Add preview before publishing.
- [ ] Build first mobile-first public Passport template.
- [ ] Generate QR code to the public Passport.
- [ ] Add unpublish/revoke support.
- [ ] Ensure sold status does not automatically expose owner/customer information.

### Acceptance test

A completed watch can be previewed, published and scanned from a QR code without exposing internal/private data.

---

# Workstream F — Generated documents

Use the same structured data that powers the Passport.

## Outputs

- Service report
- Watch Passport PDF
- Certificate/history document
- Sale/listing information pack

## Tasks

- [ ] Redesign remaining ornate/legacy document styling toward the modern archival Calibre system.
- [ ] Use approved brand SVGs.
- [ ] Add document version/date.
- [ ] Record generated document as a `document` object.
- [ ] Store generated PDF in file storage.
- [ ] Link published documents to public Passport where desired.
- [ ] QR-link back to permanent Passport URL.

---

# Workstream G — Root public website

## Target

`https://calibreco.com.au`

Keep the initial public site deliberately small.

First version can contain:
- Calibre & Co. identity/mission
- explanation of the digital Passport concept
- selected completed watches when available
- Passport lookup/scan explanation
- contact/about
- privacy/terms
- link to the private app where appropriate

Do not build a large marketing site before there is real public content.

## Technical baseline

- responsive
- fast static delivery
- correct metadata/Open Graph
- sitemap/robots
- favicon/app icon using approved mark
- no unnecessary trackers
- accessible contrast/semantics

---

# Workstream H — System health panel

Add a compact infrastructure status area under Settings/System rather than a new top-level page.

Useful signals:
- signed-in/sync state
- last cloud sync
- offline queue count
- pending media uploads
- last backup
- current app version
- storage usage if accessible from hosting APIs
- auth email status/test action where feasible

This should help diagnose failures without turning Calibre into an admin console.

---

# Immediate execution sequence

1. Finish Resend verification.
2. Connect Resend SMTP to Supabase and test password reset.
3. Confirm hosting capabilities: DNS, SSL, SFTP/API/file storage.
4. Bring `app.calibreco.com.au` online.
5. Change generated/share URLs to the branded app domain.
6. Implement `mediaAsset` schema and upload adapter.
7. Route new photos/files through external storage while retaining legacy compatibility.
8. Add backup/export foundation.
9. Implement public/private Passport publication model.
10. Build first `passport.calibreco.com.au` page and QR flow.
11. Build the minimal root `calibreco.com.au` site.
12. Resume Timegrapher hardware validation when practical.

---

# Things not to do yet

- Do not move Supabase data into the web host simply to consume hosting space.
- Do not expose raw storage folders publicly.
- Do not migrate all old photo data in one destructive pass.
- Do not put Resend, SMTP or Supabase privileged secrets in client-side JavaScript.
- Do not build customer accounts/ownership transfer until the public Passport model is stable.
- Do not perform a framework rewrite during infrastructure work.
- Do not let the root website distract from the workshop app.

---

# Phase completion criteria

Phase 3 is complete when:

- branded password-reset email works reliably
- Calibre has a stable production app URL
- new media is stored outside the main structured sync state
- backups are versioned and restorable
- a private Passport can be safely published as a public Passport
- generated documents can reference a permanent QR/URL
- the root domain has a small, polished public presence
- existing local/offline workshop use remains intact
