import { loadState, saveState, current, compressImage } from "./store.js?v=26";
import { uploadMedia } from "./media.js?v=2";

const PHOTO_GROUPS=[
  {
    id:"identity",title:"Identification & evidence",hint:"Identity, serials, references and marks used to research and authenticate the watch.",open:true,
    slots:[
      ["intake","Intake / as received","original"],
      ["dial","Dial straight-on","identity"],
      ["caseback","Caseback exterior","identity"],
      ["insidecase","Inside caseback","identity"],
      ["movement","Movement full view","movement"],
      ["movementserial","Movement serial","movement"],
      ["caseserial","Case serial / reference","identity"],
      ["hallmarks","Hallmarks / stamps","identity"],
      ["crown","Crown","identity"],
      ["strapmarks","Bracelet / strap markings","identity"],
      ["identityother","Other identifying mark","identity"]
    ]
  },
  {
    id:"repair",title:"Repair record",hint:"A visual history of condition, diagnosis and the work carried out.",open:false,
    slots:[
      ["damage","Damage / fault","identity"],
      ["predismantle","Before dismantling","workshop"],
      ["dismantled","Movement dismantled","workshop"],
      ["progress","Repair progress","workshop"],
      ["reassembly","Reassembly","workshop"],
      ["finalmovement","Final movement","workshop"],
      ["finished","Finished watch","sale"]
    ]
  },
  {
    id:"sales",title:"Sales photography",hint:"A consistent listing set that shows the watch clearly from every important angle.",open:true,
    slots:[
      ["hero","Hero / front","sale"],
      ["salesleft","Front ¾ left","sale"],
      ["salesright","Front ¾ right","sale"],
      ["crownside","Side — crown","sale"],
      ["oppositeside","Side — opposite","sale"],
      ["salescaseback","Caseback","sale"],
      ["wristscale","Wrist / scale shot","sale"],
      ["dialclose","Dial close-up","sale"],
      ["salesmovement","Movement","sale"],
      ["claspstrap","Clasp / buckle / strap","sale"],
      ["flaws","Flaws / condition disclosure","sale"],
      ["accessories","Packaging / accessories","sale"]
    ]
  }
];

const SLOT_META=new Map(PHOTO_GROUPS.flatMap(g=>g.slots.map(([key,label,category])=>[key,{key,label,category,group:g.id}])));
const SLOT_CATEGORY=Object.fromEntries([...SLOT_META].map(([key,m])=>[key,m.category]));
const SLOT_LABEL=Object.fromEntries([...SLOT_META].map(([key,m])=>[key,m.label]));
const SALES_REQUIRED=["hero","salesleft","salesright","crownside","salescaseback","dialclose","flaws"];
const inFlight=new Set();
const $=s=>document.querySelector(s);
let renderTimer=0;

function status(text){
  const el=$("#passportMediaStatus");
  if(el)el.textContent=text;
}
function keyFor(file,slot){return [slot,file.name,file.size,file.lastModified].join("|");}
function countAssets(job){return (job?.mediaAssets||[]).filter(a=>a&&a.storageKey).length;}
function isPhotoSlot(slot){return SLOT_META.has(slot);}
function slotPhotos(job,key){return Array.isArray(job?.photos?.[key])?job.photos[key]:[];}
function slotHas(job,key){return slotPhotos(job,key).length>0;}
function groupProgress(job,group){const done=group.slots.filter(([key])=>slotHas(job,key)).length;return {done,total:group.slots.length};}
function totalPhotos(job){return PHOTO_GROUPS.reduce((n,g)=>n+g.slots.reduce((m,[k])=>m+slotPhotos(job,k).length,0),0);}
function missingSales(job){return SALES_REQUIRED.filter(k=>!slotHas(job,k));}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));}

async function savePreview(slot,preview){
  if(!isPhotoSlot(slot)||!preview)return null;
  const state=await loadState(),job=current(state);
  if(!job)throw new Error("No watch is open.");
  job.photos=job.photos&&typeof job.photos==="object"?job.photos:{};
  job.photos[slot]=Array.isArray(job.photos[slot])?job.photos[slot]:[];
  if(!job.photos[slot].includes(preview))job.photos[slot].push(preview);
  await saveState(state);
  return job;
}

async function attachAsset(asset,{slot="",preview=""}={}){
  const state=await loadState();
  const job=current(state);
  if(!job)throw new Error("No watch is open.");
  job.mediaAssets=Array.isArray(job.mediaAssets)?job.mediaAssets:[];
  if(!job.mediaAssets.some(a=>a?.id===asset.id||a?.storageKey===asset.storageKey))job.mediaAssets.push(asset);
  if(isPhotoSlot(slot)&&preview){
    job.photos=job.photos&&typeof job.photos==="object"?job.photos:{};
    job.photos[slot]=Array.isArray(job.photos[slot])?job.photos[slot]:[];
    if(!job.photos[slot].includes(preview))job.photos[slot].push(preview);
  }
  await saveState(state);
  return job;
}

async function archive(file,{slot="evidence",category="identity",stageId="",preview=""}={}){
  if(!file)return;
  const key=keyFor(file,slot);
  if(inFlight.has(key))return;
  inFlight.add(key);
  try{
    status(`Archiving ${SLOT_LABEL[slot]||slot} at full resolution…`);
    const state=await loadState(),job=current(state);
    if(!job)throw new Error("No watch is open.");
    if(isPhotoSlot(slot)&&!preview){
      try{preview=await compressImage(file);}catch(err){console.warn("Passport preview generation failed",err);}
    }
    const asset=await uploadMedia(file,{watchId:job.id,jobId:job.jobId||"",stageId:stageId||slot,category});
    const savedJob=await attachAsset(asset,{slot,preview});
    status(`${countAssets(savedJob)} private media item${countAssets(savedJob)===1?"":"s"} archived for this watch.`);
    paintSummary(savedJob);
    scheduleRender(10);
  }catch(err){
    console.warn("Passport media archive failed",err);
    status("Local preview saved, but private archive failed: "+(err?.message||err));
  }finally{inFlight.delete(key);}
}

function installStyles(){
  if(document.getElementById("guidedPhotoStyles"))return;
  const style=document.createElement("style");
  style.id="guidedPhotoStyles";
  style.textContent=`
  .photo-readiness{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;margin:0 0 10px;padding:10px 11px;border:1px solid var(--line);border-radius:8px;background:var(--surface-2)}
  .photo-readiness strong{font-size:.78rem}.photo-readiness p{margin:3px 0 0;font-size:.67rem;color:var(--muted);line-height:1.35}.photo-ready-badge{font-size:.66rem;font-weight:800;padding:5px 8px;border-radius:999px;border:1px solid var(--line);white-space:nowrap}.photo-ready-badge.ready{color:var(--ok);border-color:color-mix(in srgb,var(--ok) 55%,var(--line))}.photo-ready-badge.missing{color:#a36f32}
  .photo-group{margin:8px 0;border:1px solid var(--line);border-radius:8px;background:var(--surface);overflow:hidden}.photo-group>summary{list-style:none;cursor:pointer;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;padding:10px 11px}.photo-group>summary::-webkit-details-marker{display:none}.photo-group>summary:after{content:'+';color:var(--muted);grid-column:3}.photo-group[open]>summary:after{content:'−'}.photo-group[open]>summary{border-bottom:1px solid var(--line)}.photo-group-title{font-size:.78rem;font-weight:800}.photo-group-hint{display:block;margin-top:2px;font-size:.64rem;font-weight:500;color:var(--muted)}.photo-group-count{font-size:.65rem;color:var(--muted);white-space:nowrap}.photo-group-body{padding:8px}.photo-slot-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.photo-slot{display:grid;grid-template-columns:64px minmax(0,1fr);gap:9px;align-items:center;padding:8px;border:1px solid var(--line);border-radius:8px;background:var(--surface-2)}.photo-slot img,.photo-slot .ph{width:64px;height:64px;object-fit:cover;border-radius:7px;background:var(--surface)}.photo-slot .ph{display:grid;place-items:center;color:var(--muted);font-size:.62rem}.photo-slot strong{font-size:.72rem}.photo-slot .row{margin-top:5px;gap:4px}.photo-slot .btn{min-height:28px;padding:4px 7px;font-size:.62rem}.photo-count-note{font-size:.61rem;color:var(--muted);margin-top:2px}
  @media(max-width:900px){.photo-slot-grid{grid-template-columns:1fr}}@media(max-width:520px){.photo-readiness{grid-template-columns:1fr}.photo-ready-badge{justify-self:start}}
  `;
  document.head.appendChild(style);
}

function slotMarkup(job,key,label){
  const photos=slotPhotos(job,key),src=photos[0]||"";
  return `<div class="photo-slot" data-photo-slot="${esc(key)}">${src?`<img src="${src}" alt="">`:`<div class="ph">None</div>`}<div><strong>${esc(label)}</strong>${photos.length>1?`<div class="photo-count-note">${photos.length} photos</div>`:""}<div class="row"><button class="btn secondary" data-photo-action="camera" data-slot="${esc(key)}" type="button">Camera</button><button class="btn secondary" data-photo-action="upload" data-slot="${esc(key)}" type="button">Upload</button>${src?`<button class="btn secondary" data-photo-action="remove" data-slot="${esc(key)}" type="button">Remove</button>`:""}</div></div><input id="file-${esc(key)}" data-guided-photo-input="1" type="file" accept="image/*" hidden></div>`;
}

function renderGroups(job){
  const root=$("#slots");
  if(!root||!job)return;
  root.className="";
  const missing=missingSales(job),ready=!missing.length;
  const missingNames=missing.map(k=>SLOT_LABEL[k]).join(", ");
  root.innerHTML=`<div class="photo-readiness"><div><strong>Sales listing set</strong><p>${ready?"Core listing angles are covered. Add optional movement, wrist and accessories shots where useful.":`Missing: ${esc(missingNames)}.`}</p></div><span class="photo-ready-badge ${ready?"ready":"missing"}">${ready?"Listing ready":"Needs photos"}</span></div>`+
    PHOTO_GROUPS.map(group=>{const p=groupProgress(job,group);return `<details class="photo-group" data-photo-group="${group.id}"${group.open?" open":""}><summary><span><span class="photo-group-title">${esc(group.title)}</span><span class="photo-group-hint">${esc(group.hint)}</span></span><span class="photo-group-count">${p.done} / ${p.total}</span></summary><div class="photo-group-body"><div class="photo-slot-grid">${group.slots.map(([key,label])=>slotMarkup(job,key,label)).join("")}</div></div></details>`;}).join("");
  const total=totalPhotos(job),countEl=$("#photoCount");if(countEl)countEl.textContent=String(total);
  const photoCard=document.querySelector('[data-section="photos"] [data-count]');if(photoCard)photoCard.textContent=total?`${total} photos`:"";
}

function scheduleRender(ms=80){clearTimeout(renderTimer);renderTimer=setTimeout(async()=>{try{const state=await loadState(),job=current(state);if(job)renderGroups(job);}catch(err){console.warn("Photo groups could not refresh",err);}},ms);}

async function removePreview(slot){
  const state=await loadState(),job=current(state);if(!job)return;
  job.photos=job.photos&&typeof job.photos==="object"?job.photos:{};
  job.photos[slot]=Array.isArray(job.photos[slot])?job.photos[slot]:[];
  job.photos[slot].shift();
  await saveState(state);
  renderGroups(job);
  status("Photo preview removed. Full-resolution archive remains private.");
}

async function handleSlotFile(file,slot){
  if(!file||!isPhotoSlot(slot))return;
  let preview="";
  try{
    status(`Saving ${SLOT_LABEL[slot]} preview…`);
    preview=await compressImage(file);
    const job=await savePreview(slot,preview);
    if(job)renderGroups(job);
    status("Preview saved. Archiving full-resolution original…");
  }catch(err){console.warn("Local photo preview failed",err);status("Could not save preview: "+(err?.message||err));}
  await archive(file,{slot,category:SLOT_CATEGORY[slot]||"identity",stageId:SLOT_LABEL[slot]||slot,preview});
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
  installStyles();
  let state,job;
  try{state=await loadState();job=current(state);}catch{}
  if(job){paintSummary(job);renderGroups(job);}

  document.addEventListener("click",async e=>{
    const btn=e.target.closest("[data-photo-action]");
    if(!btn)return;
    const slot=btn.dataset.slot,action=btn.dataset.photoAction;
    if(!isPhotoSlot(slot))return;
    e.preventDefault();e.stopPropagation();
    if(action==="remove"){await removePreview(slot);return;}
    const input=document.getElementById(`file-${slot}`);if(!input)return;
    input.value="";
    if(action==="camera")input.setAttribute("capture","environment");else input.removeAttribute("capture");
    input.click();
  },true);

  document.addEventListener("change",e=>{
    const input=e.target;
    if(!(input instanceof HTMLInputElement)||input.type!=="file")return;
    const file=input.files?.[0];
    if(!file)return;
    if(input.id==="invoiceFile"){
      setTimeout(()=>archive(file,{slot:"invoice",category:"documents",stageId:"Invoice / provenance"}),700);
      return;
    }
    if(input.dataset.guidedPhotoInput==="1"&&input.id?.startsWith("file-")){
      e.stopImmediatePropagation();
      const slot=input.id.slice(5);
      handleSlotFile(file,slot).finally(()=>{input.value="";});
    }
  },true);

  // The Passport page can repaint its legacy slot grid after some actions. If that happens,
  // restore the guided layout without disturbing the saved photos.
  const root=$("#slots");
  if(root)new MutationObserver(()=>{if(!root.querySelector(".photo-group"))scheduleRender(30);}).observe(root,{childList:true});
}

start();
