import { WORK_TYPES, WORK_STATUSES, createWork, normaliseWork, worksForItem } from './work-model.js';
export { WORK_TYPES, WORK_STATUSES, normaliseWork, worksForItem } from './work-model.js';

export const ITEM_TYPES = [
  ['watch','Watch'],['clock','Clock'],['jewellery','Jewellery'],['accessory','Accessory'],['collectible','Collectible'],['other','Other']
];
export const ITEM_PURPOSES = [
  ['resale','Resale'],['personal','Personal / Collection'],['customer','Customer'],['donor','Donor / Spares'],['reference','Reference']
];
export const ITEM_STATUSES = ['Incoming','Acquired','Researching','Preparing','On bench','Awaiting parts','Ready to list','Listed','Sold','Retained','Archived'];
const now=()=>new Date().toISOString();
const id=prefix=>`${prefix}-${Math.random().toString(36).slice(2,9)}${Date.now().toString(36).slice(-4)}`;
const text=value=>value==null?'':String(value);
const num=value=>Number(value)||0;
const list=value=>Array.isArray(value)?value:[];
export function isWatchLike(item){return ['watch','clock'].includes(item?.type);}
export function isResaleItem(item){return (item?.purpose||'resale')==='resale';}
export function blankCommercial(partial={}){return {purchasePrice:'',buyerPremium:'',postage:'',preparationCost:'',repairCost:'',partsCost:'',consumables:'',externalService:'',marketplaceFees:'',shippingToBuyer:'',otherCost:'',labourMinutes:'',labourRate:'',targetSale:'',minSale:'',actualSale:'',source:'',saleChannel:'Not listed',acquiredAt:'',listedAt:'',soldAt:'',...partial};}
export function blankIdentity(partial={}){return {maker:'',model:'',title:'',country:'',era:'',year:'',materials:'',marks:'',reference:'',serial:'',dimensions:'',weight:'',notes:'',...partial};}
export function blankPreparation(partial={}){return {cleaning:'',restoration:'',repairs:'',photography:'',listingPrep:'',finalCondition:'',...partial};}
export function blankWatchExtension(partial={}){return {
  passport:partial.passport&&typeof partial.passport==='object'?partial.passport:{},
  timingHistory:list(partial.timingHistory),
  serviceHistory:list(partial.serviceHistory),
  movement:partial.movement&&typeof partial.movement==='object'?partial.movement:{},
  publicPassport:{published:false,publicId:'',publishedAt:'',...(partial.publicPassport||{})},
  storageLocation:text(partial.storageLocation),
  fitsNote:text(partial.fitsNote),
  sparesParts:list(partial.sparesParts)
};}
export function blankWork(partial={}){return createWork(partial);}
export function blankItem(partial={}){
  const createdAt=partial.createdAt||now();
  const type=ITEM_TYPES.some(([key])=>key===partial.type)?partial.type:'other';
  const oldDonorStatus=partial.status==='Donor / spares';
  const requestedPurpose=oldDonorStatus?'donor':partial.purpose;
  const purpose=ITEM_PURPOSES.some(([key])=>key===requestedPurpose)?requestedPurpose:'resale';
  const requestedStatus=oldDonorStatus?'Retained':partial.status;
  const item={
    id:partial.id||id('item'),type,purpose,title:partial.title||'Untitled item',
    status:ITEM_STATUSES.includes(requestedStatus)?requestedStatus:'Acquired',
    identity:blankIdentity(partial.identity),condition:partial.condition||'',
    research:list(partial.research),preparation:blankPreparation(partial.preparation),
    mediaAssets:list(partial.mediaAssets),commercial:blankCommercial(partial.commercial),
    sale:partial.sale&&typeof partial.sale==='object'?partial.sale:{},workIds:list(partial.workIds),
    tags:list(partial.tags),notes:partial.notes||'',createdAt,updatedAt:partial.updatedAt||createdAt
  };
  if(isWatchLike(item))item.watch=blankWatchExtension(partial.watch);
  return item;
}
export function normaliseItem(raw={}){return blankItem(raw);}

// Legacy Job conversion is import tooling only. Canonical Item views never consult
// state.jobs and these helpers must not be called from normal Item rendering.
function legacyType(job={}){return job.jobType==='clock'?'clock':job.jobType==='inspect'?'accessory':'watch';}
export function itemStatusFromJob(job={}){const map={Purchased:'Acquired','Awaiting inspection':'Researching','On bench':'On bench','Awaiting parts':'Awaiting parts','Ready for photos':'Preparing','Ready to list':'Ready to list',Listed:'Listed',Sold:'Sold',Spares:'Retained'};return map[job.status]||'Acquired';}
function legacyPurpose(job={}){return job.status==='Spares'?'donor':'resale';}
function validPhoto(value){const s=String(value||'').trim();return !!s&&(/^(data:image\/|https?:\/\/|blob:|\/)/i.test(s));}
export function jobCoverPhoto(job={}){const shots=job.photos||{};for(const key of ['hero','intake','finished','dial','caseback','movement','damage','progress','salescaseback']){const src=Array.isArray(shots[key])?shots[key].find(validPhoto):'';if(src)return src;}const pp=Array.isArray(job.passport?.photos)?job.passport.photos.find(validPhoto):'';if(pp)return pp;for(const stage of (job.stages||[])){const src=Array.isArray(stage?.photos)?stage.photos.find(validPhoto):'';if(src)return src;}const media=(job.mediaAssets||[]).find(a=>a?.isCover&&(a.thumbnailUrl||a.url))||(job.mediaAssets||[]).find(a=>a?.thumbnailUrl||a?.url);return media?.thumbnailUrl||media?.url||'';}
export function legacyJobToItem(job={}){const p=job.passport||{},b=job.business||{},type=legacyType(job),prep=num(b.strapCost)+num(b.batteryCost),cover=jobCoverPhoto(job);return blankItem({
  id:job.itemId||`item-${job.id||id('legacy')}`,type,purpose:legacyPurpose(job),
  title:job.watchName||[p.maker,p.model].filter(Boolean).join(' ')||'Untitled item',status:itemStatusFromJob(job),
  identity:{maker:p.maker||'',model:p.model||'',title:job.watchName||'',country:p.country||'',year:p.year||'',materials:p.caseMaterial||'',marks:[p.hallmarks,p.engravings].filter(Boolean).join(' · '),reference:p.reference||p.caseNumber||'',serial:p.serial||'',dimensions:[p.width,p.height,p.thickness].filter(Boolean).join(' × '),notes:p.notes||''},
  condition:job.condition||job.stages?.[0]?.condition||'',mediaAssets:cover?[{id:`import-cover-${job.id||Date.now()}`,url:cover,thumbnailUrl:cover,isCover:true}]:list(job.mediaAssets),
  commercial:{purchasePrice:b.purchasePrice||'',buyerPremium:b.buyerPremium||'',postage:b.postage||'',preparationCost:prep?String(prep):'',partsCost:b.partsCost||'',consumables:b.consumables||'',externalService:b.externalService||'',marketplaceFees:b.marketplaceFees||'',shippingToBuyer:b.shippingToBuyer||'',otherCost:b.otherCost||'',labourMinutes:b.labourMinutes||'',labourRate:b.labourRate||'',targetSale:b.targetSale||'',minSale:b.minSale||'',actualSale:b.actualSale||'',source:p.auctionHouse||p.seller||'',saleChannel:job.channel||'Not listed',acquiredAt:job.acquiredAt||'',listedAt:job.sale?.listedDate||'',soldAt:job.soldAt||''},
  sale:job.sale||{},notes:job.notes||'',createdAt:job.createdAt,updatedAt:job.updatedAt,
  watch:{passport:p,timingHistory:list(job.timingRuns),movement:{maker:p.movementMaker||'',calibre:p.calibre||'',calibreFamily:p.calibreFamily||'',jewels:p.jewels||'',beatRate:p.beatRate||'',movementType:p.movementType||'',movementMm:p.movementMm||'',escapement:p.escapement||''}}
});}
export function legacyJobToWork(job={},itemId=''){return normaliseWork({id:job.id||undefined,itemId:itemId||job.itemId||'',number:job.jobId||'',type:job.decision==='Regulate only'?'service':job.jobType==='inspect'?'inspection':'service',title:job.jobId?`Service ${job.jobId}`:'Watch service',status:job.status==='Sold'?'Complete':WORK_STATUSES.includes(job.status)?job.status:'In progress',diagnosis:job.diagnosis||'',repairPerformed:job.repairPerformed||'',decision:job.decision||'',labourMinutes:job.business?.labourMinutes||'',cost:job.business?.partsCost||'',timingRuns:list(job.timingRuns),stages:list(job.stages),faults:list(job.faults),diagnosticFaults:list(job.diagnosticFaults),openedAt:(job.createdAt||'').slice(0,10),completedAt:job.status==='Sold'||job.status==='Ready to list'?(job.updatedAt||'').slice(0,10):'',createdAt:job.createdAt,updatedAt:job.updatedAt});}

// Canonical Item collection: no derived Jobs, no linked-Job status overrides, no
// transient Job photos. What is stored as an Item is what the app renders as an Item.
export function allItems(state={}){const items=list(state.items).map(normaliseItem);return state?.__itemScope==='resale'?items.filter(isResaleItem):items;}
export function itemDisplayName(item={}){return text(item.title||item.identity?.title||[item.identity?.maker,item.identity?.model].filter(Boolean).join(' ')||'Untitled item');}
