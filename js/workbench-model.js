import { allItems, itemDisplayName } from './item-model.js';
import { normaliseWork } from './work-model.js?v=2';

const num=value=>Number(value)||0;
const dateMs=value=>{const t=Date.parse(value||'');return Number.isFinite(t)?t:0;};
const daysSince=value=>{const t=dateMs(value);return t?Math.max(0,Math.floor((Date.now()-t)/86400000)):0;};
const WORK_GROUP={Planned:'Needs attention','In progress':'On bench',Waiting:'Waiting',Complete:'Closed',Cancelled:'Closed'};
function itemCost(item={}){const c=item.commercial||{};return ['purchasePrice','buyerPremium','postage','preparationCost','repairCost','partsCost','consumables','externalService','marketplaceFees','shippingToBuyer','otherCost'].reduce((sum,key)=>sum+num(c[key]),0);}
function potentialProfit(item={}){const c=item.commercial||{};return num(c.targetSale)-itemCost(item);}
function workNextAction(work={}){if(work.nextAction)return work.nextAction;if(work.status==='Waiting')return work.blocker||'Resolve blocker and continue work';if(work.status==='Planned')return 'Start work';if(work.status==='In progress')return 'Continue work';if(work.status==='Complete')return 'Review completed record';return 'Review work record';}
function blockersFor(work={}){const out=[];if(work.blocker)out.push(work.blocker);if(work.status==='Waiting'&&!out.length)out.push('Work is waiting');return out;}
function coverFor(item={}){const assets=Array.isArray(item.mediaAssets)?item.mediaAssets:[];return assets.find(asset=>asset?.isCover&&(asset.thumbnailUrl||asset.url))?.thumbnailUrl||assets.find(asset=>asset?.thumbnailUrl||asset?.url)?.thumbnailUrl||assets.find(asset=>asset?.url)?.url||'';}
function stageProgress(work={}){
  const stages=Array.isArray(work.stages)?work.stages:[];
  if(!stages.length)return {stageName:'No workflow yet',stageIndex:0,stageCount:0,doneStages:0,progressPct:0};
  const index=Math.max(0,Math.min(stages.length-1,Number(work.stageIndex)||0));
  const current=stages[index]||stages[0]||{};
  const done=stages.filter(stage=>stage?.complete||stage?.completedAt).length;
  return {stageName:current?.title||current?.name||`Stage ${index+1}`,stageIndex:index,stageCount:stages.length,doneStages:done,progressPct:Math.round(done/stages.length*100)};
}
function needsParts(work={}){const blocker=String(work.blocker||'').toLowerCase();return work.status==='Waiting'&&(blocker.includes('part')||Array.isArray(work.partIds)&&work.partIds.length>0)||blocker.includes('part');}
export function workbenchEntries(state={}){const items=allItems(state),entries=[],works=Array.isArray(state.work)?state.work:[];for(const raw of works){const work=normaliseWork(raw);if(!work.id||!work.itemId)continue;const item=items.find(candidate=>String(candidate.id)===String(work.itemId));if(!item)continue;const queued=!['Complete','Cancelled'].includes(work.status)&&work.workbenchHidden===true,commercial=item.commercial||{},stage=stageProgress(work);entries.push({key:`work:${work.id}`,kind:'work',sourceId:work.id,workId:work.id,itemId:item.id,title:itemDisplayName(item),subtitle:[work.title||'Work',work.status||'Planned'].filter(Boolean).join(' · '),workTitle:work.title||'Work',status:work.status||'Planned',group:queued?'Queue':(WORK_GROUP[work.status]||'Needs attention'),queued,priority:!!work.priority,nextAction:workNextAction(work),diagnosis:work.diagnosis||'',blockers:blockersFor(work),needsParts:needsParts(work),stageName:stage.stageName,stageIndex:stage.stageIndex,stageCount:stage.stageCount,doneStages:stage.doneStages,progressPct:stage.progressPct,cover:coverFor(item),cashIn:itemCost(item),targetSale:num(commercial.targetSale),potential:potentialProfit(item),ageDays:daysSince(commercial.acquiredAt||item.createdAt),openHref:`work.html?id=${encodeURIComponent(work.id)}`});}return entries;}
export function mutateWorkbenchEntry(state={},entry,action){
  if(!entry?.workId&&!entry?.sourceId)return false;
  const id=entry.workId||entry.sourceId,target=(state.work||[]).find(work=>String(work.id)===String(id));
  if(!target)return false;
  if(action==='priority')target.priority=!target.priority;
  if(action==='bench'){
    const wasQueued=target.workbenchHidden===true;
    target.workbenchHidden=!wasQueued;
    if(wasQueued&&target.status==='Planned')target.status='In progress';
    else if(!wasQueued&&target.status==='In progress')target.status='Planned';
  }
  if(action==='wait'){
    target.workbenchHidden=false;
    target.status='Waiting';
    if(!target.blocker)target.blocker='Waiting on parts';
  }
  target.updatedAt=new Date().toISOString();
  return true;
}
