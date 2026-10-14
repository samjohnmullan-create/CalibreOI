import {recordFitEvidence} from './parts-intelligence.js';

const STATUS_ORDER=['needed','sourced','received','fitted'];
const text=value=>String(value??'').trim();
const qty=value=>Math.max(1,Number(value)||1);
const now=()=>new Date().toISOString();

export function workPartRequirements(state={},work={}){
  const ids=new Set((Array.isArray(work.partIds)?work.partIds:[]).map(String));
  return (state.inventory?.parts||[]).filter(part=>ids.has(String(part.id)));
}

export function partReadiness(state={},work={}){
  const requirements=workPartRequirements(state,work);
  const open=requirements.filter(part=>!['received','fitted','used'].includes(part.status));
  const ready=requirements.filter(part=>['received','fitted','used'].includes(part.status));
  const fitted=requirements.filter(part=>['fitted','used'].includes(part.status));
  return {requirements,total:requirements.length,open:open.length,ready:ready.length,fitted:fitted.length,allReady:requirements.length>0&&open.length===0,allFitted:requirements.length>0&&fitted.length===requirements.length};
}

function requirementById(state,work,requirementId){
  const ids=new Set((work.partIds||[]).map(String));
  if(!ids.has(String(requirementId)))throw new Error('That part is not required by this Work record.');
  const requirement=(state.inventory?.parts||[]).find(part=>String(part.id)===String(requirementId));
  if(!requirement)throw new Error('Required part could not be found.');
  return requirement;
}

function sourceLabel(state,source={}){
  if(source.sourceType==='stock'){
    const part=(state.inventory?.parts||[]).find(row=>String(row.id)===String(source.sourceId));
    return part?.name||part?.reference||'Loose stock';
  }
  if(source.sourceType==='donorItem'){
    const donor=(state.items||[]).find(row=>String(row.id)===String(source.sourceId));
    return donor?.title||'Donor Item';
  }
  return source.label||'External source';
}

export function assignRequirementSource(state,work,requirementId,source={}){
  if(!['stock','donorItem','external'].includes(source.sourceType))throw new Error('Choose a valid part source.');
  if(source.sourceType!=='external'&&!source.sourceId)throw new Error('Choose a source first.');
  const requirement=requirementById(state,work,requirementId);
  if(['fitted','used'].includes(requirement.status))throw new Error('A fitted part source cannot be changed.');
  const at=now();
  requirement.fulfilment={sourceType:source.sourceType,sourceId:text(source.sourceId),sourcePartId:text(source.sourcePartId||source.partId),label:source.label||sourceLabel(state,source),selectedAt:at,receivedAt:source.sourceType==='external'?'':at};
  requirement.status=source.sourceType==='external'?'sourced':'received';
  requirement.updatedAt=at;
  work.updatedAt=at;
  return requirement;
}

function recordUsedPart(work,requirement,fulfilment,at){
  work.partsUsed=Array.isArray(work.partsUsed)?work.partsUsed:[];
  const existing=work.partsUsed.find(row=>String(row.requirementId)===String(requirement.id));
  const entry={requirementId:String(requirement.id),name:requirement.name||'Part',reference:requirement.reference||'',quantity:qty(requirement.quantity),sourceType:fulfilment?.sourceType||'external',sourceId:text(fulfilment?.sourceId),sourceLabel:fulfilment?.label||'External source',fittedAt:at};
  if(existing)Object.assign(existing,entry);else work.partsUsed.push(entry);
  return entry;
}

function consumeStock(state,requirement,fulfilment,at){
  const source=(state.inventory?.parts||[]).find(row=>String(row.id)===String(fulfilment.sourceId));
  if(!source||source.workId||fulfilment.consumedAt)return;
  const remaining=Math.max(0,(Number(source.quantity)||0)-qty(requirement.quantity));
  source.quantity=remaining;
  if(remaining===0)source.status='used';
  source.updatedAt=at;
  fulfilment.consumedAt=at;
}

function consumeDonor(state,work,requirement,fulfilment,at){
  const donor=(state.items||[]).find(row=>String(row.id)===String(fulfilment.sourceId));
  if(!donor||fulfilment.consumedAt)return;
  donor.watch=donor.watch&&typeof donor.watch==='object'?donor.watch:{};
  donor.watch.sparesParts=Array.isArray(donor.watch.sparesParts)?donor.watch.sparesParts:[];
  donor.watch.sparesParts.push({id:`donor-use-${Date.now().toString(36)}${Math.random().toString(36).slice(2,6)}`,name:requirement.name||'Part',reference:requirement.reference||'',quantity:0,used:true,keep:false,targetWorkId:String(work.id||''),removedAt:at});
  donor.updatedAt=at;
  fulfilment.consumedAt=at;
}

export function setRequirementStatus(state,work,requirementId,status){
  if(!STATUS_ORDER.includes(status))throw new Error('Invalid part status.');
  const requirement=requirementById(state,work,requirementId);
  if(requirement.status==='fitted'&&status==='fitted')return requirement;
  if(['fitted','used'].includes(requirement.status)&&status!=='fitted')throw new Error('A fitted part cannot be moved backwards.');
  const at=now();
  requirement.fulfilment=requirement.fulfilment&&typeof requirement.fulfilment==='object'?requirement.fulfilment:{};
  if(status==='received')requirement.fulfilment.receivedAt=requirement.fulfilment.receivedAt||at;
  if(status==='fitted'){
    requirement.fulfilment.receivedAt=requirement.fulfilment.receivedAt||at;
    requirement.fulfilment.fittedAt=at;
    recordUsedPart(work,requirement,requirement.fulfilment,at);
    if(requirement.fulfilment.sourceType==='stock')consumeStock(state,requirement,requirement.fulfilment,at);
    if(requirement.fulfilment.sourceType==='donorItem')consumeDonor(state,work,requirement,requirement.fulfilment,at);
    if(['stock','donorItem'].includes(requirement.fulfilment.sourceType)&&requirement.fulfilment.sourceId){
      recordFitEvidence(state,work,{sourceType:requirement.fulfilment.sourceType,sourceId:requirement.fulfilment.sourceId,partId:requirement.fulfilment.sourceType==='stock'?requirement.fulfilment.sourceId:'',partName:requirement.name||'',result:'used',note:`Fitted to ${work.title||'Work'}`});
    }
  }
  requirement.status=status;
  requirement.updatedAt=at;
  work.updatedAt=at;
  return requirement;
}

export function resumeWorkAfterParts(state,work){
  const readiness=partReadiness(state,work);
  if(!readiness.allReady)throw new Error('All required parts must be received before Work can resume.');
  const at=now();
  work.status='In progress';work.workbenchHidden=false;
  if(/part|waiting/i.test(work.blocker||''))work.blocker='';
  if(!work.nextAction||/part|wait/i.test(work.nextAction))work.nextAction='Continue repair';
  work.updatedAt=at;
  const item=(state.items||[]).find(row=>String(row.id)===String(work.itemId));
  if(item){item.status='On bench';item.updatedAt=at;}
  return readiness;
}
