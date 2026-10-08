const raw=v=>v==null?"":String(v).trim();
const finite=v=>Number.isFinite(Number(v));
const answer=(job,id)=>job?.finalQc?.checks?.[id]??"";

export const FINAL_QC_CHECKS=[
  {id:"winding",label:"Winding",detail:"Crown/winding action is smooth, secure and normal."},
  {id:"setting",label:"Setting",detail:"Hands set correctly and crown positions engage positively."},
  {id:"hands",label:"Hands",detail:"Hands align and clear each other, dial and crystal through a full cycle."},
  {id:"calendar",label:"Calendar / complications",detail:"All fitted calendar or complication functions operate correctly.",optional:true},
  {id:"case",label:"Case security",detail:"Movement, caseback, crystal and crown are correctly seated and secure."},
  {id:"strap",label:"Strap / bracelet",detail:"Strap, bracelet, spring bars and clasp are secure and presentable."},
  {id:"reserve",label:"Running reserve",detail:"Useful running/power-reserve performance has been checked."},
  {id:"extended",label:"Extended run",detail:"Watch completed an extended running test appropriate to the work."},
  {id:"appearance",label:"Final appearance",detail:"Dial, hands, crystal and case are clean with no workshop marks or debris."},
  {id:"disclosure",label:"Disclosure",detail:"Known limitations, wear and remaining issues are recorded for the listing."}
];

function finalStage(job){return (job?.stages||[]).find(s=>s?.name==="Final QC")||null;}
export function finalTiming(job){
  const runs=(job?.timingRuns||[]).filter(r=>finite(r?.rateSecondsPerDay??r?.rate));
  const tagged=r=>/^(after service|regulation test|final test)$/i.test(raw(r?.phase));
  const finals=runs.filter(tagged);
  return finals.length?finals[finals.length-1]:null;
}
function activeFaults(job){return (job?.diagnosticFaults||[]).filter(f=>f&&f.status!=="ruledout");}
function openParts(job){return (job?.parts||[]).filter(p=>raw(p?.part)&&!p?.fitted);}

export function finalQcAssessment(job){
  const stage=finalStage(job),timing=finalTiming(job),faults=activeFaults(job),parts=openParts(job);
  const required=FINAL_QC_CHECKS.filter(x=>!x.optional);
  const unanswered=required.filter(x=>!["pass","fail","na"].includes(answer(job,x.id)));
  const failed=FINAL_QC_CHECKS.filter(x=>answer(job,x.id)==="fail");
  const blockers=[];

  if(!stage)blockers.push("Final QC stage is missing");
  if(unanswered.length)blockers.push(`${unanswered.length} release check${unanswered.length===1?"":"s"} not answered`);
  if(failed.length)blockers.push(`${failed.length} release check${failed.length===1?"":"s"} failed`);
  if(!timing)blockers.push("No After service / Regulation test / Final test timing run saved");
  if(faults.length)blockers.push(`${faults.length} unresolved fault${faults.length===1?"":"s"}`);
  if(parts.length)blockers.push(`${parts.length} required part${parts.length===1?"":"s"} not marked fitted`);
  if(!stage?.complete)blockers.push("Final QC stage is not marked complete");

  let status="hold";
  if(failed.length||faults.length||parts.length)status="attention";
  else if(stage?.complete&&unanswered.length===0&&timing)status="pass";

  return {
    status,
    label:status==="pass"?"PASS":status==="attention"?"NEEDS ATTENTION":"HOLD",
    stage,timing,faults,parts,unanswered,failed,blockers,
    pass:status==="pass"
  };
}
