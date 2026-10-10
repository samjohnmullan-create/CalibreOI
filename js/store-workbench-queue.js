import * as base from "./store-sync-safe.js?v=1";
import { legacyJobToItem } from "./item-model.js?v=4";

export * from "./store-sync-safe.js?v=1";

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

function materialiseLegacyItems(state){
  state.items=Array.isArray(state.items)?state.items:[];
  state.jobs=Array.isArray(state.jobs)?state.jobs:[];
  let changed=false;
  const itemIds=new Set(state.items.map(i=>String(i?.id||"")));
  for(const job of state.jobs){
    if(!job?.id)continue;
    let item=null;
    if(job.itemId)item=state.items.find(i=>String(i?.id)===String(job.itemId))||null;
    if(!item)item=state.items.find(i=>String(i?.legacyJobId||"")===String(job.id)||String(i?.watch?.specialistJobId||"")===String(job.id))||null;
    if(!item){
      item=legacyJobToItem(job);
      item.id=job.itemId||`item-${job.id}`;
      item.legacyJobId="";
      if(job.jobType==="inspect"){
        item.type="accessory";
        delete item.watch;
      }else{
        item.watch=item.watch&&typeof item.watch==="object"?item.watch:{};
        item.watch.specialistJobId=job.id;
      }
      if(!itemIds.has(String(item.id))){state.items.push(item);itemIds.add(String(item.id));changed=true;}
    }else{
      if(item.legacyJobId){item.legacyJobId="";changed=true;}
      if(item.type==="watch"||item.type==="clock"){
        item.watch=item.watch&&typeof item.watch==="object"?item.watch:{};
        if(String(item.watch.specialistJobId||"")!==String(job.id)){item.watch.specialistJobId=job.id;changed=true;}
      }
    }
    if(item&&String(job.itemId||"")!==String(item.id)){job.itemId=item.id;changed=true;}
  }
  return changed;
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

// Critical path: opening a job is a read, not a migration. Select the requested job
// in memory and only tidy that record. Collection-wide item migration/photo cleanup is
// left to Items or to an actual save.
export async function loadState(){
  const state=await base.loadState();
  state.jobs=Array.isArray(state.jobs)?state.jobs:[];
  const requested=requestedJobId();
  if(requested&&state.jobs.some(j=>String(j.id)===String(requested)))state.currentId=requested;
  const selected=state.jobs.find(j=>String(j.id)===String(state.currentId||""));
  if(selected){tidyJob(selected);sanitisePhotos(selected);}
  const page=pageName();
  if(page==="inventory.html"||page==="item.html")materialiseLegacyItems(state);
  return state;
}

export async function saveState(state){
  const selected=(state?.jobs||[]).find(j=>String(j.id)===String(state.currentId||""));
  if(selected){tidyJob(selected);sanitisePhotos(selected);}
  const page=pageName();
  if(page==="inventory.html"||page==="item.html")materialiseLegacyItems(state);
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
    else if(!known.has(key){
      if(job.workbenchHidden!==true){job.workbenchHidden=true;changed=true;}
      if(!raw.status||String(raw.status).toLowerCase()==="on the bench"){if(job.status!=="Purchased"){job.status="Purchased";changed=true;}}
    }
  }
  if(previousCurrentId&&state.jobs.some(j=>j.id===previousCurrentId)&&state.currentId!==previousCurrentId){state.currentId=previousCurrentId;changed=true;}
  for(const job of (state.jobs||[])){const old=job.business?.soldDate;tidyJob(job);if(old!==job.business.soldDate)changed=true;if(sanitisePhotos(job))changed=true;}
  if(materialiseLegacyItems(state))changed=true;
  if(changed)await base.saveState(state);
  return {...result,state};
}
