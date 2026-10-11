# Calibre Knowledge Engine

_Last revised: 12 October 2026_

The Calibre Knowledge Engine is the shared horology reference layer used by Passport, Timegrapher, Movement Finder, Workbench, donor intelligence, parts inventory, Capture, Auction Triage, Business and Listings.

It is not a second Item database. Items reference knowledge; they do not duplicate it.

## Purpose

A single researched fact should be reusable everywhere.

Examples:
- a verified calibre BPH should configure the Timegrapher and appear in Passport
- a factory stem reference should power donor matching, parts inventory and sourcing
- a serial-range material change should prevent a bad donor recommendation
- a movement alias should improve identification, listing copy and auction triage
- a technical document should surface inside Workbench when that calibre is active

## Evidence hierarchy

1. Exact factory part plus matching serial range
2. Documented identical movement
3. Exact shared factory part number
4. Explicit documented interchange
5. Alias / base-calibre relationship
6. Shared catalogue/reference material
7. Family-reported shared reference
8. Same documented movement family
9. Dimensional candidate requiring measurement/modification

Family membership is never proof that a specific component fits.

## Knowledge domains

### Movement identity
- maker
- calibre
- aliases
- base calibre
- movement family
- generation/variant
- country
- launch/production era

### Movement specification
- diameter
- height
- jewels
- winding type
- movement type
- complications
- power reserve
- BPH
- frequency
- lift angle where verified

### Parts
- normalized part type
- manufacturer/factory reference
- material catalogue reference
- calibre applications
- serial-range applications
- dimensions where available
- interchange evidence

### Compatibility
Compatibility is stored as evidence, not a single magic boolean.

Each relationship should preserve:
- source movement
- candidate donor movement
- component/scope
- evidence type
- confidence
- source/provenance
- exceptions
- modification requirement
- serial restrictions

### Documents
Index technical sheets, parts sheets, exploded diagrams and service/reference documents by maker and calibre scope. Store discovery links and metadata rather than copying entire external libraries into Item records.

### Identification
Movement Finder can rank candidates from:
- maker/markings
- calibre marking
- diameter
- height
- jewel count
- BPH
- winding type
- seconds/calendar configuration
- later: bridge/plate geometry and image-derived landmarks

## Feature bindings

### Passport
Autofill known movement specifications and aliases after calibre confirmation.

### Timegrapher
Use verified BPH/frequency/lift angle before heuristics. If lift angle is unknown, leave it unknown or ask for manual selection; never invent it.

### Workbench
Surface relevant technical documents, expected movement specs and exact part references while servicing.

### Donor intelligence
Search order:
1. exact owned part
2. exact compatible owned donor
3. documented alias/base movement donor
4. family candidate
5. dimensional salvage candidate
6. external replacement/donor

### Parts inventory
A loose part is stored once by normalized reference. Compatible movements are calculated from knowledge rather than manually copied onto each stock entry.

### Capture / Movement Finder
Use measured and visual clues to rank movement candidates. Confirmation should link the Item to the knowledge record.

### Auction Triage
Use identified movements to estimate donor usefulness against:
- active repairs
- donor stock already owned
- scarce part demand
- likely external replacement cost
- completeness/value of the donor itself

### Business / repair economics
Before recommending donor sacrifice compare:
- owned donor cost basis
- donor completeness/value
- external replacement price
- external donor price
- restored watch value
- expected margin

### Listings
Reuse verified movement facts and aliases in listing research while keeping customer-facing copy separate from the raw technical record.

## Core integration

Core v2 already contains `compatibilityEvidence[]` and `knowledge[]`.

Recommended Item watch linkage:

```js
watch: {
  passport: {...},
  movement: {
    maker: 'ETA',
    calibre: '2824-2',
    knowledgeId: 24,
    confidence: 0.98,
    confirmed: true
  },
  timingHistory: [],
  publicPassport: {...}
}
```

Do not copy the full movement knowledge record into every Item.

## Runtime foundation

`js/knowledge-engine.js` exposes synchronous workshop lookups backed by the compact verified pack and hydrates the 18 rich verified profiles from Supabase when signed in. Movement Finder uses a separate server-side search against the full catalogue so phone/DeX startup does not download thousands of reference rows.

The full production database currently contains:
- 3,458 calibre records
- 736 normalized part references
- 1,172 calibre-part links
- 9,165 compatibility edges
- additional source, family, application, dimensional, brand, identification and document evidence

## Incremental research workflow

Production Knowledge is no longer updated by replacing one giant JSON blob.

`knowledge-admin.html` provides an allow-listed **Knowledge Editor / Research Inbox**. Ordinary authenticated accounts remain read-only.

Supported submission types:
- Source
- Family
- Calibre
- Part
- Calibre↔Part link
- Compatibility evidence

The workflow is:

1. Enter structured research and provenance.
2. Label its evidence level as **Confirmed**, **Supported** or **Candidate**.
3. Save it as **Draft** or **Ready**.
4. Review the staged submission.
5. Explicitly **Apply** it to shared Knowledge.
6. Store before/after data in the Knowledge change log.

Core Knowledge tables now have database-managed ID sequences, so a single new source, calibre, part or compatibility edge can be added safely without a bulk version import.

Corrections use the canonical Knowledge ID rather than maker/calibre text alone. This is important because some legitimate source records share the same maker/calibre label.

The apply operation is a `SECURITY INVOKER` database function and therefore does not bypass Row Level Security. Write policies require membership in the Knowledge editor allow-list.

## Research database and bulk releases

The original v25 research JSON remains useful as a provenance-rich bulk research snapshot and disaster-recovery/import source. A future v26-style bulk release can still be produced when substantial research warrants it, but routine additions and corrections should go through the incremental Research Inbox instead.

Owned-watch research remains separate from shared global reference data.

## Safety / quality rules

- retain source provenance
- preserve uncertainty
- do not promote family membership to guaranteed interchange
- respect serial-range changes
- exact factory part evidence outranks similarity
- dimensional candidates require measurement
- missing lift angle remains missing
- do not sacrifice a valuable complete donor for a cheap readily available part without an economics comparison
- do not silently overwrite reference truth from an Item or Work record
- bench-confirmed findings should be recorded as evidence with date/source context, not used to erase contradictory historical evidence
