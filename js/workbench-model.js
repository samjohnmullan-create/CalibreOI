import { allItems, itemDisplayName, normaliseWork } from './item-model.js';

const num=value=>Number(value)||0;
const dateMs=value=>{const t=Date.parse(value||'');return Number.isFinite(t)?t:0;};
const daysSince=value=>{const t=dateMs(value);return t?Math.max(0,Math.floor((Date.now()-t)/86400000)):0;};
const JOB_GROUP={Purchased:'Needs attention','Awaiting inspection':'Needs attention','On bench':'On bench','Awaiting parts':'Waiting','Ready for photos':'Ready','Ready to list':'Ready',Listed:'Ready',Sold:'Closed',Spares:'Closed'};
const WORK_GROUP={Planned:'Needs attention','In progress':'On bench',Waiting:'Waiting',Complete:'Closed',Cancelled:'Closed'};

function itemCost(item={}){
  const c=item.commercial||{};
  return ['purchasePrice','buyerPremium','postage','preparationCost','repairCost','partsCost','consumables','externalService','marketplaceFees','shippingToBuyer','otherCost'].reduce((sum,key)=>sum+num(c[key]),0);
}
function potentialProfit(item={}){
  const c=item.commercial||{};
  return num(c.targetSale)-itemCost(item);
}
function linkedItem(items,job){
  return items.find(item=>(job.itemId&&String(item.id)===String(job.itemId))||(item.legacyJobId&&String(item.legacyJobId)===String(job.id)))||null;
}
function legacyBlockers(job={}){
  const out=[];
  if(job.status==='Awaiting parts')out.push('Waiting on parts');
  const missing=(job.parts||[]).filter(part=>!part.received).length;
  if(missing)out.push(`${missing} part${missing===1?'':'s'} outstanding`);
  const critical=(job.faults||[]).filter(f=>f.severity==='Critical'||f.severity==='Parts required').length;
  if(critical)out.push(`${critical} major fault${critical===1?'':'s'}`);
  if(job.writeOff)out.push('Write-off review');
  return out;
}
function legacyNextAction(job={}){
  if(job.nextAction)return job.nextAction;
  if(job.status==='Awaiting parts')return 'Receive or source required parts';
  if(['Purchased','Awaiting inspection'].includes(job.status))return 'Inspect and diagnose';
  if(job.status==='Ready for photos')return 'Photograph for listing';
  if(job.status==='Ready to list')return 'Create listing';
  if(job.status==='Listed')return 'Monitor sale / offers';
  if(job.status==='Spares')return 'Catalogue donor parts';
  if((job.parts||[]).some(part=>!part.received))return 'Check outstanding parts';
  if(job.diagnosis&&!job.repairPerformed)return 'Continue repair';
  return 'Review work and choose next action';
}
function workNextAction(work={}){
  if(work.nextAction)return work.nextAction;
  if(work.status==='Waiting')return 'Resolve blocker and continue work';
  if(work.status==='Planned')return 'Start work';
  if(work.status==='In progress')return 'Continue work';
  if(work.status==='Complete')return 'Review completed record';
  return 'Review work record';
}

export function workbenchEntries(state={}){
  const items=allItems(state),entries=[];
  for(const job of (state.jobs||[])){
    const item=linkedItem(items,job),commercial=item?.commercial||{},queued=!['Sold','Spares'].includes(job.status)&&job.workbenchHidden===true;
    entries.push({
      key:`job:${job.id}`,
      kind:'legacy-job',
      sourceId:job.id,
      itemId:item?.id||job.itemId||'',
      title:item?itemDisplayName(item):(job.watchName||'Untitled watch'),
      subtitle:[job.jobId||'',job.status||'Purchased'].filter(Boolean).join(' · '),
      workTitle:job.jobId||'Watch service',
      status:job.status||'Purchased',
      group:queued?'Queue':(JOB_GROUP[job.status]||'Needs attention'),
      queued,
      priority:!!job.priority,
      nextAction:legacyNextAction(job),
      diagnosis:job.diagnosis||'',
      blockers:legacyBlockers(job),
      cover:'',
      cashIn:item?itemCost(item):0,
      targetSale:num(commercial.targetSale||job.business?.targetSale),
      potential:item?potentialProfit(item):num(job.business?.targetSale)-num(job.business?.purchasePrice)-num(job.business?.buyerPremium)-num(job.business?.postage)-num(job.business?.partsCost),
      ageDays:item?daysSince(commercial.acquiredAt||item.createdAt):daysSince(job.acquiredAt||job.createdAt),
      openHref:`service.html?id=${encodeURIComponent(job.id)}`
    });
  }
  for(const raw of (state.workRecords||[])){
    const work=normaliseWork(raw),item=items.find(candidate=>String(candidate.id)===String(work.itemId));
    if(!item)continue;
    const queued=!['Complete','Cancelled'].includes(work.status)&&raw.workbenchHidden===true,commercial=item.commercial||{};
    entries.push({
      key:`work:${work.id}`,
      kind:'work',
      sourceId:work.id,
      itemId:item.id,
      title:itemDisplayName(item),
      subtitle:[work.title,work.status].filter(Boolean).join(' · '),
      workTitle:work.title,
      status:work.status,
      group:queued?'Queue':(WORK_GROUP[work.status]||'Needs attention'),
      queued,
      priority:!!raw.priority,
      nextAction:workNextAction({...work,nextAction:raw.nextAction}),
      diagnosis:work.findings||'',
      blockers:work.status==='Waiting'?['Work is waiting']:[],
      cover:item.mediaAssets?.find(asset=>asset?.isCover&&(asset.thumbnailUrl||asset.url))?.thumbnailUrl||item.mediaAssets?.find(asset=>asset?.thumbnailUrl||asset?.url)?.thumbnailUrl||item.mediaAssets?.find(asset=>asset?.url)?.url||'',
      cashIn:itemCost(item),
      targetSale:num(commercial.targetSale),
      potential:potentialProfit(item),
      ageDays:daysSince(commercial.acquiredAt||item.createdAt),
      openHref:`work.html?id=${encodeURIComponent(work.id)}`
    });
  }
  return entries;
}

export function mutateWorkbenchEntry(state={},entry,action){
  if(!entry)return false;
  if(entry.kind==='legacy-job'){
    const target=(state.jobs||[]).find(job=>String(job.id)===String(entry.sourceId));
    if(!target)return false;
    if(action==='priority')target.priority=!target.priority;
    if(action==='bench')target.workbenchHidden=!target.workbenchHidden;
    if(action==='wait')target.status='Awaiting parts';
    target.updatedAt=new Date().toISOString();
    return true;
  }
  const target=(state.workRecords||[]).find(work=>String(work.id)===String(entry.sourceId));
  if(!target)return false;
  if(action==='priority')target.priority=!target.priority;
  if(action==='bench')target.workbenchHidden=!target.workbenchHidden;
  if(action==='wait')target.status='Waiting';
  target.updatedAt=new Date().toISOString();
  return true;
}
