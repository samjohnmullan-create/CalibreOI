# Calibre & Co.

Calibre is an intelligent digital watchmaker's workbench for vintage and antique watches.

It is being built around the full watch lifecycle:

**Acquire → Identify → Inspect → Diagnose → Service → Time → Document → Value → Sell → Preserve history**

## Current capabilities

- Structured watch jobs with repair-stage workflows
- Watch Passport / identity records
- Intake faults, diagnostic notes and repair guidance
- Photos attached to jobs, stages and Passport records
- Parts and supplier tracking
- Business, cost, sale and profitability data
- Timing runs with rate, BPH, beat-error estimate, confidence and position metadata
- AudioWorklet-based timegrapher prototype
- Collection/inventory views
- Job handoff and Calibre assistant tooling
- Local/offline data with cloud-sync support
- GitHub Pages / Vercel deployment support

## Active direction

The next development cycle focuses on:

1. brand palette and design system
2. logo/mark development
3. compact desktop shell and navigation
4. Calibre hub simplification
5. Timegrapher 2.0 around a dedicated USB/contact microphone
6. real-hardware signal testing before advanced timing calculations

See [`ROADMAP.md`](ROADMAP.md) for the product direction and [`docs/PHASE-1.md`](docs/PHASE-1.md) for the active build plan.

## Product principle

The watch is the centre of the system. The Passport is its permanent record; jobs describe work performed on it; timing, parts, costs, documents and eventual sale history should all connect back to that watch rather than living as isolated features.
