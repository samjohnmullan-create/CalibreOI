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

Import remains tolerant of older cards; missing fields are normalised by `store.js`.

## One-tap link

`https://samjohnmullan-create.github.io/CalibreOI/?card=<pushId>`

Put that URL in the card as `importUrl`. The matching `cards/<pushId>.calibrejob` file must be committed to this repo before the link can load it.
