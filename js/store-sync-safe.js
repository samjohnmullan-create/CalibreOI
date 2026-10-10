import * as base from "./store-writeoff.js?v=1";
import { readCloudState } from "./cloud.js?v=3";

export * from "./store-writeoff.js?v=1";

const stamp = value => {
  const n = Date.parse(value || "");
  return Number.isFinite(n) ? n : 0;
};

function mergeById(local = [], cloud = []) {
  const map = new Map();
  for (const raw of [...(Array.isArray(cloud) ? cloud : []), ...(Array.isArray(local) ? local : [])]) {
    if (!raw || typeof raw !== "object") continue;
    const id = String(raw.id || "");
    if (!id) continue;
    const previous = map.get(id);
    if (!previous) { map.set(id, structuredClone(raw)); continue; }
    const rawStamp = stamp(raw.updatedAt || raw.createdAt);
    const previousStamp = stamp(previous.updatedAt || previous.createdAt);
    map.set(id, structuredClone(rawStamp >= previousStamp ? raw : previous));
  }
  return [...map.values()];
}

function mergeFitEvidence(local = [], cloud = []) {
  return mergeById(local, cloud).sort((a, b) => String(b.at || "").localeCompare(String(a.at || "")));
}

function rescueCloudCollections(state, cloudState) {
  if (!state || !cloudState) return false;
  let changed = false;
  const collections = [["items", mergeById],["workRecords", mergeById],["partFitEvidence", mergeFitEvidence]];
  for (const [key, merge] of collections) {
    const before = Array.isArray(state[key]) ? state[key] : [];
    const remote = Array.isArray(cloudState[key]) ? cloudState[key] : [];
    const merged = merge(before, remote);
    if (merged.length !== before.length || merged.some((x, i) => x?.id !== before[i]?.id || stamp(x?.updatedAt || x?.at) !== stamp(before[i]?.updatedAt || before[i]?.at))) changed = true;
    state[key] = merged;
  }
  return changed;
}

// Cloud rescue is retained for explicit/background reconciliation, but it must never
// sit on the critical rendering path. cloud-auto.js already checks cloud changes and
// forceCloudPull() performs the authoritative merge when required.
export async function rescueFromCloud(state) {
  try {
    const remote = await readCloudState();
    if (remote?.signedIn && remote.state) rescueCloudCollections(state, remote.state);
  } catch (error) {
    console.warn("Calibre cloud collection rescue skipped", error);
  }
  return state;
}

export async function loadState() {
  return base.loadState();
}

export async function saveState(state) {
  return base.saveState(state);
}
