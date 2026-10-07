# Calibre & Co.

Calibre is an intelligent digital watchmaker's workbench for vintage and antique watches.

It is built around the full watch lifecycle:

**Acquire → Identify → Inspect → Diagnose → Service → Time → Document → Value → Sell → Preserve history**

## Product principle

The watch is the centre of the system. The Passport is its permanent record; jobs describe work performed on it; timing, parts, costs, documents, photographs, provenance and eventual sale history connect back to that same watch.

## Current capabilities

- Structured watch jobs with repair-stage workflows
- Watch Passport / identity records with confidence and evidence support
- Intake faults, diagnostic notes and repair guidance
- Photos attached to jobs, stages and Passport records
- Parts and supplier tracking
- Business, cost, sale and profitability data
- Timing runs with rate, BPH, beat-error estimate, confidence and position metadata
- AudioWorklet-based Timegrapher with improved transient/interval analysis
- Collection/inventory views
- Job handoff and Calibre assistant tooling
- Local/offline data with Supabase cloud sync
- Account sign-in and password-reset flow
- Approved Calibre crescent brand system
- Compact sage + graphite application shell

## Platform direction

The new `calibreco.com.au` domain expands Calibre beyond a repository-hosted PWA.

The intended platform split is:

- **`app.calibreco.com.au`** — private workshop application
- **Supabase** — accounts, structured data, relationships and permissions
- **Calibre web hosting** — web delivery plus media/document storage where technically suitable
- **Resend** — branded authentication and transactional email
- **`passport.calibreco.com.au`** — deliberate public watch-history pages
- **`calibreco.com.au`** — small public Calibre & Co. presence
- **GitHub** — source repository and application change history

Photos and documents should progressively move out of large synced state payloads into proper file storage, with Calibre storing URLs/keys and metadata rather than embedded file data.

## Active build direction

The current priority is platform infrastructure rather than adding more top-level features:

1. finish Resend verification and Supabase custom SMTP
2. test password reset end-to-end on another device
3. move the production app to `app.calibreco.com.au`
4. introduce a first-class media asset model and external file storage
5. add versioned backup/export foundations
6. build explicit public/private Passport publishing
7. create the first QR-linked digital Watch Passport
8. create a minimal public site at the root domain
9. resume Timegrapher hardware validation when real contact-mic testing is available

See [`ROADMAP.md`](ROADMAP.md) for the full product direction, [`docs/PHASE-1.md`](docs/PHASE-1.md) for the established foundation, [`docs/PHASE-2.md`](docs/PHASE-2.md) for Timegrapher signal intelligence and [`docs/PHASE-3-WEB-PLATFORM.md`](docs/PHASE-3-WEB-PLATFORM.md) for the active web-platform sprint.
