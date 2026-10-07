# Calibre & Co. — Phase 2: Timegrapher Signal Intelligence

## Objective
Turn the Timegrapher from a basic acoustic interval detector into a trustworthy workshop aid for mechanical watches, while keeping the beginner experience simple.

## Implemented

### Audio detector
- Uses audio-sample timing rather than UI redraw timing.
- Uses sharp-transient energy as well as raw microphone level.
- Maintains separate raw and high-frequency noise floors.
- Adaptive detection threshold avoids learning loud ticks as ambient noise.
- Rejects obvious broad handling noise.
- Rejects clipped acoustic events.
- 70 ms event hold-off suppresses multiple peaks from one acoustic event while remaining compatible with supported beat rates through 36,000 BPH.
- Reports RMS, peak, noise floor, threshold, clipping and transient diagnostics.

### Timing analysis
- Supported standard rates: 14,400 / 18,000 / 19,800 / 21,600 / 25,200 / 28,800 / 36,000 BPH.
- Auto BPH scoring considers coverage, residual error and direct-beat continuity.
- Missed events are tolerated by recognising 2x–4x multiples of the nominal beat interval.
- Rate calculation uses robust median-normalised intervals rather than a simple average.
- Median absolute deviation filtering removes timing outliers.
- Confidence includes sample count, jitter, event continuity and BPH lock quality.
- Beat error is only reported from a sufficiently long uninterrupted run of alternating single-beat intervals.
- If a missed event breaks parity, beat error is withheld rather than guessed.
- Beginner advice explicitly asks for confirmation in another position before regulating.

### Beginner UI already in place
- Live rate with slow / zero / fast guide.
- Signal-quality indication.
- Stability, BPH and confidence surfaced beside the primary reading.
- Quick setup guide.
- General nominal guide for vintage mechanical watches.
- Position selector and Next Position workflow.
- Audio-device selector, remembered preferred microphone and automatic fallback.
- Clear microphone error messages.
- Advanced diagnostics kept below the primary workflow.
- No fabricated amplitude figure.

## General guide shown in the app
These are deliberately workshop guides, not manufacturer specifications:
- Rate: about ±15 s/day as a practical general serviced-vintage target.
- Beat error: ≤0.6 ms as a useful general target; ~1.0 ms or more deserves closer attention.
- Confidence: 80%+ is treated as a strong reading.
- Positional testing: at least two positions for a quick comparison; six positions for a fuller picture.

Calibre-specific or manufacturer data must override these values whenever known.

## Hardware validation still required
The detector is implemented, but it is not considered calibrated until tested against real watch/contact-microphone recordings.

Test set should include:
- quiet healthy movement,
- weak/low-amplitude movement,
- loud movement,
- balance/escapement fault,
- 18,000 BPH,
- 21,600 BPH,
- 28,800 BPH,
- deliberate bench knock,
- finger/holder handling noise,
- intermittent microphone contact,
- multiple watch positions.

## Phase 2 acceptance criteria
Phase 2 is considered validated when:
1. BPH locks correctly on repeated real-watch tests without frequent standard-rate hopping.
2. A single missed tick does not cause the displayed rate to jump materially.
3. Typical handling/bench noises do not create a sustained false timing lock.
4. Confidence falls when detections become intermittent.
5. Beat error disappears when parity cannot be trusted and returns after a clean uninterrupted run.
6. Rate remains reasonably stable over a 20–30 second stationary run.
7. Saved runs preserve BPH, rate, beat error (when trusted), confidence, position, phase and microphone metadata.
8. Beginner guidance never presents a low-confidence result as a trustworthy adjustment instruction.

## Deliberately deferred
- True amplitude measurement. Microphone loudness is not amplitude.
- Movement-specific lift-angle automation until reliable calibre/specification data is available.
- Final detector constants until real contact-microphone recordings are available.
- Automatic regulation instructions beyond conservative directional guidance.
