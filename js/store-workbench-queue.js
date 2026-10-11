import * as base from "./store-local-fast.js?v=1";
import { ensureAllJobItemLinks, ensureItemForJob } from "./item-integrity.js?v=1";
import { ensureWorkForJob, reconcileItemWorkPassportLinks } from "./item-work-passport-links.js?v=1";

export * from "./store-local-fast.js?v=1";

function explicitWorkbench(raw={}){
  if(Object.prototype.hasOwnProperty.call(raw,"workbenchHidden"))return !raw.workbenchHidden;
  if(Object.prototype.hasOwnProperty.call(raw,"onWorkbench"))return !!raw.onWorkbench;
  return null;
}

function tidyJob(job){
  if(!job||typeof job!=="object")return job;
  if(typeof job.workbenchHidden!=="boolean")job.workbenchHidden=["Purchased","Awaiting inspection"].includes(job.status||"");
  job.business=job.business&&typeof job.business==="object"?job.business:{};
  if(typeof job.business.soldDate!=="string")job.business.soldDate="";
  return job;
}

function requestedJobId(){
  if(typeof location==="undefined")return "";
  try{return new URLSearchParams(location.search).get("id")||"";}catch{return "";}
}

function pageName(){
  if(typeof location==="undefined")return "";
  return (location.pathname.split("/").pop()||"index.html").split("?")[0];
}

function validPhotoRef(value){
  const s=String(value||"").trim();
  if(!s)return false;
  if(/^https?:\/\//i.test(s)||s.startsWith("blob:")||s.startsWith("/"))return true;
  if(!s.startsWith("data:image/"))return false;
  const marker=s.indexOf(";base64,");
  if(marker<10)return false;
  const payloadStart=marker+8,payloadLength=s.length-payloadStart;
  if(payloadLength<64||payloadLength%4!==0)return false;
  return /^[A-Za-z0-9+/]*={0,2}$/.test(s.slice(-12));
}

function sanitisePhotos(job){
  let changed=false;
  if(job?.photos&&typeof job.photos==="object"){
    for(const [key,list] of Object.entries(job.photos)){
      if(!Array.isArray(list))continue;
      const clean=list.filter(validPhotoRef);
      if(clean.length!==list.length){job.photos[key]=clean;changed=true;}
    }
  }
  if(Array.isArray(job?.passport?.photos)){
    const clean=job.passport.photos.filter(validPhotoRef);
    if(clean.length!==job.passport.photos.length){job.passport.photos=clean;changed=true;}
  }
  for(const stage of (job?.stages||[])){
    if(!Array.isArray(stage?.photos))continue;
    const clean=stage.photos.filter(validPhotoRef);
    if(clean.length!==stage.photos.length){stage.photos=clean;changed=true;}
  }
  return changed;
}

export function coverPhoto(job){
  const shots=job&&job.photos||{};
  for(const key of ["intake","hero","finished","dial","caseback","movement","damage","progress"]){const src=shots[key]?.find?.(validPhotoRef);if(src)return src;}
  const passport=job?.passport?.photos?.find?.(validPhotoRef);if(passport)return passport;
  for(const s of (job?.stages||[])){const src=s?.photos?.find?.(validPhotoRef);if(src)return src;}
  return "";
}

export function blankJob(partial={}){
  const requested=explicitWorkbench(partial),job=tidyJob(base.blankJob({status:"Purchased",...partial}));
  job.workbenchHidden=requested===null?true:!requested;
  return job;
}

export function importCard(raw={}){
  const requested=explicitWorkbench(raw),card=tidyJob(base.importCard({...raw,status:raw.status||"Purchased"}));
  card.workbenchHidden=requested===null?true:!requested;
  return card;
}

export async function loadState(){
  const state=await base.loadState();
  state.jobs=Array.isArray(state.jobs)?state.jobs:[];
  const requested=requestedJobId();
  if(requested&&state.jobs.some(j=>String(j.id)===String(requested)))state.currentId=requested;
  const index=state.jobs.findIndex(j=>String(j.id)===String(state.currentId||""));
  if(index>=0){
    try{state.jobs[index]=base.normalise(state.jobs[index]);}catch{}
    tidyJob(state.jobs[index]);
    sanitisePhotos(state.jobs[index]);
    const linked=ensureItemForJob(state,state.jobs[index]);
    ensureWorkForJob(state,state.jobs[index],linked.item);
  }
  const page=pageName();
  if(page==="inventory.html"||page==="item.html")reconcileItemWorkPassportLinks(state);
  return state;
}

export async function saveState(state){
  const selected=(state?.jobs||[]).find(j=>String(j.id)===String(state.currentId||""));
  if(selected){
    tidyJob(selected);
    sanitisePhotos(selected);
    const linked=ensureItemForJob(state,selected);
    ensureWorkForJob(state,selected,linked.item);
  }
  reconcileItemWorkPassportLinks(state);
  return base.saveState(state);
}

export async function importInboxItems(items){
  const before=await base.loadState(),previousCurrentId=before.currentId||null;
  const known=new Set((before.jobs||[]).map(j=>String(j.pushId||j.jobId||j.id||"")));
  const result=await base.importInboxItems(items),state=await base.loadState();let changed=false;
  for(const item of (Array.isArray(items)?items:[])){
    const raw=item?.job_data;if(!raw||raw.type!=="calibrejob")continue;
    const key=String(raw.pushId||raw.jobId||""),job=(state.jobs||[]).find(j=>(raw.pushId&&j.pushId===raw.pushId)||(raw.jobId&&j.jobId===raw.jobId));if(!job)continue;
    const requested=explicitWorkbench(raw);
    if(requested!==null){if(job.workbenchHidden===requested){job.workbenchHidden=!requested;changed=true;}}
    else if(!known.has(key)){
      if(job.workbenchHidden!==true){job.workbenchHidden=true;changed=true;}
      if(!raw.status||String(raw.status).toLowerCase()==="on the bench"){if(job.status!=="Purchased"){job.status="Purchased";changed=true;}}
    }
  }
  if(previousCurrentId&&state.jobs.some(j=>j.id===previousCurrentId)&&state.currentId!==previousCurrentId){state.currentId=previousCurrentId;changed=true;}
  for(const job of (state.jobs||[])){const old=job.business?.soldDate;tidyJob(job);if(old!==job.business.soldDate)changed=true;if(sanitisePhotos(job))changed=true;}
  const integrity=ensureAllJobItemLinks(state);if(integrity.changed)changed=true;
  const relationships=reconcileItemWorkPassportLinks(state);if(relationships.changed)changed=true;
  if(changed)await base.saveState(state);
  return {...result,state};
}
