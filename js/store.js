import { ensureSpares } from "./match.js";
export const JOB_TYPES = [
  ["manual", "Mechanical manual"],
  ["automatic", "Automatic"],
  ["quartz", "Quartz"],
  ["pocket", "Pocket watch"],
  ["clock", "Clock"],
  ["inspect", "Inspection only"]
];
export const STAGE_PATHS = {
  manual: ["Intake","Demagnetising","Strip-down","Inspection","Cleaning","Barrel & Mainspring","Train Test","Escapement","Balance","Lubrication","Regulation","Final QC"],
  automatic: ["Intake","Demagnetising","Strip-down","Inspection","Cleaning","Barrel & Mainspring","Rotor","Train Test","Escapement","Balance","Lubrication","Regulation","Final QC"],
  quartz: ["Intake","Case and strap","Battery","Inspection","Movement secure","Hands and calendar","Regulation","Final QC"],
  pocket: ["Intake","Demagnetising","Bow and pendant","Strip-down","Inspection","Cleaning","Barrel & Mainspring","Train Test","Escapement","Balance","Lubrication","Regulation","Final QC"],
  clock: ["Intake","Case","Inspection","Cleaning","Train Test","Escapement","Pendulum","Strike","Regulation","Final QC"],
  inspect: ["Intake","Inspection","Final QC"]
};
export const STAGES = STAGE_PATHS.manual;
export const FAULT_CHIPS = ["Crown/winder non-functional","Movement loose","Strap missing","Case scratched","Water resistance unverified"];
export const SEVERITIES = ["Minor","Moderate","Critical","Parts required"];
export function stagesFor(job){ return STAGE_PATHS[job && job.jobType] || STAGE_PATHS.manual; }
const DB = "calibre-co-v1";
const STORE = "kv";
let dbp;

function openDB(){
  if (dbp) return dbp;
  dbp = new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  return dbp;
}
function get(k){
  return openDB().then(db => new Promise((res, rej) => {
    const q = db.transaction(STORE).objectStore(STORE).get(k);
    q.onsuccess = () => res(q.result);
    q.onerror = () => rej(q.error);
  }));
}
function put(k, v){
  return openDB().then(db => new Promise((res, rej) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(v, k);
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  }));
}
export function uid(){ return "job-" + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4); }
export function slugify(s){ return String(s || "watch").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "watch"; }
export const PHOTO_SLOTS = [
  ["intake", "Intake"],
  ["caseback", "Caseback"],
  ["movement", "Movement"],
  ["dial", "Dial"],
  ["damage", "Damage"],
  ["progress", "Repair progress"],
  ["finished", "Finished watch"],
  ["hero", "Sales hero"]
];
export function blankPhotos(){
  return Object.fromEntries(PHOTO_SLOTS.map(([key]) => [key, []]));
}
export function blankPart(){ return { part:"", supplier:"", partNumber:"", quantity:"1", cost:"", ordered:"", received:false, fitted:false }; }
export function blankStage(){ return { notes:"", condition:"", parts:"", measure:"", complete:false, photos:[], checks:{}, updatedAt:null }; }
export function partsCost(job){
  return (job.parts || []).reduce((n, p) => n + (Number(p.cost) || 0) * (Number(p.quantity) || 1), 0);
}
export function coverPhoto(job){
  const shots = job && job.photos || {};
  for (const key of ["hero", "finished", "dial", "intake", "caseback", "movement", "damage", "progress"]) {
    if (shots[key] && shots[key][0]) return shots[key][0];
  }
  if (job && job.passport && job.passport.photos && job.passport.photos[0]) return job.passport.photos[0];
  for (const s of (job && job.stages) || []) if (s.photos && s.photos[0]) return s.photos[0];
  return "";
}
export function blankPassport(){
  return { maker:"", model:"", country:"", year:"", confidence:"Unknown", dialMarkings:"", movementMaker:"", calibre:"", calibreFamily:"", beatRate:"", powerReserve:"", settingType:"", jewels:"", movementType:"", movementMm:"", escapement:"", serial:"", caseNumber:"", reference:"", caseMaterial:"", caseStyle:"", casebackType:"", crystalType:"", crownType:"", lugWidth:"", width:"", height:"", thickness:"", complications:"", waterMark:"", strap:"", hallmarks:"", engravings:"", notes:"", history:"", warnings:"", auctionHouse:"", lotNumber:"", auctionDate:"", seller:"", invoiceNumber:"", listingText:"", invoicePhoto:"", sources:[], photos:[] };
}
export function blankBusiness(){
  return { purchasePrice:"", buyerPremium:"", postage:"", strapCost:"", batteryCost:"", partsCost:"", consumables:"", externalService:"", marketplaceFees:"", shippingToBuyer:"", otherCost:"", labourMinutes:"", labourRate:"", targetSale:"", actualSale:"", minSale:"", title:"", text:"" };
}
export function blankJob(partial = {}){
  const stages = STAGES.map(() => blankStage());
  const job = {
    id: uid(),
    pushId: partial.pushId || "",
    jobId: partial.jobId || "CCO-" + String(Math.floor(Math.random()*9000)+1000),
    watchName: partial.watchName || "Untitled watch",
    status: "on the bench",
    stage: 0,
    stages,
    timingRuns: [],
    passport: blankPassport(),
    business: blankBusiness(),
    chat: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  return normalise(Object.assign(job, partial, { stages: partial.stages || stages, passport: Object.assign(blankPassport(), partial.passport), business: Object.assign(blankBusiness(), partial.business) }));
}
export function normalise(job){
  job.jobType = STAGE_PATHS[job.jobType] ? job.jobType : "manual";
  const path = stagesFor(job);
  const existing = Array.isArray(job.stages) ? job.stages : [];
  const byName = {};
  existing.forEach((s, i) => {
    const name = (s && s.name) || STAGES[i];
    if (!name) return;
    byName[name] = Object.assign(blankStage(), s, { name, photos: (s && s.photos) || [], checks: (s && s.checks) || {} });
  });
  job.stages = path.map(name => byName[name] || Object.assign(blankStage(), { name }));
  job.passport = Object.assign(blankPassport(), job.passport, { photos: (job.passport && job.passport.photos) || [], sources: Array.isArray(job.passport && job.passport.sources) ? job.passport.sources : [] });
  job.photos = Object.assign(blankPhotos(), job.photos || {});
  PHOTO_SLOTS.forEach(([key]) => { job.photos[key] = Array.isArray(job.photos[key]) ? job.photos[key] : []; });
  job.business = Object.assign(blankBusiness(), job.business);
  if (!job.business.partsCost && job.business.repairCost) job.business.partsCost = job.business.repairCost;
  job.timingRuns = job.timingRuns || [];
  job.chat = job.chat || [];
  job.faults = (Array.isArray(job.faults) ? job.faults : []).filter(f => f && f.text).map(f => ({ text: f.text, severity: SEVERITIES.includes(f.severity) ? f.severity : "Moderate" }));
  job.parts = (Array.isArray(job.parts) ? job.parts : []).map(p => Object.assign(blankPart(), p, { received: !!p.received, fitted: !!p.fitted }));
  if (job.parts.length) job.business.partsCost = String(partsCost(job));
  job.labour = Object.assign({ running:false, startedAt:null }, job.labour || {});
  job.diagnosis = job.diagnosis || "";
  job.repairPerformed = job.repairPerformed || "";
  job.stage = Math.max(0, Math.min(path.length - 1, job.stage || 0));
  if (job.status === "spares") ensureSpares(job);
  else if (typeof job.fitsNote !== "string") job.fitsNote = "";
  return job;
}
export function markSpares(job){
  job.status = "spares";
  ensureSpares(job);
  return job;
}
function phenix(){
  return blankJob({ jobId:"CCO-0001", watchName:"Ph\u00e9nix 180 Pocket Watch", passport:{ maker:"Ph\u00e9nix", calibre:"180" } });
}
export async function loadState(){
  let state = await get("state");
  if (!state || !Array.isArray(state.jobs)){
    state = { jobs:[phenix()], currentId:null };
    state.currentId = state.jobs[0].id;
    await put("state", state);
  }
  state.jobs = state.jobs.map(normalise);
  if (!state.jobs.length){ state.currentId = null; return state; }
  if (!state.jobs.find(j => j.id === state.currentId)) state.currentId = state.jobs[0].id;
  return state;
}
export async function saveState(state){
  state.jobs.forEach(j => { j.updatedAt = new Date().toISOString(); });
  await put("state", state);
}
export function current(state){ return state.jobs.find(j => j.id === state.currentId) || state.jobs[0]; }
export function progress(job){
  const done = (job.stages || []).filter(s => s.complete).length;
  return Math.round(done / STAGES.length * 100);
}
export function money(n){
  const v = Number(n);
  if (!Number.isFinite(v)) return "$0.00";
  return v.toLocaleString("en-AU", { style:"currency", currency:"AUD" });
}
export function escapeHtml(s){
  return String(s ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;" }[c]));
}
export function labourCost(b){
  const mins = Number(b.labourMinutes) || 0;
  const rate = Number(b.labourRate) || 0;
  return mins / 60 * rate;
}
export function cashOut(b){
  return ["purchasePrice","buyerPremium","postage","strapCost","batteryCost","partsCost","consumables","externalService","marketplaceFees","shippingToBuyer","otherCost"].reduce((n, k) => n + (Number(b[k]) || 0), 0);
}
export function investment(b){ return cashOut(b); }
export function salePrice(b){ return Number(b.actualSale) || Number(b.targetSale) || 0; }
export function cashProfit(b){ const sale = salePrice(b); return sale ? sale - cashOut(b) : 0; }
export function profitAfterLabour(b){ return cashProfit(b) - labourCost(b); }
export function roi(b){ const out = cashOut(b); return out ? cashProfit(b) / out : 0; }
export function importCard(raw){
  const stages = STAGES.map((name, i) => {
    const src = (raw.stages || []).find(s => s && s.name === name) || (raw.stages || [])[i] || {};
    return Object.assign(blankStage(), {
      notes: src.notes || "",
      condition: src.condition || "",
      parts: src.parts || "",
      measure: src.measure || "",
      complete: !!src.complete,
      checks: src.checks || {},
      updatedAt: src.notes ? new Date().toISOString() : null
    });
  });
  const pushId = raw.pushId || slugify(raw.watchName || raw.jobId || "watch");
  return blankJob({
    pushId,
    watchName: raw.watchName || "Untitled watch",
    jobId: raw.jobId,
    status: raw.status || "on the bench",
    writeOff: raw.writeOff || "",
    fitsNote: raw.fitsNote || "",
    sparesParts: raw.sparesParts || [],
    passport: raw.passport || {},
    business: raw.business || {},
    timingRuns: raw.timingRuns || [],
    photos: raw.photos || {},
    stages
  });
}
export function exportCard(job){
  const pushId = job.pushId || slugify(job.watchName);
  return {
    type: "calibrejob",
    pushId,
    jobId: job.jobId,
    watchName: job.watchName,
    status: job.status,
    writeOff: job.writeOff || "",
    fitsNote: job.fitsNote || "",
    sparesParts: job.sparesParts || [],
    importUrl: "https://samjohnmullan-create.github.io/CalibreOI/?card=" + encodeURIComponent(pushId),
    passport: job.passport,
    business: job.business,
    timingRuns: job.timingRuns || [],
    photos: job.photos || blankPhotos(),
    stages: job.stages.map((s, i) => ({ name: STAGES[i], notes: s.notes, condition: s.condition, parts: s.parts, measure: s.measure, complete: s.complete, checks: s.checks || {} }))
  };
}
export async function compressImage(file){
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const scale = Math.min(1, 900 / Math.max(img.width, img.height));
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(img.width * scale));
    c.height = Math.max(1, Math.round(img.height * scale));
    c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.72);
  } finally { URL.revokeObjectURL(url); }
}
