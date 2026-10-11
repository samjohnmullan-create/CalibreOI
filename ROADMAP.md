# Calibre & Co. — Canonical Roadmap

_Last revised: 11 October 2026_

## Product direction

Calibre is an item lifecycle and workshop operating system for watches, clocks, jewellery, accessories and small collectibles.

**Item is permanent. Work is activity.**

The broad lifecycle is:

**Acquire → Identify → Research → Inspect → Work → Document → Value → Sell → Preserve**

Watch and clock Items additionally support:

**Diagnose → Service → Parts → Measure → Time → QC → Passport**

## Canonical Core v2

Core v2 contains only first-class records. Legacy Jobs are not part of the target architecture.

```text
Item
├── Identity
├── Condition
├── Research
├── Commercial
├── Sale
├── Media
├── Work[]
└── Watch extension?
    ├── Passport
    ├── Movement
    ├── Timing history
    └── Public Passport

Work
├── Item ID
├── Type / status
├── Diagnosis
├── Faults
├── Stages
├── Measurements
├── Parts
├── Labour
├── Timing runs
├── Repair performed
├── Next action / blocker
└── Final QC
```

Other first-class collections:

- MediaAsset
- InventoryResource
- CompatibilityEvidence
- Incoming
- Knowledge
- Settings

`js/core-v2.js` is the canonical legacy-free schema contract.

## Navigation rule

Calibre has five primary destinations only:

1. **Home** — attention: what needs me now?
2. **Items** — every physical Item owned or previously owned.
3. **Workbench** — active or deliberately queued Work only.
4. **Business** — portfolio money, sourcing and sales intelligence.
5. **Calibre** — assistant, inbox, capture, knowledge and settings.

New features do not automatically get new destinations. They attach to Item, Work, Business or Calibre.

`js/navigation-model.js` is the canonical navigation contract.

## Item workspace

Every Item is organised into three mental models:

### Work
What am I physically doing?

Watch / clock: Diagnosis · Service · Measurements · Timing · Parts · QC

Jewellery: Inspect · Clean · Restore · Measurements · QC

### Item
What is it?

Identity · Passport where applicable · Research · Media · History · Documents

### Commerce
What did it cost and how do I sell it?

Costs · Valuation · Listing · Sale

## Workbench

Workbench is task-oriented, not an inventory dashboard.

- **Now** — on bench / high priority
- **Next** — ready to start / awaiting inspection
- **Waiting** — parts / external work / research
- **Ready** — QC / photos / listing
- **Queue** — intentionally parked

Every row/card should answer:

- What is it?
- What Work is happening?
- What is next?
- What is blocking it?

## Global find / command layer

Calibre will gain one global search/command surface usable from keyboard and touch.

Target examples:

- open an Item by name, calibre, serial or tag
- filter awaiting parts / sold / donors
- start Work
- capture image
- add part
- time watch
- print label
- create listing

Desktop target shortcut: **Ctrl/Cmd + K**.

## Device modes

The same app will support:

- **Automatic** — default responsive mode
- **Workstation** — DeX / monitor / keyboard and mouse; compact and information-dense
- **Touch** — phone / bench; large targets and reduced simultaneous controls
- **Capture** — Galaxy Tab / microscope station; minimal capture-first UI

## Legacy cutover policy

The progressive compatibility migration is retired.

Before cutover:

1. create a frozen full legacy export
2. convert useful legacy information into Item + Work + Media records
3. log data that cannot be mapped cleanly
4. verify the converted state

After cutover:

- `state.jobs` is no longer loaded by the active app
- `currentId` is replaced by `currentItemId` and `currentWorkId`
- legacy Job ↔ Item bridges are removed
- Job-derived service history is replaced by Work history
- compatibility code remains only in the one-shot migration/archive tooling

Preservation is useful, but the new model will not be distorted to retain obsolete fields.

# Immediate build order

1. **Define Core v2 schema** — IN PROGRESS / foundation added.
2. **Lock navigation architecture** — IN PROGRESS / canonical map added.
3. **Design/build Item workspace: Work · Item · Commerce.**
4. **Rebuild Workbench around Work only.**
5. **Build global search / command palette.**
6. **Create full legacy backup and one-shot converter.**
7. **Cut active runtime over to Core v2 and remove legacy Job bridges.**
8. **Simplify persistence/store layer around canonical collections.**
9. **Consolidate design system and remove CSS injected from JavaScript.**
10. **Add Workstation / Touch / Capture interface modes.**
11. **Finish Galaxy Tab microscope Capture workflow.**
12. **Build proactive next-action / diagnostic / QC intelligence.**
13. **Build parts, donor and compatibility intelligence.**
14. **Finish business / finance intelligence.**
15. **Build intake automation for purchases, email and arrivals.**
16. **Build Print Queue / hardware bridge.**
17. **Validate Timegrapher with real hardware.**
18. **Finish listing automation, public Passport and customer-facing layer.**

# UI direction

Calibre should feel like a precision workshop instrument, not a collection of SaaS cards.

### Workstation
- compact rows and tables where appropriate
- split panes
- slim sidebars
- sticky context headers
- collapsible detail panels
- fewer oversized headings
- reduced vertical padding

### Phone
- stacked content
- larger touch targets
- fewer controls visible at once
- persistent contextual actions where useful

### Context
Use breadcrumbs such as:

**Items › Olma Caravelle › Work › Full Service**

The user should never need to remember the page structure to know where they are.

# Design system

The settled visual direction remains quiet sage + graphite, modern and restrained.

Do not introduce a second brand palette inside runtime JavaScript. Design tokens and responsive rules belong in shared CSS.

# Later phases retained

Once Core v2 and navigation are stable, continue with:

- media/capture
- workshop intelligence
- donor/parts matching
- business analytics
- intake automation
- printing
- timegrapher validation
- sales/listing automation
- public Passport / storefront
- accumulated Calibre Knowledge

# Success tests

Calibre is moving in the right direction when:

- every physical object has one Item identity
- every activity is a Work record
- a watch may have many Work records without duplicating its Passport
- Workbench shows Work, not inventory
- adding a feature does not require adding another navigation destination
- any important Item or command can be found quickly
- the same data drives bench work, history, finance and sale output
- phone, DeX/monitor and Galaxy Tab each feel intentional
- legacy Jobs are no longer required by the active runtime
