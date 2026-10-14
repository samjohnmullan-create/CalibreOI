import * as base from './store-local-fast.js?v=3';
import {currentWork} from './work-model.js?v=2';
import {readCloudState} from './cloud.js?v=5';
import {stripRetiredTopLevel} from './persistence-boundary.js?v=1';
export * from './store-local-fast.js?v=3';

const ITEM_PAGES=new Set(['item.html','passport.html','business.html','sales.html','documents.html']);
const pageName=loc=>{if(!loc)return '';try{return (loc.pathname.split('/').pop()||'').split('?')[0];}catch{return '';}};
const itemIdFromLocation=loc=>{if(!loc)return '';try{const p=new URLSearchParams(loc.search||'');const page=pageName(loc);return p.get('item')||p.get('itemId')||(ITEM_PAGES.has(page)?p.get('id'):'')||'';}catch{return '';}};
const itemById=(state,id)=>Array.isArray(state?.items)?state.items.find(item=>String(item?.id)===String(id)):null;
const fill=(obj,key,value)=>{if((obj[key]===undefined||obj[key]===null||String(obj[key]).trim()==='')&&value!==undefined&&value!==null&&String(value).trim()!=='')obj[key]=value;};
const own=(obj,key)=>Object.prototype.hasOwnProperty.call(obj,key);

function normaliseItemCompatibility(item){
  if(!item||typeof item!=='object')return item;
  item.watch=item.watch&&typeof item.watch==='object'?item.watch:{};
  item.watch.passport=item.watch.passport&&typeof item.watch.passport==='object'?item.watch.passport:{};
  item.watch.passportPhotos=item.watch.passportPhotos&&typeof item.watch.passportPhotos==='object'?item.watch.passportPhotos:{};
  item.commercial=item.commercial&&typeof item.commercial==='object'?item.commercial:{};
  item.sale=item.sale&&typeof item.sale==='object'?item.sale:{};

  // Older Item-page code wrote these convenience fields directly onto Item.
  // Fold any persisted copies back into their canonical owners, then remove them.
  if(own(item,'passport')&&item.passport&&typeof item.passport==='object')item.watch.passport={...item.watch.passport,...item.passport};
  if(own(item,'photos')&&item.photos&&typeof item.photos==='object')item.watch.passportPhotos={...item.watch.passportPhotos,...item.photos};
  if(own(item,'business')&&item.business&&typeof item.business==='object')item.commercial={...item.commercial,...item.business};
  if(own(item,'offers')&&Array.isArray(item.offers))item.sale.offers=item.offers;
  if(own(item,'channel')&&item.channel)item.commercial.saleChannel=item.channel;
  if(item.commercial.soldDate&&!item.commercial.soldAt)item.commercial.soldAt=item.commercial.soldDate;
  if(Number(item.commercial.actualSale)>0&&item.commercial.soldAt)item.status='Sold';
  for(const key of ['passport','photos','business','offers','channel','watchName']){
    const descriptor=Object.getOwnPropertyDescriptor(item,key);
    if(descriptor?.enumerable)delete item[key];
  }

  const p=item.watch.passport,identity=item.identity||{};
  fill(p,'maker',identity.maker);fill(p,'model',identity.model);fill(p,'year',identity.year||identity.era);fill(p,'country',identity.country);fill(p,'serial',identity.serial);fill(p,'reference',identity.reference);fill(p,'caseMaterial',identity.materials);fill(p,'notes',identity.notes);
  return item;
}

function alias(item,key,getter,setter){
  const existing=Object.getOwnPropertyDescriptor(item,key);
  if(existing&&!existing.configurable)return;
  Object.defineProperty(item,key,{configurable:true,enumerable:false,get:getter,set:setter});
}

function exposeItemCompatibility(item){
  if(!normaliseItemCompatibility(item))return null;
  alias(item,'passport',()=>item.watch.passport,value=>{if(value&&typeof value==='object')item.watch.passport=value;});
  alias(item,'photos',()=>item.watch.passportPhotos,value=>{if(value&&typeof value==='object')item.watch.passportPhotos=value;});
  alias(item,'business',()=>item.commercial,value=>{if(value&&typeof value==='object')item.commercial=value;});
  alias(item,'offers',()=>Array.isArray(item.sale.offers)?item.sale.offers:[],value=>{item.sale.offers=Array.isArray(value)?value:[];});
  alias(item,'channel',()=>item.commercial.saleChannel||'Not listed',value=>{item.commercial.saleChannel=value||'Not listed';});
  alias(item,'watchName',()=>item.title||item.identity?.title||[item.identity?.maker,item.identity?.model].filter(Boolean).join(' ')||'Watch dossier',value=>{if(value)item.title=String(value);});
  return item;
}

// Canonical Work is authoritative. This layer resolves Item/Work context only;
// compatibility views are non-enumerable and never become persisted Core fields.
function mergeCanonical(local,remote){
  if(!remote||typeof remote!=='object')return local;
  if(Array.isArray(remote.items))local.items=remote.items;
  if(Array.isArray(remote.work))local.work=remote.work;
  if(remote.currentItemId!==undefined)local.currentItemId=remote.currentItemId||'';
  if(remote.currentWorkId!==undefined)local.currentWorkId=remote.currentWorkId||'';
  return stripRetiredTopLevel(local);
}

export function current(state,loc=typeof location!=='undefined'?location:null){
  const page=pageName(loc);
  if(ITEM_PAGES.has(page)){
    const requestedItem=itemIdFromLocation(loc)||state?.currentItemId||'';
    return requestedItem?exposeItemCompatibility(itemById(state,requestedItem)):null;
  }
  if(['work.html','timegrapher.html','suppliers.html','workbench.html'].includes(page))return currentWork(state,loc);
  return currentWork(state,loc)||base.current(state);
}

export async function loadState(){
  let state=stripRetiredTopLevel(await base.loadState());
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
  return stripRetiredTopLevel(state);
}

export async function saveState(state){
  state.items=Array.isArray(state.items)?state.items:[];
  state.work=Array.isArray(state.work)?state.work:[];
  for(const item of state.items)normaliseItemCompatibility(item);
  return base.saveState(stripRetiredTopLevel(state));
}
export async function importInboxItems(items){return base.importInboxItems(items);}
