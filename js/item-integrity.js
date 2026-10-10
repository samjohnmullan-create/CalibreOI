import { legacyJobToItem, normaliseItem } from "./item-model.js?v=4";

const text = value => value == null ? "" : String(value);

function findItemForJob(state, job) {
  const jobId = text(job?.id);
  const itemId = text(job?.itemId);
  return (state.items || []).find(item =>
    (itemId && text(item?.id) === itemId) ||
    (jobId && text(item?.legacyJobId) === jobId) ||
    (jobId && text(item?.watch?.specialistJobId) === jobId)
  ) || null;
}

function prepareLinkedItem(rawItem, job) {
  const item = normaliseItem(rawItem);
  item.legacyJobId = "";

  if (job?.jobType === "inspect" && item.type === "watch") {
    item.type = "accessory";
    delete item.watch;
  } else if (item.type === "watch" || item.type === "clock") {
    item.watch = item.watch && typeof item.watch === "object" ? item.watch : {};
    item.watch.specialistJobId = text(job?.id) || text(item.watch.specialistJobId);
  }

  return item;
}

export function ensureItemForJob(state = {}, job = null) {
  if (!job || !job.id) return { item: null, changed: false, created: false };
  state.items = Array.isArray(state.items) ? state.items : [];

  let item = findItemForJob(state, job);
  let created = false;
  let changed = false;

  if (!item) {
    item = legacyJobToItem(job);
    item.id = text(job.itemId) || `item-${job.id}`;
    item = prepareLinkedItem(item, job);
    state.items.push(item);
    created = true;
    changed = true;
  } else {
    const index = state.items.findIndex(candidate => text(candidate?.id) === text(item.id));
    const before = JSON.stringify(item);
    item = prepareLinkedItem(item, job);
    if (index >= 0) state.items[index] = item;
    if (before !== JSON.stringify(item)) changed = true;
  }

  if (text(job.itemId) !== text(item.id)) {
    job.itemId = text(item.id);
    changed = true;
  }

  return { item, changed, created };
}

export function ensureAllJobItemLinks(state = {}) {
  state.jobs = Array.isArray(state.jobs) ? state.jobs : [];
  state.items = Array.isArray(state.items) ? state.items : [];

  let changed = false;
  let created = 0;
  let linked = 0;

  for (const job of state.jobs) {
    const result = ensureItemForJob(state, job);
    if (!result.item) continue;
    if (result.created) created += 1;
    if (result.changed) changed = true;
    linked += 1;
  }

  state.itemModelVersion = Math.max(Number(state.itemModelVersion) || 0, 1);
  return { changed, created, linked };
}

export function itemIntegrityReport(state = {}) {
  const jobs = Array.isArray(state.jobs) ? state.jobs : [];
  const items = Array.isArray(state.items) ? state.items : [];
  const itemIds = new Set(items.map(item => text(item?.id)).filter(Boolean));
  const unlinkedJobs = jobs.filter(job => !job?.itemId || !itemIds.has(text(job.itemId)));
  const duplicateItemIds = [...items.reduce((map, item) => {
    const key = text(item?.id);
    if (key) map.set(key, (map.get(key) || 0) + 1);
    return map;
  }, new Map()).entries()].filter(([, count]) => count > 1).map(([id]) => id);

  return {
    jobs: jobs.length,
    items: items.length,
    unlinkedJobs: unlinkedJobs.map(job => text(job?.id)).filter(Boolean),
    duplicateItemIds,
    healthy: unlinkedJobs.length === 0 && duplicateItemIds.length === 0
  };
}
