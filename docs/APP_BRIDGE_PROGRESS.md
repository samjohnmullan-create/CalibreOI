# Calibre structured app bridge — progress

_Last updated: 15 October 2026_

## Bridge strategy

The structured backend is being introduced as an overlay rather than a big-bang replacement of `calibre_state`.

- structured Items/Work are authoritative where matching IDs exist
- unmatched legacy records remain visible during transition
- structured Work mutations write directly to normalized tables
- structured Work is never saved back into the legacy JSON state blob
- current Auth/session and existing public/Knowledge/research systems remain in place

## Workbench bridge

Implemented on the reconciliation branch:

- structured Items and Work overlay into Workbench
- structured Queue / On bench / Waiting / Priority actions write directly to `work_records`
- structured cards are visually identified
- structured Work opens `bench.html` rather than the legacy Work page

## Bench Mode v1

`bench.html` currently supports:

- Start Bench Session
- Finish Bench Session
- live session duration
- Item and Work identity
- current checklist task
- next checklist task
- checklist completion
- active blockers / Part Needs
- Work notes
- structured measurements
- Problem / blocker recording and clearing
- recent measurements
- recent structured timing results

Quick action bar:

- Photo — live
- Note — live
- Measure — live
- Part — next bridge target
- Timing — next bridge target
- Problem — live

## Structured Work media

Migrations:

- `008_structured_work_media_ownership`
- `009_align_structured_media_categories`

`structured_media_assets` provides permanent Item / Work / checklist-step ownership for private media while reusing the existing `calibre-research-media` Storage bucket and upload queue.

`bench-capture.html` provides a workshop-first capture flow:

- Android camera input using `capture="environment"`
- gallery picker
- Progress / Movement / Fault / Part roles
- optional evidence note
- original + thumbnail upload through the existing media system
- structured Item + Work + checklist-step ownership
- automatic return to Bench Mode after save

No new Supabase Security Advisor findings were introduced by the structured media layer.

## Next bridge targets

1. Part / Donor quick action in Bench Mode.
2. Structured Timegrapher context and timing-run writes.
3. Recent structured media thumbnails in Bench Mode.
4. Archive / Restore UI in Items and inventory surfaces.
5. Continue reducing dependency on the legacy state blob only after acceptance tests prove parity.
