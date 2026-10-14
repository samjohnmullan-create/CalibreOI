import {STAGE_COPY} from './stages.js';
import {ensureWorkStages} from './work-stages.js';
import {timingRunUsable} from './timing-runs.js';
import {partReadiness} from './work-parts-lifecycle.js';

const stepObj=(raw,index)=>typeof raw==='string'?{id:String(index),text:raw}:raw;
const answer=(stage,raw,index)=>{const step=stepObj(raw,index);return stage?.checks?.[step.id]??stage?.checks?.[index]??'';};
const accepted=value=>value==='yes'||value==='na'||value===true;

function visible(work,stage,raw,index){
  const step=stepObj(raw,index);
  if(step.when){
    const defs=STAGE_COPY[stage.name]?.steps||[],dependencyIndex=defs.findIndex((candidate,i)=>stepObj(candidate,i).id===step.when.id),actual=dependencyIndex>=0?answer(stage,defs[dependencyIndex],dependencyIndex):'';
    if(Array.isArray(step.when.values)?!step.when.values.includes(actual):actual!==step.when.value)return false;
  }
  if(step.whenGlobal){
    const other=(work.stages||[]).find(candidate=>candidate.name===step.whenGlobal.stage);if(!other)return false;
    const defs=STAGE_COPY[other.name]?.steps||[],dependencyIndex=defs.findIndex((candidate,i)=>stepObj(candidate,i).id===step.whenGlobal.id),actual=dependencyIndex>=0?answer(other,defs[dependencyIndex],dependencyIndex):'';
    if(Array.isArray(step.whenGlobal.values)?!step.whenGlobal.values.includes(actual):actual!==step.whenGlobal.value)return false;
  }
  return true;
}

export function workCompletionReadiness(work={},state={},item={}){
  ensureWorkStages(work,item);
  const issues=[],qcIndex=(work.stages||[]).findIndex(stage=>stage.name==='Final QC'),qc=qcIndex>=0?work.stages[qcIndex]:null;
  if(!qc)issues.push('Final QC stage is missing.');
  else{
    const defs=STAGE_COPY['Final QC']?.steps||[];
    for(let i=0;i<defs.length;i++){
      const raw=defs[i];if(!visible(work,qc,raw,i))continue;
      const value=answer(qc,raw,i),label=stepObj(raw,i).text||'Final QC check';
      if(value==='no'||value===false)issues.push(`${label} — failed.`);
      else if(!accepted(value))issues.push(`${label} — unanswered.`);
    }
    if(!qc.complete)issues.push('Final QC stage is not marked complete.');
    const timingAnswer=qc.checks?.timing;
    if(timingAnswer==='yes'&&!(work.timingRuns||[]).some(timingRunUsable))issues.push('Final timing is marked complete, but no usable timing run is saved.');
  }
  const parts=partReadiness(state,work);
  if(parts.total&&!parts.allFitted)issues.push(`${parts.total-parts.fitted} required part${parts.total-parts.fitted===1?' is':'s are'} not fitted.`);
  if(work.status==='Waiting')issues.push('Work is still marked Waiting.');
  if(String(work.blocker||'').trim())issues.push(`Blocker remains: ${String(work.blocker).trim()}`);
  return {ready:issues.length===0,issues,qcIndex,qc,parts};
}
