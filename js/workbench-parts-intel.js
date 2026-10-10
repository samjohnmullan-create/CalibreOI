import { partsNeedSummary } from './parts-need-summary.js?v=1';

export function workbenchPartsIntel(job={},state={}){
  const needs=(Array.isArray(job.parts)?job.parts:[]).filter(p=>p&&!p.fitted);
  if(!needs.length)return {needed:0,matched:0,likely:0,bestScore:0,label:''};
  const rows=partsNeedSummary(job,state);
  let matched=0,likely=0,bestScore=0;
  for(const row of rows){
    const score=Number(row?.best?.score)||0;
    if(score>=35)matched++;
    if(score>=85)likely++;
    if(score>bestScore)bestScore=score;
  }
  const label=likely?`${likely} likely owned match${likely===1?'':'es'}`:matched?`${matched} owned candidate${matched===1?'':'s'}`:'No owned match yet';
  return {needed:needs.length,matched,likely,bestScore,label};
}
