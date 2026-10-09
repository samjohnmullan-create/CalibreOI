import * as enhanced from "./store-enhanced.js?v=2";
import { legacyJobToItem, normaliseItem } from "./item-model.js?v=4";

export * from "./store-enhanced.js?v=2";

const CLOSED_JOB_STATUSES = new Set(["Spares", "Sold", "Ready to list", "Archived"]);
const now = () => new Date().toISOString();

function appendWriteOffNote(item, job) {
  const reason = String(job.writeOff || "").trim();
  if (!reason) return;
  const line = `Write-off: ${reason}`;
  const notes = String(item.notes || "");
  if (!notes.includes(line)) item.notes = [notes, line].filter(Boolean).join("\n");
}

function donorItemForJob(state, job) {
  state.items = Array.isArray(state.items) ? state.items : [];
  let item = state.items.find(x =>
    (job.itemId && String(x.id) === String(job.itemId)) ||
    (x.legacyJobId && String(x.legacyJobId) === String(job.id))
  );

  if (!item) {
    item = legacyJobToItem(job);
    item.legacyJobId = job.id || item.legacyJobId;
    state.items.push(item);
    job.itemId = String(item.id);
  } else {
    item = normaliseItem(item);
    const index = state.items.findIndex(x => String(x.id) === String(item.id));
    if (index >= 0) state.items[index] = item;
    job.itemId = String(item.id);
  }

  item.purpose = "donor";
  item.status = "Retained";
  item.updatedAt = now();
  item.tags = Array.isArray(item.tags) ? item.tags : [];
  for (const tag of ["donor", "spares", "written-off"]) {
    if (!item.tags.includes(tag)) item.tags.push(tag);
  }
  item.watch = item.watch && typeof item.watch === "object" ? item.watch : {};
  item.watch.specialistJobId = job.id || item.watch.specialistJobId || "";
  appendWriteOffNote(item, job);
  return item;
}

function reconcileWriteOffs(state) {
  if (!state || !Array.isArray(state.jobs)) return false;
  let changed = false;

  for (const job of state.jobs) {
    if (!job || job.status !== "Spares") continue;

    if (!job.completedAt) { job.completedAt = now(); changed = true; }
    if (!job.closedAt) { job.closedAt = job.completedAt; changed = true; }
    if (job.labour?.running) {
      job.labour.running = false;
      job.labour.startedAt = null;
      changed = true;
    }

    donorItemForJob(state, job);
    changed = true;

    if (String(state.currentId || "") === String(job.id || "")) {
      const next = state.jobs.find(other =>
        other && String(other.id) !== String(job.id) && !CLOSED_JOB_STATUSES.has(String(other.status || ""))
      );
      state.currentId = next?.id || null;
      changed = true;
    }
  }

  return changed;
}

export async function loadState() {
  const state = await enhanced.loadState();
  if (reconcileWriteOffs(state)) await enhanced.saveState(state);
  return state;
}

export async function saveState(state) {
  reconcileWriteOffs(state);
  return enhanced.saveState(state);
}
