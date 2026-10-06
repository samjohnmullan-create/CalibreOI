// Calibre's public store entrypoint.
// All pages keep importing store.js; the cloud-aware wrapper preserves IndexedDB as the local cache.
export * from "./store-cloud.js?v=2";
