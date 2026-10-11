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

The portable state includes:

- Items
- Work
- MediaAsset metadata/references
- Inventory resources and locations
- Compatibility evidence
- Incoming
- Knowledge
- Ledger
- Settings
- current Item / Work selection

It does not duplicate private full-resolution media files, authentication credentials or browser upload-queue blobs.

Restore validates the file before replacing local state. A newer unsupported schema is rejected rather than guessed at.

## Cloud overwrite protection

Normal `writeCloudState()` calls first inspect the cloud record timestamp.

If the cloud record changed after the timestamp this device last marked as seen, Calibre throws `CALIBRE_SYNC_CONFLICT` instead of overwriting it.

Normal `saveState()` still keeps the local save and stores the conflict/error status locally.

Resolution paths are explicit:

- **Safe cloud pull** — creates a local safety point, reads cloud state and merges canonical collections.
- **Safe cloud push** — creates a local safety point and intentionally force-writes the current local state.

### Known limitation

The current check and write are two separate remote operations. Another device could theoretically update the cloud row in the very small interval between them. Full atomic compare-and-swap requires a database-side revision/version guard and is future reliability hardening.

## System health

`js/system-health.js` checks:

- current schema version
- duplicate Item IDs
- duplicate Work IDs
- duplicate MediaAsset IDs
- orphan Work records
- orphan MediaAsset ownership
- MediaAssets with no storage reference
- stale current Item selection
- stale current Work selection
- canonical Item / Work / Media / Inventory / Knowledge counts

Health is diagnostic. It does not silently delete or rewrite suspect records.

## Audit trail

Meaningful reliability events are stored under `settings.reliability.auditTrail` and capped at 150 records.

Examples:

- portable backup downloaded
- local safety point created
- backup restored
- safe cloud pull completed
- safe cloud push completed

Routine autosaves are deliberately excluded to keep the history useful.

## Recovery UI

`backup.html` is now the canonical **Recovery & health** screen.

It provides:

- system health summary
- canonical record counts
- portable checked backup
- local safety snapshots and restore
- checked JSON restore
- safe cloud pull/push
- Item and Business CSV exports
- current Item export
- recent reliability audit events

The old Job-era backup/migration workflow is retired from the active Recovery screen.

## Next hardening

1. Add database-side atomic revision/compare-and-swap for cloud writes.
2. Add optional encrypted off-device scheduled backup destination.
3. Surface unresolved sync conflict prominently in Home/Calibre status.
4. Add recovery drill tests for intentionally corrupted and partial states.
5. Add a safe repair assistant for non-destructive integrity fixes.
