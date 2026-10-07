# Calibre & Co. — Phase 1: Product Foundation

This phase established Calibre as one coherent product before broader platform expansion.

## Status

**Substantially complete.** Remaining work is polish, not a blocker for the next platform phase.

## What Phase 1 established

### Brand and visual system

- Sage + graphite replaced the earlier blue/bronze/brown directions.
- The approved crescent/C mark with separate upper sweep is now the brand source of truth.
- Horizontal, stacked and monochrome SVG lockups exist in `assets/brand/`.
- Header branding now uses the approved horizontal lockup.
- Desktop density was reduced from the earlier oversized/card-heavy presentation.
- Light and dark appearances share the same semantic visual system.

Settled working tokens:

### Light
- Background: `#f1f3ee`
- Surface: `#ffffff`
- Raised surface: `#e8ece5`
- Ink: `#151815`
- Muted: `#687067`
- Divider: `#d5dad2`
- Accent: `#607558`
- Accent soft: `#91a28a`

### Dark
- Background: `#10120f`
- Surface: `#171a16`
- Raised surface: `#20241e`
- Ink: `#f0f1ec`
- Muted: `#92978f`
- Divider: `#2b3029`
- Accent: `#7f9277`
- Accent soft: `#aab69f`

## Shell and navigation

The product now uses five primary destinations:

**Home / Workshop / Collection / Business / Calibre**

Watch-specific work remains contextual inside Workshop rather than becoming top-level navigation:

**Repair / Identity / Timing / Parts / Money / Sale / Summary / Documents**

Established direction:
- compact desktop shell
- quieter navigation
- current watch/work area has visual priority
- fewer unnecessary nested cards
- mobile remains touch-friendly

## Calibre hub

The Calibre page was rebuilt away from a generic launcher and now acts as a watch-intelligence/system overview.

It surfaces:
- current watch readiness
- Identity / Workshop / Timing / Documents signals
- next useful actions
- secondary system/settings tools

## Passport / Identity

The Passport now centres on three questions:

1. What do we know?
2. How sure are we?
3. What evidence supports it?

Established capabilities:
- identity progress
- confidence indication
- source count
- photo count
- evidence checks
- per-field confidence states
- research/source records
- provenance
- evidence photographs
- existing autosave/data compatibility retained

## Cloud foundation

Calibre now has:
- Supabase authentication
- persisted sessions
- cloud state sync
- local/offline use
- sign-in/account UI
- password-reset UI

The custom email delivery layer is being completed in the next phase.

## Timegrapher foundation

Phase 1 also laid the browser-audio and UX foundation for the Timegrapher. Signal processing continued in Phase 2.

## Remaining polish

These are worth improving when encountered but should not block higher-value platform work:

- consolidate residual one-off page CSS
- continue removing unnecessary borders/nested cards
- standardise loading/empty/error states
- finish PWA icon sizes/maskable assets
- review all pages after major workflow changes
- accessibility/keyboard/focus audit

## Phase 1 exit condition

Met in practical terms: Calibre now looks and behaves like a coherent application, has a settled brand direction and has a usable identity/workshop/cloud foundation.

See [`../ROADMAP.md`](../ROADMAP.md) for the revised build order. The active infrastructure plan is in [`PHASE-3-WEB-PLATFORM.md`](PHASE-3-WEB-PLATFORM.md).
