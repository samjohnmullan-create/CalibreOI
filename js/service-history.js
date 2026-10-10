import { ensureItemForJob } from './item-integrity.js?v=1';

const text=v=>v==null?'':String(v);
const clone=v=>JSON.parse(JSON.stringify(v??null));
const usedParts=job=>(Array.isArray(job.parts)?job.parts:[]).filter(p=>p?.fitted||p?.used||p?.status==='Used').map(p=>({part:text(p.part||p.name),source:text(p.source||p.donorName||''),donorJobId:text(p.donorJobId||''),donorItemId:text(p.donorItemId||''),notes:text(p.notes||'')}));
const diagnostics=job=>(Array.isArray(job.diagnosticFaults)?job.diagnosticFaults:[]).map(f=>({id:text(f.id),text:text(f.text),category:text(f.category),status:text(f.status||'possible'),severity:text(f.severity),updatedAt:text(f.updatedAt)}));
const timing=job=>(Array.isArray(job.timingRuns)?job.timingRuns:[]).map(r=>clone(r));
const completeStatus=s=>['Ready to list','Listed','Sold','Spares'].includes(String(s||''));

export function serviceHistoryEntry(job={}){
  return {
    jobId:text(job.id),jobNumber:text(job.jobId),status:text(job.status),decision:text(job.decision),
    openedAt:text(job.createdAt||job.openedAt),updatedAt:text(job.updatedAt),completedAt:completeStatus(job.status)?text(job.updatedAt||new Date().toISOString()):'',
    diagnosis:text(job.diagnosis),repairPerformed:text(job.repairPerformed),outcome:text(job.outcome||job.finalOutcome||''),
    benchMeasurements:clone(job.benchMeasurements||{}),diagnostics:diagnostics(job),partsUsed:usedParts(job),timingRuns:timing(job)
  };
}

export function reconcileServiceHistory(state={}){
  state.jobs=Array.isArray(state.jobs)?state.jobs:[];state.items=Array.isArray(state.items)?state.items:[];
  let changed=false,updated=0;
  for(const job of state.jobs){
    if(!job?.id||job.jobType==='inspect')continue;
    const linked=ensureItemForJob(state,job),item=linked.item;if(!item||!['watch','clock'].includes(item.type))continue;
    item.watch=item.watch&&typeof item.watch==='object'?item.watch:{};
    item.watch.serviceHistory=Array.isArray(item.watch.serviceHistory)?item.watch.serviceHistory:[];
    item.watch.timingHistory=Array.isArray(item.watch.timingHistory)?item.watch.timingHistory:[];
    const entry=serviceHistoryEntry(job),idx=item.watch.serviceHistory.findIndex(x=>String(x?.jobId)===String(job.id));
    const before=idx>=0?JSON.stringify(item.watch.serviceHistory[idx]):'';
    if(idx>=0)item.watch.serviceHistory[idx]=entry;else item.watch.serviceHistory.push(entry);
    const timingByKey=new Map(item.watch.timingHistory.map((r,i)=>[String(r?.id||r?.createdAt||r?.savedAt||`old-${i}`),r]));
    for(const r of entry.timingRuns){const key=String(r?.id||r?.createdAt||r?.savedAt||'');if(key)timingByKey.set(key,r);}item.watch.timingHistory=[...timingByKey.values()];
    if(linked.changed||idx<0||before!==JSON.stringify(entry)){item.updatedAt=job.updatedAt||new Date().toISOString();changed=true;updated++;}
  }
  return {changed,updated};
}
