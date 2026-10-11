import { legacyJobToWork, normaliseWork } from './item-model.js?v=4';
import { ensureItemForJob } from './item-integrity.js?v=2';

const text=value=>value==null?'':String(value);
const uniq=list=>[...new Set((Array.isArray(list)?list:[]).map(text).filter(Boolean))];

export function canonicalWorkIdForJob(job={}){
  return text(job.workId)||`work-${text(job.id)||'legacy'}`;
}

export function ensureWorkForJob(state={},job=null,item=null){
  if(!job?.id)return {work:null,item:item||null,changed:false,created:false};
  state.workRecords=Array.isArray(state.workRecords)?state.workRecords:[];
  const linked=item||ensureItemForJob(state,job).item;
  if(!linked)return {work:null,item:null,changed:false,created:false};

  const workId=canonicalWorkIdForJob(job);
  let index=state.workRecords.findIndex(work=>
    text(work?.id)===workId ||
    text(work?.legacyJobId)===text(job.id) ||
    text(work?.sourceJobId)===text(job.id)
  );
  const derived=legacyJobToWork(job,linked.id);
  const existing=index>=0?state.workRecords[index]:null;
  const work=normaliseWork({
    ...(existing||{}),
    ...derived,
    id:existing?.id||workId,
    itemId:text(linked.id),
    legacy:true,
    legacyJobId:text(job.id),
    sourceJobId:text(job.id),
    mirrorVersion:1
  });
  work.legacyJobId=text(job.id);
  work.sourceJobId=text(job.id);
  work.mirrorVersion=1;

  let created=false,changed=false;
  if(index<0){
    state.workRecords.push(work);
    index=state.workRecords.length-1;
    created=true;
    changed=true;
  }else if(JSON.stringify(existing)!==JSON.stringify(work)){
    state.workRecords[index]=work;
    changed=true;
  }

  if(text(job.workId)!==text(work.id)){
    job.workId=text(work.id);
    changed=true;
  }
  const nextWorkIds=uniq([...(linked.workIds||[]),work.id]);
  if(JSON.stringify(linked.workIds||[])!==JSON.stringify(nextWorkIds)){
    linked.workIds=nextWorkIds;
    changed=true;
  }
  if(linked.watch&&typeof linked.watch==='object'){
    linked.watch.serviceHistory=Array.isArray(linked.watch.serviceHistory)?linked.watch.serviceHistory:[];
    for(const service of linked.watch.serviceHistory){
      if(text(service?.jobId)===text(job.id)&&text(service?.workId)!==text(work.id)){
        service.workId=text(work.id);
        changed=true;
      }
    }
  }
  return {work:state.workRecords[index],item:linked,changed,created};
}

export function reconcileItemWorkPassportLinks(state={}){
  state.jobs=Array.isArray(state.jobs)?state.jobs:[];
  state.items=Array.isArray(state.items)?state.items:[];
  state.workRecords=Array.isArray(state.workRecords)?state.workRecords:[];
  let changed=false,createdItems=0,createdWorks=0,linked=0;

  for(const job of state.jobs){
    if(!job?.id)continue;
    const itemResult=ensureItemForJob(state,job);
    if(itemResult.created)createdItems++;
    if(itemResult.changed)changed=true;
    const workResult=ensureWorkForJob(state,job,itemResult.item);
    if(workResult.created)createdWorks++;
    if(workResult.changed)changed=true;
    if(workResult.work)linked++;
  }

  state.relationshipModelVersion=Math.max(Number(state.relationshipModelVersion)||0,1);
  return {changed,createdItems,createdWorks,linked};
}

export function relationshipIntegrityReport(state={}){
  const jobs=Array.isArray(state.jobs)?state.jobs:[];
  const items=Array.isArray(state.items)?state.items:[];
  const works=Array.isArray(state.workRecords)?state.workRecords:[];
  const itemById=new Map(items.map(item=>[text(item?.id),item]).filter(([id])=>id));
  const workById=new Map(works.map(work=>[text(work?.id),work]).filter(([id])=>id));
  const duplicateWorkIds=[...works.reduce((map,work)=>{const id=text(work?.id);if(id)map.set(id,(map.get(id)||0)+1);return map;},new Map()).entries()].filter(([,count])=>count>1).map(([id])=>id);
  const brokenJobs=[];
  const mismatchedWorks=[];
  const brokenItemWorkIds=[];
  const brokenServiceHistory=[];

  for(const job of jobs){
    const item=itemById.get(text(job?.itemId));
    const work=workById.get(text(job?.workId));
    if(!item||!work){brokenJobs.push(text(job?.id));continue;}
    if(text(work.itemId)!==text(item.id)||text(work.legacyJobId||work.sourceJobId)!==text(job.id))mismatchedWorks.push(text(work.id));
  }
  for(const item of items){
    for(const workId of uniq(item?.workIds)){
      const work=workById.get(workId);
      if(!work||text(work.itemId)!==text(item?.id))brokenItemWorkIds.push(`${text(item?.id)}:${workId}`);
    }
    for(const service of (item?.watch?.serviceHistory||[])){
      if(!service?.jobId)continue;
      const job=jobs.find(candidate=>text(candidate?.id)===text(service.jobId));
      if(!job)continue;
      if(!service.workId||text(service.workId)!==text(job.workId))brokenServiceHistory.push(`${text(item?.id)}:${text(service.jobId)}`);
    }
  }

  return {
    jobs:jobs.length,
    items:items.length,
    works:works.length,
    brokenJobs:uniq(brokenJobs),
    mismatchedWorks:uniq(mismatchedWorks),
    brokenItemWorkIds:uniq(brokenItemWorkIds),
    brokenServiceHistory:uniq(brokenServiceHistory),
    duplicateWorkIds,
    healthy:brokenJobs.length===0&&mismatchedWorks.length===0&&brokenItemWorkIds.length===0&&brokenServiceHistory.length===0&&duplicateWorkIds.length===0
  };
}
