import * as enhanced from "./store-enhanced.js?v=2";
import { blankItem, legacyJobToItem, normaliseItem } from "./item-model.js?v=4";
import { SPARE_PARTS } from "./match.js?v=6";

export * from "./store-enhanced.js?v=2";

const CLOSED_JOB_STATUSES = new Set(["Spares", "Sold", "Ready to list", "Archived"]);
const now = () => new Date().toISOString();
const defaultSpares = () => SPARE_PARTS.map(p => ({ id:p.id, name:p.name, keep:p.id !== "dial" }));

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
  item.legacyJobId = "";
  item.updatedAt = now();
  item.tags = Array.isArray(item.tags) ? item.tags : [];
  for (const tag of ["donor", "spares", "written-off"]) if (!item.tags.includes(tag)) item.tags.push(tag);
  item.watch = item.watch && typeof item.watch === "object" ? item.watch : {};
  item.watch.specialistJobId = job.id || item.watch.specialistJobId || "";
  item.watch.sparesParts = Array.isArray(item.watch.sparesParts) && item.watch.sparesParts.length
    ? item.watch.sparesParts
    : (Array.isArray(job.sparesParts) && job.sparesParts.length ? structuredClone(job.sparesParts) : defaultSpares());
  item.watch.fitsNote = item.watch.fitsNote || job.fitsNote || "";
  item.watch.storageLocation = item.watch.storageLocation || job.storageLocation || "";
  appendWriteOffNote(item, job);
  return item;
}

function looksLikeWholeDonor(part) {
  const category = String(part?.category || "").toLowerCase();
  const name = String(part?.name || "").toLowerCase();
  return category === "movement / complete" || category === "complete movement" || /donor watch|movement set|complete movement/.test(name);
}

function migrateWholeDonors(state) {
  state.partsStock = Array.isArray(state.partsStock) ? state.partsStock : [];
  state.items = Array.isArray(state.items) ? state.items : [];
  const migrate = state.partsStock.filter(looksLikeWholeDonor);
  if (!migrate.length) return false;

  for (const part of migrate) {
    const sourceId = String(part.id || "");
    let item = state.items.find(x => String(x?.watch?.sourcePartsStockId || "") === sourceId);
    if (!item) {
      const notes = [part.notes, part.reference && `Reference / dimensions: ${part.reference}`, `Migrated from loose parts stock${sourceId ? ` (${sourceId})` : ""}.`].filter(Boolean).join("\n");
      item = blankItem({
        id: sourceId ? `item-donor-${sourceId}` : undefined,
        type: "watch",
        purpose: "donor",
        status: "Retained",
        title: part.name || "Donor watch / movement",
        condition: part.condition || "Used - unknown",
        notes,
        identity: { reference: part.reference || "", notes: part.notes || "" },
        commercial: { purchasePrice: part.cost || "", source: part.source || "" },
        tags: ["donor", "spares", "migrated-from-parts"],
        watch: {
          sourcePartsStockId: sourceId,
          storageLocation: part.location || "",
          fitsNote: part.donor || "",
          sparesParts: defaultSpares(),
          passport: { calibre: part.calibre || "", calibreFamily: "" },
          movement: { calibre: part.calibre || "", calibreFamily: "" }
        }
      });
      state.items.push(item);
    } else {
      item.purpose = "donor";
      item.status = "Retained";
      item.watch = item.watch || {};
      item.watch.storageLocation = item.watch.storageLocation || part.location || "";
      item.watch.sparesParts = Array.isArray(item.watch.sparesParts) && item.watch.sparesParts.length ? item.watch.sparesParts : defaultSpares();
      item.updatedAt = now();
    }
  }

  const migratedIds = new Set(migrate.map(x => String(x.id || "")));
  state.partsStock = state.partsStock.filter(x => !migratedIds.has(String(x.id || "")));
  state.donorMigrationAt = now();
  return true;
}

function reconcileWriteOffs(state) {
  if (!state || !Array.isArray(state.jobs)) return false;
  let changed = migrateWholeDonors(state);

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
      const next = state.jobs.find(other => other && String(other.id) !== String(job.id) && !CLOSED_JOB_STATUSES.has(String(other.status || "")));
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
