import * as base from './store-local-fast.js?v=3';
import {currentWork} from './work-model.js?v=2';
import {readCloudState} from './cloud.js?v=5';
export * from './store-local-fast.js?v=3';

const ITEM_PAGES=new Set(['item.html','passport.html','business.html','sales.html','documents.html']);
const pageName=loc=>{if(!loc)return '';try{return (loc.pathname.split('/').pop()||'').split('?')[0];}catch{return '';}};
const itemIdFromLocation=loc=>{if(!loc)return '';try{const p=new URLSearchParams(loc.search||'');const page=pageName(loc);return p.get('item')||p.get('itemId')||(ITEM_PAGES.has(page)?p.get('id'):'')||'';}catch{return '';}};
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
  fill(p,'maker',identity.maker);fill(p,'model',identity.model);fill(p,'year',identity.year||identity.era);fill(p,'country',identity.country);fill(p,'serial',identity.serial);fill(p,'reference',identity.reference);fill(p,'caseMaterial',identity.materials);fill(p,'notes',identity.notes);
  item.passport=p;
  item.photos=item.watch.passportPhotos;
  item.business=item.commercial;
  item.offers=Array.isArray(item.sale.offers)?item.sale.offers:[];
  item.channel=item.commercial.saleChannel||'Not listed';
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

function mergeCanonical(local,remote){
  if(!remote||typeof remote!=='object')return local;
  if(Array.isArray(remote.items))local.items=remote.items;
  if(Array.isArray(remote.work))local.work=remote.work;
  if(remote.currentItemId!==undefined)local.currentItemId=remote.currentItemId||'';
  if(remote.currentWorkId!==undefined)local.currentWorkId=remote.currentWorkId||'';
  return local;
}

export function current(state,loc=typeof location!=='undefined'?location:null){
  const page=pageName(loc);
  if(ITEM_PAGES.has(page)){
    const requestedItem=itemIdFromLocation(loc)||state?.currentItemId||'';
    return requestedItem?exposeItemAliases(itemById(state,requestedItem)):null;
  }
  if(['work.html','timegrapher.html','suppliers.html','workbench.html'].includes(page))return currentWork(state,loc);
  return currentWork(state,loc)||base.current(state);
}

export async function loadState(){
  let state=await base.loadState();
  if(!state)state={items:[],work:[]};
  state.items=Array.isArray(state.items)?state.items:[];
  state.work=Array.isArray(state.work)?state.work:[];
  const page=pageName(typeof location!=='undefined'?location:null);
  if(ITEM_PAGES.has(page)){
    try{
      const cloud=await readCloudState();
      if(cloud?.signedIn&&cloud.state)state=mergeCanonical(state,cloud.state);
    }catch(err){console.warn('Canonical Item cloud read deferred',err);}
  }
  return state;
}

export async function saveState(state){
  state.items=Array.isArray(state.items)?state.items:[];
  state.work=Array.isArray(state.work)?state.work:[];
  syncItemAliases(state);
  return base.saveState(state);
}
export async function importInboxItems(items){return base.importInboxItems(items);}
