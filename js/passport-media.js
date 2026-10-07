import { loadState, saveState, current } from "./store.js?v=26";
import { uploadMedia } from "./media.js?v=2";

const SLOT_CATEGORY={
  intake:"original",
  caseback:"identity",
  movement:"movement",
  dial:"identity",
  damage:"identity",
  progress:"workshop",
  finished:"sale",
  hero:"sale"
};
const SLOT_LABEL={
  intake:"Intake",
  caseback:"Caseback",
  movement:"Movement",
  dial:"Dial",
  damage:"Damage",
  progress:"Repair progress",
  finished:"Finished watch",
  hero:"Sales hero"
};
const inFlight=new Set();
const $=s=>document.querySelector(s);

function status(text){
  const el=$("#passportMediaStatus");
  if(el)el.textContent=text;
}
function keyFor(file,slot){return [slot,file.name,file.size,file.lastModified].join("|");}
function countAssets(job){return (job?.mediaAssets||[]).filter(a=>a&&a.storageKey).length;}

async function attachAsset(asset){
  const state=await loadState();
  const job=current(state);
  if(!job)throw new Error("No watch is open.");
  job.mediaAssets=Array.isArray(job.mediaAssets)?job.mediaAssets:[];
  if(!job.mediaAssets.some(a=>a?.id===asset.id||a?.storageKey===asset.storageKey))job.mediaAssets.push(asset);
  await saveState(state);
  return job;
}

async function archive(file,{slot="evidence",category="identity",stageId=""}={}){
  if(!file)return;
  const key=keyFor(file,slot);
  if(inFlight.has(key))return;
  inFlight.add(key);
  try{
    status(`Archiving ${SLOT_LABEL[slot]||slot} at full resolution…`);
    const state=await loadState(),job=current(state);
    if(!job)throw new Error("No watch is open.");
    const asset=await uploadMedia(file,{watchId:job.id,jobId:job.jobId||"",stageId:stageId||slot,category});
    const savedJob=await attachAsset(asset);
    status(`${countAssets(savedJob)} private media item${countAssets(savedJob)===1?"":"s"} archived for this watch.`);
    paintSummary(savedJob);
  }catch(err){
    console.warn("Passport media archive failed",err);
    status("Local record saved, but private archive failed: "+(err?.message||err));
  }finally{inFlight.delete(key);}
}

function paintSummary(job){
  let bar=$("#passportMediaBar");
  if(!bar){
    const photos=document.querySelector('[data-section="photos"] .dossier-body');
    if(!photos)return;
    bar=document.createElement("div");
    bar.id="passportMediaBar";
    bar.style.cssText="display:flex;gap:8px;align-items:center;justify-content:space-between;flex-wrap:wrap;margin:0 0 10px;padding:9px 10px;border:1px solid var(--line);border-radius:8px;background:var(--surface-2)";
    bar.innerHTML='<div><strong style="font-size:.75rem">Private full-resolution archive</strong><div id="passportMediaStatus" class="muted small" style="margin-top:2px"></div></div><a class="btn secondary" href="media.html">Open private media</a>';
    photos.insertBefore(bar,photos.querySelector("#slots"));
  }
  const n=countAssets(job);
  status(n?`${n} private media item${n===1?"":"s"} archived for this watch.`:"New evidence photos will also be archived privately at full resolution.");
}

async function start(){
  let state,job;
  try{state=await loadState();job=current(state);}catch{}
  if(job)paintSummary(job);

  document.addEventListener("change",e=>{
    const input=e.target;
    if(!(input instanceof HTMLInputElement)||input.type!=="file")return;
    const file=input.files?.[0];
    if(!file)return;
    if(input.id==="invoiceFile"){
      setTimeout(()=>archive(file,{slot:"invoice",category:"documents",stageId:"Invoice / provenance"}),700);
      return;
    }
    if(input.id?.startsWith("file-")){
      const slot=input.id.slice(5),category=SLOT_CATEGORY[slot]||"identity";
      setTimeout(()=>archive(file,{slot,category,stageId:SLOT_LABEL[slot]||slot}),700);
    }
  },true);
}

start();
