# Calibre Media Architecture

## Goal

Media is a first-class record attached to an Item and optionally to Work. Files live in private storage; Calibre state stores lightweight metadata and references.

## Canonical Media Asset

```text
mediaAsset
├── id
├── itemId
├── workId
├── legacyWatchId
├── legacyJobId
├── stageId
├── category
├── role
├── storageKey
├── url
├── thumbnailUrl
├── originalName
├── mimeType
├── bytes
├── width / height
├── checksum
├── caption
├── evidenceNote
├── visibility
├── isCover
├── createdAt
└── updatedAt
```

## Categories

`original · identity · movement · workshop · documents · sale`

## Rules

1. Existing legacy photo arrays remain readable during migration.
2. Full-resolution files remain outside the main synced state payload.
3. `itemId` is the permanent owner of media where known.
4. `workId` is optional and points at the activity that produced the media.
5. Legacy `watchId` / `jobId` are preserved as compatibility aliases while older records are migrated.
6. A media record must not become public merely because the Item or Passport is public.
7. Thumbnails/previews are derived representations, not replacements for originals.
8. Cover selection is metadata (`isCover`), not a duplicate copy of a file.
9. Broken references are reported by System Health rather than silently discarded.
10. Storage-provider details stay behind the media service so the rest of Calibre consumes the same asset shape.

## Migration sequence

1. Introduce and test the canonical Media Asset model.
2. Make existing uploads return canonical assets while retaining legacy aliases.
3. Attach newly uploaded watch media to stable `itemId` when available.
4. Add Item media views and listing-pack selection using the same records.
5. Backfill legacy media metadata progressively; do not rewrite old photo arrays destructively.
6. Add thumbnail generation and upload retry queue.
7. Add orphan-file/reference reconciliation once storage listing support is available.
