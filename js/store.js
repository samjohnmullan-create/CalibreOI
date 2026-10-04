/* Shared job store. Pages talk to this, never to each other. */
export const STAGES = [
  "Intake","Demagnetising","Strip-down","Inspection","Cleaning",
  "Barrel & Mainspring","Train Test","Escapement","Balance",
  "Lubrication","Regulation","Final QC"
];
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
    const r = db.transaction(STORE).objectStore(STORE).get(k);
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  }));
}
function put(k, v){
  return openDB().then(db => new Promise((res, rej) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(v, k);
    tx.oncomplete = res;
    tx.onerror = () => rej(tx.error);
  }));
}
export function uid(){ return "job-" + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4); }
export function blankStage(){ return { notes:"", condition:"", parts:"", measure:"", complete:false, photos:[], updatedAt:null }; }
export function blankJob(partial = {}){
  const stages = STAGES.map(() => blankStage());
  return {
    id: uid(),
    jobId: partial.jobId || "CCO-" + String(Math.floor(Math.random()*9000)+1000),
    watchName: partial.watchName || "Untitled watch",
    status: "on the bench",
    stage: 0,
    stages,
    timingRuns: [],
    passport: { maker:"", calibre:"", year:"", serial:"", caseMaterial:"", escapement:"", notes:"" },
    business: { purchasePrice:"", repairCost:"", otherCost:"", salePrice:"", title:"", text:"" },
    chat: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...partial,
    stages: partial.stages || stages
  };
}
function phenix(){
  return blankJob({
    jobId: "CCO-0001",
    watchName: "Ph\u00e9nix 180 Pocket Watch",
    passport: { maker:"Ph\u00e9nix", calibre:"180", year:"", serial:"", caseMaterial:"", escapement:"", notes:"" }
  });
}
export async function loadState(){
  let state = await get("state");
  if (!state || !Array.isArray(state.jobs) || !state.jobs.length){
    state = { jobs:[phenix()], currentId:null };
    state.currentId = state.jobs[0].id;
    await put("state", state);
  }
  if (!state.jobs.find(j => j.id === state.currentId)) state.currentId = state.jobs[0].id;
  state.jobs.forEach(normalise);
  return state;
}
function normalise(job){
  job.stages = job.stages || [];
  while (job.stages.length < STAGES.length) job.stages.push(blankStage());
  job.passport = Object.assign({ maker:"", calibre:"", year:"", serial:"", caseMaterial:"", escapement:"", notes:"" }, job.passport);
  job.business = Object.assign({ purchasePrice:"", repairCost:"", otherCost:"", salePrice:"", title:"", text:"" }, job.business);
  job.timingRuns = job.timingRuns || [];
  job.chat = job.chat || [];
}
export async function saveState(state){
  state.jobs.forEach(j => j.updatedAt = j.updatedAt || new Date().toISOString());
  await put("state", state);
}
export function current(state){ return state.jobs.find(j => j.id === state.currentId) || state.jobs[0]; }
export function progress(job){
  const done = job.stages.filter(s => s.complete).length;
  return Math.round(done / STAGES.length * 100);
}
export function money(n){
  const v = Number(n);
  if (!Number.isFinite(v)) return "$0.00";
  return v.toLocaleString("en-AU", { style:"currency", currency:"AUD" });
}
export function escapeHtml(s){
  return String(s ?? "").replace(/[&<>"']/g, c => ({ "&":"&","<":"<",">":">","\"":""","'":"&#39;" }[c]));
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
export function jobBrief(job){
  const st = job.stages.map((s, i) => {
    const bits = [s.complete ? "done" : "open", s.condition, s.parts, s.measure, s.notes].filter(Boolean);
    return bits.length ? `${i+1}. ${STAGES[i]}: ${bits.join(" | ")}` : null;
  }).filter(Boolean);
  const runs = (job.timingRuns || []).slice(0, 6).map(r =>
    `${r.position}: ${Number(r.rate).toFixed(1)} s/d, ${r.bph} BPH, BE ${r.beatError == null ? "n/a" : Number(r.beatError).toFixed(2)+" ms"}, amp ${r.amplitude ? Math.round(r.amplitude)+"\u00b0 est." : "n/a"}, ${r.confidence}%`
  );
  const p = job.passport, b = job.business;
  return [
    `Job ${job.jobId} \u2014 ${job.watchName} (${job.status})`,
    `Maker ${p.maker || "?"} \u00b7 calibre ${p.calibre || "?"} \u00b7 year ${p.year || "?"} \u00b7 serial ${p.serial || "?"} \u00b7 case ${p.caseMaterial || "?"} \u00b7 escapement ${p.escapement || "?"}`,
    p.notes ? `Passport notes: ${p.notes}` : "",
    st.length ? "Service:\n" + st.join("\n") : "Service: no stage notes yet.",
    runs.length ? "Timing:\n" + runs.join("\n") : "Timing: no saved runs.",
    `Costs AUD purchase ${b.purchasePrice || 0}, parts ${b.repairCost || 0}, other ${b.otherCost || 0}, expected sale ${b.salePrice || 0}.`,
    b.text ? `Listing draft: ${b.text}` : ""
  ].filter(Boolean).join("\n");
}
