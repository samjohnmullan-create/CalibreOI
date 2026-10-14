export const WORK_TYPES=[['service','Service'],['repair','Repair'],['inspection','Inspection'],['cleaning','Cleaning / preparation'],['restoration','Restoration'],['photography','Photography preparation'],['listing','Listing preparation']];
export const WORK_STATUSES=['Planned','In progress','Waiting','Complete','Cancelled'];
const now=()=>new Date().toISOString();
const text=v=>v==null?'':String(v);
const list=v=>Array.isArray(v)?v:[];
const uid=()=>`work-${Math.random().toString(36).slice(2,9)}${Date.now().toString(36).slice(-4)}`;
export function createWork(partial={}){
  const createdAt=partial.createdAt||now(),type=WORK_TYPES.some(([key])=>key===partial.type)?partial.type:'inspection',status=WORK_STATUSES.includes(partial.status)?partial.status:'Planned';
  const workbenchHidden=partial.workbenchHidden===undefined?status==='Planned':!!partial.workbenchHidden;
  return {id:partial.id||uid(),itemId:text(partial.itemId),number:text(partial.number),type,title:partial.title||WORK_TYPES.find(([key])=>key===type)?.[1]||'Work',status,diagnosis:partial.diagnosis||partial.findings||'',faults:list(partial.faults),diagnosticFaults:list(partial.diagnosticFaults),stages:list(partial.stages),stageIndex:Math.max(0,Number(partial.stageIndex)||0),measurements:list(partial.measurements),partIds:list(partial.partIds),partsUsed:list(partial.partsUsed),labour:partial.labour&&typeof partial.labour==='object'?{minutes:'',rate:'',...partial.labour}:{minutes:partial.labourMinutes??'',rate:''},timingRuns:list(partial.timingRuns),repairPerformed:partial.repairPerformed||partial.workPerformed||'',decision:partial.decision||'',finalQC:partial.finalQC&&typeof partial.finalQC==='object'?partial.finalQC:{},nextAction:partial.nextAction||'',blocker:partial.blocker||'',outcome:partial.outcome||'',materials:partial.materials||'',cost:partial.cost??'',notes:partial.notes||'',priority:!!partial.priority,workbenchHidden,openedAt:partial.openedAt||createdAt.slice(0,10),completedAt:partial.completedAt||'',createdAt,updatedAt:partial.updatedAt||createdAt};
}
export function normaliseWork(raw={}){return createWork(raw);}
export function worksForItem(state={},itemId=''){return list(state.work).map(normaliseWork).filter(work=>String(work.itemId)===String(itemId));}
export function findWork(state={},workId=''){return list(state.work).find(work=>String(work.id)===String(workId))||null;}
export function workIdFromLocation(loc=typeof location!=='undefined'?location:null){if(!loc)return '';try{const p=new URLSearchParams(loc.search||'');return p.get('work')||p.get('workId')||'';}catch{return '';}}
export function currentWork(state={},loc=typeof location!=='undefined'?location:null){const requested=workIdFromLocation(loc)||state.currentWorkId||'';return requested?findWork(state,requested):null;}
