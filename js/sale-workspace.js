import {timingRunUsable,timingRuns} from './timing-runs.js';
import {workCompletionReadiness} from './work-completion.js';

const text=value=>String(value??'').trim();
const num=value=>Number(value)||0;
const now=()=>new Date().toISOString();
const today=()=>new Date().toISOString().slice(0,10);

export function resolveSaleContext(state={},requested={}){
  const items=Array.isArray(state.items)?state.items:[],works=Array.isArray(state.work)?state.work:[];
  const requestedWorkId=text(requested.workId||state.currentWorkId),requestedItemId=text(requested.itemId||state.currentItemId);
  let work=requestedWorkId?works.find(row=>String(row.id)===requestedWorkId)||null:null;
  let item=requestedItemId?items.find(row=>String(row.id)===requestedItemId)||null:null;
  if(!item&&work)item=items.find(row=>String(row.id)===String(work.itemId))||null;
  if(!work&&item){
    const linked=works.filter(row=>String(row.itemId)===String(item.id)).sort((a,b)=>String(b.completedAt||b.updatedAt||b.openedAt||b.createdAt||'').localeCompare(String(a.completedAt||a.updatedAt||a.openedAt||a.createdAt||'')));
    work=linked.find(row=>row.status==='Complete')||linked[0]||null;
  }
  if(item)state.currentItemId=item.id;
  if(work)state.currentWorkId=work.id;
  return {item,work};
}

export function saleMediaCandidates(item={}){
  return (Array.isArray(item.mediaAssets)?item.mediaAssets:[]).filter(asset=>asset&&!asset.deletedAt&&(String(asset.mimeType||'').startsWith('image/')||asset.url||asset.thumbnailUrl||asset.storageKey)).map(asset=>({
    id:String(asset.id||''),src:asset.thumbnailUrl||asset.url||'',label:asset.caption||asset.originalName||asset.role||asset.category||'Photo',role:asset.role||'',category:asset.category||''
  })).filter(row=>row.id&&row.src);
}

export function ensureSale(item={}){
  item.sale=item.sale&&typeof item.sale==='object'?item.sale:{};
  const pack=item.sale.photoPack&&typeof item.sale.photoPack==='object'?item.sale.photoPack:(item.sale.photoPack={hero:'',selected:[],roles:{}});
  if(!Array.isArray(pack.selected))pack.selected=[];
  if(!pack.roles||typeof pack.roles!=='object')pack.roles={};
  return item.sale;
}

export function listingPackStatus(item={}){
  const sale=ensureSale(item),pack=sale.photoPack,list=saleMediaCandidates(item),valid=new Set(list.map(row=>row.id));
  pack.selected=pack.selected.map(String).filter(id=>valid.has(id));
  if(pack.hero&&!valid.has(String(pack.hero)))pack.hero='';
  for(const role of Object.keys(pack.roles))if(!valid.has(String(pack.roles[role])))delete pack.roles[role];
  const selected=pack.selected.length,hero=!!pack.hero,complete=hero&&selected>=3;
  const recommendedMissing=[!pack.roles.front?'front/dial':null,!pack.roles.movement?'movement':null,!pack.roles.caseback?'caseback':null].filter(Boolean);
  return {pack,list,selected,hero,total:list.length,complete,recommendedMissing};
}

export function latestFinalTiming(work={}){
  return timingRuns(work).find(timingRunUsable)||null;
}

export function listingSnapshot(item={},work={}){
  const identity=item.identity||{},watch=item.watch||{},passport=watch.passport||{},commercial=item.commercial||{},pack=listingPackStatus(item).pack,timing=latestFinalTiming(work);
  return {
    at:now(),itemId:String(item.id||''),workId:String(work?.id||''),
    identity:{title:item.title||'',maker:identity.maker||passport.maker||'',model:identity.model||passport.model||'',year:identity.year||passport.year||'',calibre:passport.calibre||watch.movement?.calibre||'',jewels:passport.jewels||'',movementMaker:passport.movementMaker||watch.movement?.maker||'',caseMaterial:passport.caseMaterial||identity.materials||'',caseStyle:passport.caseStyle||'',serial:identity.serial||passport.serial||passport.caseNumber||'',dimensions:identity.dimensions||'',width:passport.width||'',thickness:passport.thickness||'',lugWidth:passport.lugWidth||''},
    condition:item.preparation?.finalCondition||item.condition||'',diagnosis:work?.diagnosis||'',repairPerformed:work?.repairPerformed||'',
    timing:timing?{rateSecondsPerDay:timing.rateSecondsPerDay,beatErrorMs:timing.beatErrorMs,position:timing.position,phase:timing.phase,savedAt:timing.savedAt}:null,
    targetSale:commercial.targetSale||'',minimumSale:commercial.minSale||'',photos:{hero:pack.hero,selected:[...pack.selected],roles:{...pack.roles}}
  };
}

export function saleReadiness(item={},work={},state={}){
  const identity=item.identity||{},passport=item.watch?.passport||{},commercial=item.commercial||{},pack=listingPackStatus(item),condition=text(item.preparation?.finalCondition||item.condition),completion=work?workCompletionReadiness(work,state,item):{ready:false,issues:['No completed Work record is linked.']},timing=work?latestFinalTiming(work):null;
  const checks=[
    {id:'work',label:'Completed Work',ok:!!work&&work.status==='Complete'&&completion.ready,detail:work?completion.ready?'Workshop completion verified':completion.issues[0]||'Work is not complete':'No Work linked',required:true},
    {id:'identity',label:'Identity',ok:!!text(identity.maker||identity.model||item.title),detail:text([identity.maker,identity.model].filter(Boolean).join(' '))||item.title||'Add identity',required:true},
    {id:'condition',label:'Final condition',ok:!!condition,detail:condition||'Record final condition',required:true},
    {id:'repair',label:'Service / repair record',ok:!!text(work?.repairPerformed||work?.diagnosis),detail:text(work?.repairPerformed||work?.diagnosis)||'Record workshop outcome',required:true},
    {id:'timing',label:'Final timing',ok:!!timing,detail:timing?`${timing.rateSecondsPerDay>=0?'+':''}${Number(timing.rateSecondsPerDay).toFixed(1)} s/day · ${timing.position||'position not set'}`:'No usable final timing run',required:false},
    {id:'photos',label:'Listing photo pack',ok:pack.complete,detail:pack.complete?`${pack.selected} selected · hero chosen`:`${pack.selected} selected · ${pack.hero?'hero chosen':'choose a hero'} · minimum 3`,required:true},
    {id:'price',label:'Sale target',ok:num(commercial.targetSale)>0,detail:num(commercial.targetSale)>0?`Target $${num(commercial.targetSale).toFixed(2)}`:'Set a target sale price',required:true},
    {id:'calibre',label:'Movement / calibre',ok:!!text(passport.calibre||item.watch?.movement?.calibre),detail:text(passport.calibre||item.watch?.movement?.calibre)||'Movement not recorded',required:false}
  ];
  const required=checks.filter(row=>row.required),requiredDone=required.filter(row=>row.ok).length;
  return {ready:requiredDone===required.length,checks,requiredDone,requiredTotal:required.length,allDone:checks.filter(row=>row.ok).length,allTotal:checks.length,pack,completion,timing};
}

export function saleMetrics(item={}){
  const c=item.commercial||{};
  const costKeys=['purchasePrice','buyerPremium','postage','preparationCost','repairCost','partsCost','consumables','externalService','marketplaceFees','shippingToBuyer','otherCost'];
  const invested=costKeys.reduce((sum,key)=>sum+num(c[key]),0),target=num(c.targetSale),actual=num(c.actualSale);
  return {invested,target,minimum:num(c.minSale),actual,projectedProfit:target?target-invested:0,actualProfit:actual?actual-invested:0};
}

function saleLedgerId(item){return `sale-${String(item.id||'item')}`;}
export function recordSold(state={},item={},details={}){
  const actual=num(details.actualSale??item.commercial?.actualSale);if(!(actual>0))throw new Error('Enter the actual sale price first.');
  item.commercial=item.commercial&&typeof item.commercial==='object'?item.commercial:{};
  item.commercial.actualSale=String(actual);item.commercial.saleChannel=text(details.channel||item.commercial.saleChannel||'Other');item.commercial.soldAt=text(details.soldAt||item.commercial.soldAt||today());item.status='Sold';item.updatedAt=now();
  state.ledger=Array.isArray(state.ledger)?state.ledger:[];
  const id=saleLedgerId(item),entry=state.ledger.find(row=>String(row.id)===id),payload={id,kind:'in',category:'Item sale',method:item.commercial.saleChannel,amount:actual,when:item.commercial.soldAt,note:`Sale · ${item.title||item.id}`,itemId:String(item.id||''),createdAt:entry?.createdAt||now(),updatedAt:now()};
  if(entry)Object.assign(entry,payload);else state.ledger.push(payload);
  return payload;
}
