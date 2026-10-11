# Calibre Reliability

_Last revised: 11 October 2026_

Reliability protects the canonical Core without creating another domain model.

## Principles

1. Local work must survive a cloud failure.
2. A device must not silently overwrite a cloud copy it has not seen.
3. Risky operations create a recoverable local safety point first.
4. Portable backups are canonical, schema-aware and corruption-checked.
5. Recovery metadata stays outside the Core unless it is genuinely durable product data.
6. Audit history records meaningful safety events, not every autosave or keystroke.
7. Health checks inspect the canonical Item → Work → MediaAsset graph.

## Local recovery ring

`js/store-cloud-core.js` keeps up to five browser-local safety snapshots under a non-Core IndexedDB key.

Safety points are created:

- periodically before normal overwrites (throttled to roughly six hours)
- before an explicit cloud pull
- before an explicit cloud push
- before restoring a local safety snapshot
- before restoring a portable JSON backup

Each snapshot uses the same checked backup envelope as a portable export.

These snapshots are intentionally not stored inside canonical Core state and are not synced to the cloud.

## Portable backup format

`js/reliability.js` owns the portable backup contract.

Current backup format: **2**.

A backup contains:

- backup type and format version
- canonical schema version
- export timestamp and reason
- corruption-detection checksum
- canonical Core state only

The portable state includes Items, Work, MediaAsset metadata/references, Inventory resources/locations, Compatibility evidence, Incoming, Knowledge, Ledger, Settings and current Item/Work selection.

It does not duplicate private full-resolution media files, authentication credentials or browser upload-queue blobs.

Restore validates the file before replacing local state. A newer unsupported schema is rejected rather than guessed at.

## Atomic cloud overwrite protection

`public.calibre_state` now carries a monotonically increasing `revision` column.

Normal browser writes call the authenticated database function `public.calibre_write_state(expected_revision, new_data)` rather than performing a direct upsert.

The function:

- runs as **SECURITY INVOKER**
- remains subject to the existing owner-only RLS policies
- is executable by `authenticated` only, not `anon` or `public`
- inserts a first row at revision 1
- updates an existing row only when its current revision equals the caller's expected revision
- increments revision atomically inside the same database statement
- returns no row when the expected revision is stale

A stale browser therefore receives `CALIBRE_SYNC_CONFLICT` and keeps its local save instead of overwriting a newer cloud copy.

Timestamps remain useful for display and fallback change detection, but **revision is authoritative for write concurrency**.

Resolution paths remain explicit:

- **Safe cloud pull** — creates a local safety point, reads cloud state, merges canonical collections and records the cloud revision now seen.
- **Safe cloud push** — creates a local safety point, reads the current remote revision and intentionally performs an atomic force-write against that revision. If another write races it, the operation fails safely and can be retried deliberately.

The database guard was verified inside a rolled-back authenticated transaction: a matching revision write succeeded and returned the incremented revision; a repeated stale revision write returned zero rows.

## System health

`js/system-health.js` checks current schema version, duplicate Item/Work/MediaAsset IDs, orphan Work, orphan MediaAsset ownership, MediaAssets with no storage reference, stale current Item/Work selection, and canonical record counts.

Health is diagnostic. It does not silently delete or rewrite suspect records.

## Audit trail

Meaningful reliability events are stored under `settings.reliability.auditTrail` and capped at 150 records. Routine autosaves are deliberately excluded.

## Recovery UI

`backup.html` is the canonical **Recovery & health** screen. It provides system health, record counts, portable checked backup, local safety snapshots/restore, checked JSON restore, safe cloud pull/push, exports and recent reliability audit events.

## Reliability status

The practical reliability foundation is now complete:

- canonical backup and checked restore
- local safety snapshot ring
- canonical integrity checks
- explicit safe pull/push
- lightweight audit trail
- atomic cloud revision guard
- conflict-safe local persistence

Further hardening can be added when needed rather than blocking intelligence work.

## Later hardening

1. Optional encrypted off-device scheduled backup destination.
2. Surface unresolved sync conflict more prominently in Home/Calibre status.
3. Recovery drill tests for intentionally partial/corrupt states.
4. Safe repair assistant for non-destructive integrity fixes.
