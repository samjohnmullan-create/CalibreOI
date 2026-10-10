import * as enhanced from "./store-enhanced.js?v=2";
import { reconcileWriteOffs } from "./writeoff-integrity.js?v=1";

export * from "./store-enhanced.js?v=2";
export { reconcileWriteOffs } from "./writeoff-integrity.js?v=1";

// Reads must stay read-only. Write-off/donor reconciliation belongs on save or the
// explicit write-off action, not on every job opening.
export async function loadState() {
  return enhanced.loadState();
}

export async function saveState(state) {
  reconcileWriteOffs(state);
  return enhanced.saveState(state);
}
