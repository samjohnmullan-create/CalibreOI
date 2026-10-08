# Calibre job card

A ChatGPT-generated card is a JSON file named `cards/<pushId>.calibrejob`.

## Required

- `type`: `calibrejob`
- `version`: `4`
- `pushId`: unique stable slug for this watch/job
- `watchName`

## Current job data

Version 4 can carry the complete working job, including:

- `jobId`, status, job type and service decision
- Passport / identity / research sources
- business values and sale targets
- workflow stages, checks, notes and stage photos
- `faults` (confirmed legacy summary)
- `diagnosticFaults` with Possible / Confirmed / Ruled-out state and source check
- parts
- timing runs
- job photos
- diagnosis and repair performed

## Pre-job photos

Photos supplied during identification/research should be treated as the watch's pre-job record rather than workshop-progress photos.

- Put stable photo URLs in `photos.intake` so they appear with the job's intake images.
- Where `mediaAssets` are supplied, use category `original`, link them to the job/watch, and describe the view in `caption` or `evidenceNote`.
- Keep movement, dial, caseback and damage images in the pre-job set even when the same image is also useful as identity evidence.
- ChatGPT-generated job cards should include all usable supplied pre-job photos whenever stable storage URLs are available.

Import remains tolerant of older cards; missing fields are normalised by `store.js`.

## One-tap link

`https://samjohnmullan-create.github.io/CalibreOI/?card=<pushId>`

Put that URL in the card as `importUrl`. The matching `cards/<pushId>.calibrejob` file must be committed to this repo before the link can load it.
