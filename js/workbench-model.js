import { allItems, itemDisplayName } from './item-model.js';

const num=value=>Number(value)||0;
const dateMs=value=>{const t=Date.parse(value||'');return Number.isFinite(t)?t:0;};
const daysSince=value=>{const t=dateMs(value);return t?Math.max(0,Math.floor((Date.now()-t)/86400000)):0;};
const WORK_GROUP={Planned:'Needs attention','In progress':'On bench',Waiting:'Waiting',Complete:'Closed',Cancelled:'Closed'};

function itemCost(item={}){
  const c=item.commercial||{};
  return ['purchasePrice','buyerPremium','postage','preparationCost','repairCost','partsCost','consumables','externalService','marketplaceFees','shippingToBuyer','otherCost'].reduce((sum,key)=>sum+num(c[key]),0);
}
function potentialProfit(item={}){
  const c=item.commercial||{};
  return num(c.targetSale)-itemCost(item);
}
function workNextAction(work={}){
  if(work.nextAction)return work.nextAction;
  if(work.status==='Waiting')return work.blocker||'Resolve blocker and continue work';
  if(work.status==='Planned')return 'Start work';
  if(work.status==='In progress')return 'Continue work';
  if(work.status==='Complete')return 'Review completed record';
  return 'Review work record';
}
function blockersFor(work={}){
  const out=[];
  if(work.blocker)out.push(work.blocker);
  if(work.status==='Waiting'&&!out.length)out.push('Work is waiting');
  return out;
}
function coverFor(item={}){
  const assets=Array.isArray(item.mediaAssets)?item.mediaAssets:[];
  return assets.find(asset=>asset?.isCover&&(asset.thumbnailUrl||asset.url))?.thumbnailUrl||assets.find(asset=>asset?.thumbnailUrl||asset?.url)?.thumbnailUrl||assets.find(asset=>asset?.url)?.url||'';
}

// Workbench is now a view of canonical Work records only. Legacy Jobs may still exist
// temporarily for migration/import, but they are not rendered or mutated here.
export function workbenchEntries(state={}){
  const items=allItems(state),entries=[],works=Array.isArray(state.workRecords)?state.workRecords:[];
  for(const work of works){
    if(!work?.id||!work?.itemId)continue;
    const item=items.find(candidate=>String(candidate.id)===String(work.itemId));
    if(!item)continue;
    const queued=!['Complete','Cancelled'].includes(work.status)&&work.workbenchHidden===true;
    const commercial=item.commercial||{};
    entries.push({
      key:`work:${work.id}`,
      kind:'work',
      sourceId:work.id,
      workId:work.id,
      itemId:item.id,
      title:itemDisplayName(item),
      subtitle:[work.title||'Work',work.status||'Planned'].filter(Boolean).join(' · '),
      workTitle:work.title||'Work',
      status:work.status||'Planned',
      group:queued?'Queue':(WORK_GROUP[work.status]||'Needs attention'),
      queued,
      priority:!!work.priority,
      nextAction:workNextAction(work),
      diagnosis:work.diagnosis||work.findings||'',
      blockers:blockersFor(work),
      cover:coverFor(item),
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
  if(!entry?.workId&&!entry?.sourceId)return false;
  const id=entry.workId||entry.sourceId;
  const target=(state.workRecords||[]).find(work=>String(work.id)===String(id));
  if(!target)return false;
  if(action==='priority')target.priority=!target.priority;
  if(action==='bench')target.workbenchHidden=!target.workbenchHidden;
  if(action==='wait'){
    target.status='Waiting';
    if(!target.blocker)target.blocker='Waiting on parts';
  }
  target.updatedAt=new Date().toISOString();
  return true;
}
