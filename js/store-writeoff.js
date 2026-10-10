import * as enhanced from "./store-enhanced.js?v=2";
import { reconcileWriteOffs } from "./writeoff-integrity.js?v=1";
import { reconcileMediaOwnership } from "./media-state.js?v=1";

export * from "./store-enhanced.js?v=2";
export { reconcileWriteOffs } from "./writeoff-integrity.js?v=1";
export { reconcileMediaOwnership } from "./media-state.js?v=1";

// Reads must stay read-only. Reconciliation belongs on save or explicit mutation,
// not on every job opening.
export async function loadState() {
  return enhanced.loadState();
}

export async function saveState(state) {
  reconcileWriteOffs(state);
  reconcileMediaOwnership(state);
  return enhanced.saveState(state);
}
