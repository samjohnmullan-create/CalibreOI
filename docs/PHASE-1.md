# Active Build — Phase 1

This file is the working execution plan for the current Calibre development cycle. The wider direction lives in [`ROADMAP.md`](../ROADMAP.md).

## Objective

Make Calibre feel like one deliberate product and prepare the timing system for the incoming USB/contact microphone.

## Workstream A — Brand & design system

### Palette — Warm Instrument
The visual direction is now **graphite + ivory + restrained bronze**, with warm neutral greys. Blue is not part of the core brand palette.

Working tokens:
- Dark background: `#11110F`
- Dark surface: `#191815`
- Dark raised surface: `#22211D`
- Dark text: `#F1EEE7`
- Dark muted text: `#969188`
- Dark divider: `#312F2A`
- Dark accent: `#B98248`
- Light background: `#F3F0E9`
- Light surface: `#FAF8F3`
- Light raised surface: `#E8E3D9`
- Light text: `#1A1916`
- Light muted text: `#706C64`
- Light divider: `#D5CEC2`
- Light accent: `#95652E`

Design rules:
- [x] Drop Horological Blue as the brand direction.
- [ ] Test Warm Instrument across Home, Workshop, Collection, Business and Calibre.
- [ ] Keep bronze/amber as a restrained interaction accent, not a background colour.
- [ ] Check contrast in dark and light appearances.
- [ ] Replace legacy `--brass` / `--brass-soft` naming with semantic accent tokens while keeping temporary compatibility aliases.
- [ ] Reduce borders and nested cards; rely more on spacing, hierarchy and subtle surface changes.
- [ ] Make desktop approximately 20–30% denser while keeping mobile touch targets comfortable.
- [ ] Use colour sparingly for active state, focus, timing markers, important actions and key data.

### Logo
- [ ] Explore abstract C / calibre geometry.
- [ ] Explore reduced escapement geometry.
- [ ] Explore timing/balance oscillation geometry.
- [ ] Design the mark to work first in monochrome (ivory on graphite / graphite on ivory).
- [ ] Treat bronze as optional accent, never required for recognition.
- [ ] Test finalists at 16 px, 32 px, app icon, mobile header and desktop header.
- [ ] Produce SVG-first final assets.

## Workstream B — Shell & density

- [ ] Keep only Home / Workshop / Collection / Business / Calibre as primary navigation.
- [ ] Reduce desktop header/nav visual weight.
- [ ] Standardise page-heading height and spacing.
- [ ] Reduce nested card-on-card layouts.
- [ ] Build shared compact metric and action components.
- [ ] Keep mobile controls touch-friendly.
- [ ] Simplify the Calibre page around intelligence/system actions.
- [ ] Make navigation visually recessive so the current watch/work area dominates.

## Workstream C — Timegrapher hardware foundation

### First implementation
- [ ] Request audio permission.
- [ ] Enumerate audio input devices with `navigator.mediaDevices.enumerateDevices()`.
- [ ] Add explicit microphone selector.
- [ ] Persist preferred timing microphone when possible.
- [ ] Show device label and AudioContext sample rate.
- [ ] Detect disconnection/device change.
- [ ] Add a diagnostic panel showing RMS, peak, adaptive noise floor and threshold.

### Real-hardware test protocol
When the contact microphone arrives, capture results for at least:

1. one healthy 18,000 BPH movement
2. one 21,600 BPH movement if available
3. one 28,800 BPH movement if available
4. a weak/low-amplitude vintage movement
5. deliberate bench/handling noise

For each test record:
- device/OS/browser
- AudioContext sample rate
- selected gain
- known/reference BPH
- Calibre-detected BPH
- rate from Calibre
- rate from a known timegrapher if available
- beat error comparison if available
- false/missed ticks
- notes about mic contact and placement

Do not tune the detector solely around one watch.

## Workstream D — Timing engine upgrade

Only start this after real contact-mic samples are available.

Target pipeline:

`audio → filter → transient detector → event classifier → interval series → BPH lock → rate/beat analysis`

- [ ] Move from block peak detection to sample/event detection.
- [ ] Add configurable filtering.
- [ ] Add handling-noise rejection.
- [ ] Track false/drop event evidence.
- [ ] Improve auto BPH lock using multiple interval hypotheses.
- [ ] Improve beat-error calculation using classified alternating events.
- [ ] Rebuild trace from timing residuals rather than presentation-only rate dots.
- [ ] Investigate defensible amplitude calculation; keep hidden until validated.

## Workstream E — Saved timing workflow

- [ ] Preserve before/during/after/regulation/final tags.
- [ ] Add pre-service vs final comparison.
- [ ] Add six-position guided sequence.
- [ ] Calculate average rate and maximum positional delta.
- [ ] Store hardware/device metadata with timing runs.
- [ ] Surface timing history from the Passport.

## Definition of done for this phase

Phase 1 is complete when:

- Calibre has a settled visual direction and usable logo system.
- Desktop looks compact and intentional without harming mobile usability.
- The Calibre hub is simplified.
- Android and Windows can explicitly select the external timing microphone.
- Diagnostic audio information is visible enough to tune the detector intelligently.
- Real-hardware test data has been captured.
- The next timing-engine work is based on evidence rather than guesses.
