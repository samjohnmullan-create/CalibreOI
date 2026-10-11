import {WORK_TYPES,WORK_STATUSES,createWork,normaliseWork,worksForItem} from './work-model.js';
export {WORK_TYPES,WORK_STATUSES,normaliseWork,worksForItem} from './work-model.js';

export const ITEM_TYPES=[['watch','Watch'],['clock','Clock'],['jewellery','Jewellery'],['accessory','Accessory'],['collectible','Collectible'],['other','Other']];
export const ITEM_PURPOSES=[['resale','Resale'],['personal','Personal / Collection'],['customer','Customer'],['donor','Donor / Spares'],['reference','Reference']];
export const ITEM_STATUSES=['Incoming','Acquired','Researching','Preparing','On bench','Awaiting parts','Ready to list','Listed','Sold','Retained','Archived'];
const now=()=>new Date().toISOString();
const id=prefix=>`${prefix}-${Math.random().toString(36).slice(2,9)}${Date.now().toString(36).slice(-4)}`;
const text=value=>value==null?'':String(value);
const list=value=>Array.isArray(value)?value:[];
export function isWatchLike(item){return ['watch','clock'].includes(item?.type);}
export function isResaleItem(item){return (item?.purpose||'resale')==='resale';}
export function blankCommercial(partial={}){return {purchasePrice:'',buyerPremium:'',postage:'',preparationCost:'',repairCost:'',partsCost:'',consumables:'',externalService:'',marketplaceFees:'',shippingToBuyer:'',otherCost:'',labourMinutes:'',labourRate:'',targetSale:'',minSale:'',actualSale:'',source:'',saleChannel:'Not listed',acquiredAt:'',listedAt:'',soldAt:'',...partial};}
export function blankIdentity(partial={}){return {maker:'',model:'',title:'',country:'',era:'',year:'',materials:'',marks:'',reference:'',serial:'',dimensions:'',weight:'',notes:'',...partial};}
export function blankPreparation(partial={}){return {cleaning:'',restoration:'',repairs:'',photography:'',listingPrep:'',finalCondition:'',...partial};}
export function blankWatchExtension(partial={}){return {passport:partial.passport&&typeof partial.passport==='object'?partial.passport:{},timingHistory:list(partial.timingHistory),serviceHistory:list(partial.serviceHistory),movement:partial.movement&&typeof partial.movement==='object'?partial.movement:{},publicPassport:{published:false,publicId:'',publishedAt:'',...(partial.publicPassport||{})},storageLocation:text(partial.storageLocation),fitsNote:text(partial.fitsNote),sparesParts:list(partial.sparesParts)};}
export function blankWork(partial={}){return createWork(partial);}
export function blankItem(partial={}){
  const createdAt=partial.createdAt||now(),type=ITEM_TYPES.some(([key])=>key===partial.type)?partial.type:'other';
  const donorStatus=partial.status==='Donor / spares',requestedPurpose=donorStatus?'donor':partial.purpose,purpose=ITEM_PURPOSES.some(([key])=>key===requestedPurpose)?requestedPurpose:'resale',requestedStatus=donorStatus?'Retained':partial.status;
  const item={id:partial.id||id('item'),type,purpose,title:partial.title||'Untitled item',status:ITEM_STATUSES.includes(requestedStatus)?requestedStatus:'Acquired',identity:blankIdentity(partial.identity),condition:partial.condition||'',research:list(partial.research),preparation:blankPreparation(partial.preparation),mediaAssets:list(partial.mediaAssets),commercial:blankCommercial(partial.commercial),sale:partial.sale&&typeof partial.sale==='object'?partial.sale:{},workIds:list(partial.workIds),tags:list(partial.tags),notes:partial.notes||'',createdAt,updatedAt:partial.updatedAt||createdAt};
  if(isWatchLike(item))item.watch=blankWatchExtension(partial.watch);
  return item;
}
export function normaliseItem(raw={}){return blankItem(raw);}
export function allItems(state={}){const items=list(state.items).map(normaliseItem);return state?.__itemScope==='resale'?items.filter(isResaleItem):items;}
export function itemDisplayName(item={}){return text(item.title||item.identity?.title||[item.identity?.maker,item.identity?.model].filter(Boolean).join(' ')||'Untitled item');}
