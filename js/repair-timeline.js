const asArray=v=>Array.isArray(v)?v:[];
const text=v=>String(v??"").trim();
const iso=v=>{if(!v)return"";const d=new Date(v);return Number.isNaN(d.getTime())?"":d.toISOString();};
const dayIso=v=>{if(!v)return"";const s=String(v).trim();if(/^\d{4}-\d{2}-\d{2}$/.test(s))return `${s}T12:00:00.000Z`;return iso(v);};
const idPart=s=>text(s).toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,60)||"event";
function push(out,event){if(!event?.at||!event?.title)return;out.push({...event,at:iso(event.at)||dayIso(event.at)});}
function timingRate(r){const n=Number(r?.rateSecondsPerDay??r?.rate);return Number.isFinite(n)?n:null;}
function timingWhen(r){return r?.savedAt||r?.createdAt||r?.at||r?.timestamp||r?.date||"";}
function timingDetail(r){const bits=[],rate=timingRate(r);if(rate!==null)bits.push(`${rate>=0?"+":""}${rate.toFixed(1)} s/day`);if(r?.beatError!=null&&String(r.beatError)!=="")bits.push(`${r.beatError} ms beat error`);if(r?.bph)bits.push(`${r.bph} BPH`);if(r?.position)bits.push(r.position);return bits.join(" · ");}

export function manualTimeline(job){job.timelineManual=asArray(job.timelineManual);return job.timelineManual;}
export function addTimelineNote(job,note,{at=new Date().toISOString(),type="note"}={}){const body=text(note);if(!body)return null;const e={id:`manual-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,6)}`,type,title:"Bench note",detail:body,at:iso(at)||new Date().toISOString(),manual:true};manualTimeline(job).push(e);return e;}
export function removeTimelineNote(job,id){const before=manualTimeline(job).length;job.timelineManual=job.timelineManual.filter(x=>x?.id!==id);return job.timelineManual.length!==before;}

export function repairTimeline(job){
  if(!job)return[];const out=[];
  const started=job.createdAt||job.openedAt||job.receivedAt||job.importedAt;
  if(started)push(out,{id:"job-start",type:"intake",title:"Job opened",detail:job.watchName||"Watch entered Calibre",at:started});

  asArray(job.diagnosticFaults).forEach((f,i)=>{
    const at=f.updatedAt||f.createdAt;if(!at||!f.text)return;
    const state=f.status==="confirmed"?"Confirmed fault":f.status==="ruledout"?"Fault ruled out":"Possible fault";
    push(out,{id:`fault-${f.key||f.id||i}-${f.status||"possible"}`,type:"diagnosis",title:state,detail:f.text,at});
  });

  asArray(job.researchBrief?.benchChecks).forEach((c,i)=>{
    if(!c?.updatedAt||!c?.result)return;
    const labels={pass:"Research check passed",fault:"Research fault found",part:"Part required",na:"Research check not tested"};
    push(out,{id:`check-${c.key||i}-${c.result}`,type:c.result==="part"?"part":"diagnosis",title:labels[c.result]||"Research check",detail:[c.text,c.selectedParts?.length?`Parts: ${c.selectedParts.join(", ")}`:""].filter(Boolean).join(" · "),at:c.updatedAt});
  });

  asArray(job.parts).forEach((p,i)=>{
    const name=text(p.part||p.partNumber||`Part ${i+1}`);
    if(p.createdAt)push(out,{id:`part-${i}-needed`,type:"part",title:"Part required",detail:name,at:p.createdAt});
    if(p.ordered)push(out,{id:`part-${i}-ordered`,type:"part",title:"Part ordered",detail:[name,p.partNumber,p.supplier].filter(Boolean).join(" · "),at:dayIso(p.ordered)});
    if(p.receivedAt||p.received&&p.updatedAt)push(out,{id:`part-${i}-received`,type:"part",title:"Part received",detail:name,at:p.receivedAt||p.updatedAt});
    if(p.fittedAt||p.fitted&&p.updatedAt)push(out,{id:`part-${i}-fitted`,type:"repair",title:"Part fitted",detail:[name,p.partNumber].filter(Boolean).join(" · "),at:p.fittedAt||p.updatedAt});
  });

  asArray(job.timingRuns).forEach((r,i)=>{const at=timingWhen(r);if(!at)return;push(out,{id:`timing-${r.id||i}`,type:"timing",title:r.phase||"Timing run",detail:timingDetail(r),at});});

  asArray(job.stages).forEach((s,i)=>{if(!s?.complete||!s?.updatedAt)return;push(out,{id:`stage-${idPart(s.name||i)}-complete`,type:"stage",title:"Stage completed",detail:[s.name,s.measure].filter(Boolean).join(" · "),at:s.updatedAt});});

  asArray(job.timelineManual).forEach((e,i)=>push(out,{id:e.id||`manual-${i}`,type:e.type||"note",title:e.title||"Bench note",detail:e.detail||e.note||"",at:e.at||e.createdAt,manual:true}));

  if(job.completedAt)push(out,{id:"job-complete",type:"complete",title:job.status==="Spares"?"Job closed as spares":"Job completed",detail:job.repairPerformed||job.writeOff||job.status||"",at:job.completedAt});

  const seen=new Set();return out.filter(e=>{const k=e.id||`${e.at}|${e.title}|${e.detail}`;if(seen.has(k))return false;seen.add(k);return true;}).sort((a,b)=>String(a.at).localeCompare(String(b.at)));
}
