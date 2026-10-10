import { guidanceFor } from './repair-guidance.js?v=1';

const text=v=>String(v||'').trim();
const fold=v=>text(v).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
function identity(job={}){const p=job.passport||{};return {calibre:fold(p.calibre),maker:fold(p.movementMaker||p.maker),model:fold(p.model)};}
function relationWeight(a={},b={}){const A=identity(a),B=identity(b);if(A.calibre&&A.calibre===B.calibre)return 3;if(A.maker&&A.model&&A.maker===B.maker&&A.model===B.model)return 2;if(A.maker&&A.maker===B.maker)return 1;return 0;}
export function faultHistory(job={},state={},fault={}){
  const out={confirmed:0,ruledout:0,possible:0,weightedConfirmed:0,weightedRuledout:0,examples:[]};
  for(const other of state.jobs||[]){if(!other||other.id===job.id)continue;const weight=relationWeight(job,other);if(!weight)continue;for(const f of other.diagnosticFaults||[]){if(!f||f.id!==fault.id)continue;if(f.status==='confirmed'){out.confirmed++;out.weightedConfirmed+=weight;}else if(f.status==='ruledout'){out.ruledout++;out.weightedRuledout+=weight;}else out.possible++;if(out.examples.length<3)out.examples.push({jobId:other.id,watchName:other.watchName||'',status:f.status||'possible',calibre:other.passport?.calibre||'',weight});}}
  return out;
}
function scoreFault(fault,history){let score=fault.status==='confirmed'?82:48;score+=Math.min(15,history.weightedConfirmed*4);score-=Math.min(18,history.weightedRuledout*5);if(fault.severity==='Critical')score+=8;if(fault.severity==='Parts required')score+=5;return Math.max(0,Math.min(100,score));}
export function diagnosticIntelligence(job={},state={}){
  const active=(job.diagnosticFaults||[]).filter(f=>f&&f.status!=='ruledout');
  return active.map(fault=>{const history=faultHistory(job,state,fault),guide=guidanceFor(fault),score=scoreFault(fault,history);return {fault,history,score,confidence:score>=85?'High':score>=65?'Moderate':score>=45?'Investigate':'Low',parts:[...(guide?.parts||[])],inspect:[...(guide?.inspect||[])].slice(0,2)};}).sort((a,b)=>b.score-a.score||String(a.fault.text).localeCompare(String(b.fault.text)));
}
