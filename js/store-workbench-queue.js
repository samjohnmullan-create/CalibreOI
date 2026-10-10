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
  }
  if(changed)await base.saveState(state);
  return state;
}

export async function saveState(state){
  for(const job of (state?.jobs||[]))queueDefault(job);
  return base.saveState(state);
}

export async function importInboxItems(items){
  const before=await base.loadState();
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

  if(changed)await base.saveState(state);
  return {...result,state};
}
