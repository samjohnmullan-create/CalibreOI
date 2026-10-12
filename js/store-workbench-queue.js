import * as base from './store-local-fast.js?v=3';
import {currentWork} from './work-model.js?v=2';
export * from './store-local-fast.js?v=3';

const pageName=loc=>{if(!loc)return '';try{return (loc.pathname.split('/').pop()||'').split('?')[0];}catch{return '';}};
const itemIdFromLocation=loc=>{if(!loc)return '';try{const p=new URLSearchParams(loc.search||'');return p.get('item')||p.get('itemId')||(['passport.html','business.html','sales.html'].includes(pageName(loc))?p.get('id'):'')||'';}catch{return '';}};
const itemById=(state,id)=>Array.isArray(state?.items)?state.items.find(item=>String(item?.id)===String(id)):null;
const fill=(obj,key,value)=>{if((obj[key]===undefined||obj[key]===null||String(obj[key]).trim()==='')&&value!==undefined&&value!==null&&String(value).trim()!=='')obj[key]=value;};
function exposeItemAliases(item){
  if(!item)return null;
  item.watch=item.watch&&typeof item.watch==='object'?item.watch:{};
  item.watch.passport=item.watch.passport&&typeof item.watch.passport==='object'?item.watch.passport:{};
  item.watch.passportPhotos=item.watch.passportPhotos&&typeof item.watch.passportPhotos==='object'?item.watch.passportPhotos:{};
  item.commercial=item.commercial&&typeof item.commercial==='object'?item.commercial:{};
  item.sale=item.sale&&typeof item.sale==='object'?item.sale:{};
  const p=item.watch.passport,identity=item.identity||{};
  fill(p,'maker',identity.maker);fill(p,'model',identity.model);fill(p,'year',identity.year||identity.era);fill(p,'country',identity.country);fill(p,'serial',identity.serial);fill(p,'reference',identity.reference);fill(p,'caseMaterial',identity.materials);fill(p,'notes',identity.notes);fill(p,'waterMark',/waterproof/i.test(identity.notes||'')?'Waterproof (historic marking only)':'');
  item.passport=p;
  item.photos=item.watch.passportPhotos;
  item.business=item.commercial;
  item.offers=Array.isArray(item.sale.offers)?item.sale.offers:[];
  item.channel=item.commercial.saleChannel||item.channel||'Not listed';
  item.watchName=item.title||item.identity?.title||[item.identity?.maker,item.identity?.model].filter(Boolean).join(' ')||'Watch dossier';
  return item;
}
function syncItemAliases(state){
  for(const item of Array.isArray(state?.items)?state.items:[]){
    if(!item||typeof item!=='object')continue;
    item.watch=item.watch&&typeof item.watch==='object'?item.watch:{};
    item.commercial=item.commercial&&typeof item.commercial==='object'?item.commercial:{};
    item.sale=item.sale&&typeof item.sale==='object'?item.sale:{};
    if(item.passport&&typeof item.passport==='object')item.watch.passport=item.passport;
    if(item.photos&&typeof item.photos==='object')item.watch.passportPhotos=item.photos;
    if(item.business&&typeof item.business==='object')item.commercial={...item.commercial,...item.business};
    if(item.channel)item.commercial.saleChannel=item.channel;
    if(item.commercial.soldDate&&!item.commercial.soldAt)item.commercial.soldAt=item.commercial.soldDate;
    if(Number(item.commercial.actualSale)>0&&item.commercial.soldAt)item.status='Sold';
    if(Array.isArray(item.offers))item.sale.offers=item.offers;
  }
}
export function current(state,loc=typeof location!=='undefined'?location:null){
  const page=pageName(loc),requestedItem=itemIdFromLocation(loc)||state?.currentItemId||'';
  if(['passport.html','business.html','sales.html'].includes(page)&&requestedItem){
    const item=itemById(state,requestedItem);
    if(item)return exposeItemAliases(item);
  }
  return currentWork(state,loc)||base.current(state);
}
export async function loadState(){const state=await base.loadState();if(!state)return {items:[],work:[]};state.items=Array.isArray(state.items)?state.items:[];state.work=Array.isArray(state.work)?state.work:[];return state;}
// Canonical Work is authoritative, while legacy Passport/Commerce screens are bridged to Item data.
export async function saveState(state){state.items=Array.isArray(state.items)?state.items:[];state.work=Array.isArray(state.work)?state.work:[];syncItemAliases(state);return base.saveState(state);}
export async function importInboxItems(items){return base.importInboxItems(items);}
