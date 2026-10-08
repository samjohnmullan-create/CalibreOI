# Calibre job card

A ChatGPT-generated card is a JSON file named `cards/<pushId>.calibrejob`.

## Required

- `type`: `calibrejob`
- `version`: `5`
- `pushId`: unique stable slug for this watch/job
- `watchName`

Older cards remain supported.

## Version 5 principle

Research should be structured where it belongs rather than duplicated in one giant notes field:

- **Passport** = identity, history, provenance, evidence and sources
- **Business** = purchase costs and quick / expected / optimistic sale values
- **diagnosticFaults** = possible, confirmed and ruled-out faults
- **parts** = parts already identified for the job
- **stages** = stage-specific instructions and observations
- **researchBrief** = cross-cutting researched intake guidance for the bench

## `researchBrief`

```json
{
  "summary": "Concise research conclusion for the watch and job.",
  "technicalNotes": "Important calibre-specific or construction notes.",
  "valuationConfidence": "Low | Moderate | High",
  "valuationBasis": "Why the valuation range is reasonable and what may change it.",
  "partsLeads": [
    {
      "part": "Balance staff",
      "reference": "Factory #857",
      "compatibility": "Provisional until pivots and seats are measured",
      "confidence": "Probable",
      "source": "Reference URL or publication",
      "notes": "Any ordering warning or dimensional note"
    }
  ],
  "repairPlan": [
    "Inspect balance pivots and jewels before ordering parts",
    "Proceed to full service if the staff fault is confirmed"
  ],
  "nextChecks": [
    "Check endshake and sideshake",
    "Check balance wheel true and flat"
  ],
  "risks": [
    "Do not repeatedly wind or run until the balance fault is understood"
  ],
  "references": [
    "Additional technical reference if it does not belong in Passport sources"
  ]
}
```

The Workbench renders this as a compact **Research brief** above the repair workflow. If an older card has no `researchBrief`, Calibre derives useful bench guidance from existing diagnosis, service notes, parts, active diagnostic faults, Passport warnings and valuation text.

## Current job data

Version 5 can carry the complete working job, including:

- `jobId`, status, job type and service decision
- Passport / identity / research sources
- business values and sale targets (`minSale`, `targetSale`, `optimisticSale`)
- workflow stages, checks, notes and stage photos
- `faults` (confirmed legacy summary)
- `diagnosticFaults` with Possible / Confirmed / Ruled-out state and source check
- parts
- timing runs
- job photos
- diagnosis and repair performed
- service direction / service notes
- `researchBrief`

## Pre-job photos

Photos supplied during identification/research should be treated as the watch's pre-job record rather than workshop-progress photos.

- Put stable photo URLs in `photos.intake` so they appear with the job's intake images.
- Where `mediaAssets` are supplied, use category `original`, link them to the job/watch, and describe the view in `caption` or `evidenceNote`.
- Keep movement, dial, caseback and damage images in the pre-job set even when the same image is also useful as identity evidence.
- ChatGPT-generated job cards should include all usable supplied pre-job photos whenever stable storage URLs are available.

Import remains tolerant of older cards; missing fields are normalised by the store layer.

## One-tap link

`https://samjohnmullan-create.github.io/CalibreOI/?card=<pushId>`

Put that URL in the card as `importUrl`. The matching `cards/<pushId>.calibrejob` file must be committed to this repo before the link can load it.
