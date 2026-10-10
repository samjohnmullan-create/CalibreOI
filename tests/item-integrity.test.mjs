import test from "node:test";
import assert from "node:assert/strict";
import { ensureAllJobItemLinks, ensureItemForJob, itemIntegrityReport } from "../js/item-integrity.js";

function job(id, partial = {}) {
  return {
    id,
    jobId: `JOB-${id}`,
    jobType: "watch",
    status: "Purchased",
    watchName: `Watch ${id}`,
    passport: { maker: "Test", model: id },
    business: {},
    ...partial
  };
}

test("creates a stable Item for a legacy watch job", () => {
  const state = { jobs: [job("a1")], items: [] };
  const result = ensureAllJobItemLinks(state);

  assert.equal(result.created, 1);
  assert.equal(state.items.length, 1);
  assert.equal(state.items[0].id, "item-a1");
  assert.equal(state.jobs[0].itemId, "item-a1");
  assert.equal(state.items[0].watch.specialistJobId, "a1");
  assert.equal(itemIntegrityReport(state).healthy, true);
});

test("migration is idempotent and does not duplicate Items", () => {
  const state = { jobs: [job("a1")], items: [] };
  ensureAllJobItemLinks(state);
  const first = structuredClone(state);
  const second = ensureAllJobItemLinks(state);

  assert.equal(second.created, 0);
  assert.equal(state.items.length, 1);
  assert.equal(state.jobs[0].itemId, first.jobs[0].itemId);
  assert.equal(state.items[0].id, first.items[0].id);
});

test("preserves an existing explicit Item link", () => {
  const state = {
    jobs: [job("a1", { itemId: "custom-item" })],
    items: [{ id: "custom-item", type: "watch", title: "Existing", purpose: "resale", status: "Acquired", identity: {}, commercial: {}, preparation: {}, research: [], mediaAssets: [], workIds: [], tags: [], watch: { passport: {}, movement: {}, timingHistory: [], serviceHistory: [], publicPassport: {} } }]
  };

  const result = ensureItemForJob(state, state.jobs[0]);
  assert.equal(result.created, false);
  assert.equal(state.items.length, 1);
  assert.equal(state.jobs[0].itemId, "custom-item");
  assert.equal(state.items[0].watch.specialistJobId, "a1");
});

test("inspection-only legacy jobs become general accessory Items", () => {
  const state = { jobs: [job("inspect-1", { jobType: "inspect" })], items: [] };
  ensureAllJobItemLinks(state);

  assert.equal(state.items[0].type, "accessory");
  assert.equal("watch" in state.items[0], false);
  assert.equal(state.jobs[0].itemId, state.items[0].id);
});

test("integrity report detects broken links and duplicate Item IDs", () => {
  const state = {
    jobs: [job("a1", { itemId: "missing" })],
    items: [{ id: "dup" }, { id: "dup" }]
  };
  const report = itemIntegrityReport(state);

  assert.equal(report.healthy, false);
  assert.deepEqual(report.unlinkedJobs, ["a1"]);
  assert.deepEqual(report.duplicateItemIds, ["dup"]);
});
