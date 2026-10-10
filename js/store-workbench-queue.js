import * as base from "./store-sync-safe.js?v=1";

export * from "./store-sync-safe.js?v=1";

function explicitWorkbench(raw={}){
  if(Object.prototype.hasOwnProperty.call(raw,"workbenchHidden"))return !raw.workbenchHidden;
  if(Object.prototype.hasOwnProperty.call(raw,"onWorkbench"))return !!raw.onWorkbench;
  return null;
}

function queueDefault(job){
  if(!job||typeof job!=="object")return job;
  if(typeof job.workbenchHidden!=="boolean"){
    job.workbenchHidden=["Purchased","Awaiting inspection"].includes(job.status||"");
  }
  return job;
}

function validPhotoRef(value){
  const s=String(value||"").trim();
  if(!s)return false;
  if(/^https?:\/\//i.test(s)||s.startsWith("blob:")||s.startsWith("/"))return true;
  const m=s.match(/^data:image\/[a-z0-9.+-]+;base64,(.+)$/i);
  if(!m)return false;
  const payload=m[1].replace(/\s+/g,"");
  if(!payload||payload.length%4!==0||!/^[A-Za-z0-9+/]*={0,2}$/.test(payload))return false;
  try{ if(typeof atob==="function")atob(payload); return true; }catch{return false;}
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
  for(const key of ["intake","hero","finished","dial","caseback","movement","damage","progress"]){
    const src=shots[key]?.find?.(validPhotoRef);
    if(src)return src;
  }
  const passport=job?.passport?.photos?.find?.(validPhotoRef);if(passport)return passport;
  for(const s of (job?.stages||[])){const src=s?.photos?.find?.(validPhotoRef);if(src)return src;}
  return "";
}

export function blankJob(partial={}){
  const requested=explicitWorkbench(partial);
  const job=base.blankJob({status:"Purchased",...partial});
  job.workbenchHidden=requested===null?true:!requested;
  return job;
}

export function importCard(raw={}){
  const requested=explicitWorkbench(raw);
  const card=base.importCard({...raw,status:raw.status||"Purchased"});
  card.workbenchHidden=requested===null?true:!requested;
  return card;
}

export async function loadState(){
  const state=await base.loadState();
  let changed=false;
  for(const job of (state.jobs||[])){
    if(typeof job.workbenchHidden!=="boolean"){
      job.workbenchHidden=["Purchased","Awaiting inspection"].includes(job.status||"");
      changed=true;
    }
    if(sanitisePhotos(job))changed=true;
  }
  if(changed)await base.saveState(state);
  return state;
}

export async function saveState(state){
  for(const job of (state?.jobs||[])){queueDefault(job);sanitisePhotos(job);}
  return base.saveState(state);
}

export async function importInboxItems(items){
  const before=await base.loadState();
  const previousCurrentId=before.currentId||null;
  const known=new Set((before.jobs||[]).map(j=>String(j.pushId||j.jobId||j.id||"")));
  const result=await base.importInboxItems(items);
  const state=await base.loadState();
  let changed=false;

  for(const item of (Array.isArray(items)?items:[])){
    const raw=item?.job_data;
    if(!raw||raw.type!=="calibrejob")continue;
    const key=String(raw.pushId||raw.jobId||"");
    const job=(state.jobs||[]).find(j=>(raw.pushId&&j.pushId===raw.pushId)||(raw.jobId&&j.jobId===raw.jobId));
    if(!job)continue;
    const requested=explicitWorkbench(raw);
    if(requested!==null){
      if(job.workbenchHidden===requested){job.workbenchHidden=!requested;changed=true;}
    }else if(!known.has(key)){
      if(job.workbenchHidden!==true){job.workbenchHidden=true;changed=true;}
      if(!raw.status||String(raw.status).toLowerCase()==="on the bench"){
        if(job.status!=="Purchased"){job.status="Purchased";changed=true;}
      }
    }
  }

  if(previousCurrentId&&state.jobs.some(j=>j.id===previousCurrentId)&&state.currentId!==previousCurrentId){
    state.currentId=previousCurrentId;
    changed=true;
  }
  for(const job of (state.jobs||[]))if(sanitisePhotos(job))changed=true;

  if(changed)await base.saveState(state);
  return {...result,state};
}
