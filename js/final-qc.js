const raw=v=>v==null?"":String(v).trim();
const finite=v=>Number.isFinite(Number(v));
const answer=(stage,id)=>stage?.checks?.[id]??"";
const isYes=v=>v==="yes"||v===true||v==="na";

export const FINAL_QC_IDS=[
  "windSet","hands","calendar","case","strap","timing","reserve","extended","appearance","disclosure"
];

function finalStage(job){return (job?.stages||[]).find(s=>s?.name==="Final QC")||null;}
function finalTiming(job){
  const runs=(job?.timingRuns||[]).filter(r=>finite(r?.rateSecondsPerDay??r?.rate));
  const tagged=r=>/^(after service|regulation test|final test)$/i.test(raw(r?.phase));
  const finals=runs.filter(tagged);
  return finals.length?finals[finals.length-1]:null;
}
function activeFaults(job){return (job?.diagnosticFaults||[]).filter(f=>f&&f.status!=="ruledout");}
function openParts(job){return (job?.parts||[]).filter(p=>raw(p?.part)&&!p?.fitted);}

export function finalQcAssessment(job){
  const stage=finalStage(job),timing=finalTiming(job),faults=activeFaults(job),parts=openParts(job);
  const applicable=FINAL_QC_IDS.filter(id=>id!=="calendar"||answer(stage,"calendar")!=="na");
  const unanswered=applicable.filter(id=>!["yes","no","na",true,false].includes(answer(stage,id)));
  const failed=applicable.filter(id=>answer(stage,id)==="no"||answer(stage,id)===false);
  const blockers=[];
  if(!stage)blockers.push("Final QC stage is missing");
  if(unanswered.length)blockers.push(`${unanswered.length} QC check${unanswered.length===1?"":"s"} not answered`);
  if(failed.length)blockers.push(`${failed.length} QC check${failed.length===1?"":"s"} failed`);
  if(!timing)blockers.push("No After service / Regulation test / Final test timing run saved");
  if(faults.length)blockers.push(`${faults.length} unresolved fault${faults.length===1?"":"s"}`);
  if(parts.length)blockers.push(`${parts.length} required part${parts.length===1?"":"s"} not marked fitted`);

  let status="hold";
  if(failed.length||faults.length||parts.length)status="attention";
  else if(stage?.complete&&unanswered.length===0&&timing)status="pass";

  return {
    status,
    label:status==="pass"?"PASS":status==="attention"?"NEEDS ATTENTION":"HOLD",
    stage,
    timing,
    faults,
    parts,
    unanswered,
    failed,
    blockers,
    pass:status==="pass"
  };
}
