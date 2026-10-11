export const WORK_KINDS=[['service','Service'],['repair','Repair'],['inspection','Inspection'],['restoration','Restoration'],['cleaning','Cleaning'],['assessment','Assessment'],['other','Other']];
export const JOB_TYPES=WORK_KINDS;
export const STAGE_PATHS={service:['Intake','Pre-service timing','Uncasing','Dismantling & inspection','Cleaning & parts inspection','Repairs & parts','Reassembly & lubrication','Train & escapement','Balance & beat','Casing & function','Regulation','Final QC'],repair:['Intake','Diagnosis','Repair','Reassembly','Function test','Final QC'],inspection:['Intake','Inspection','Final QC'],restoration:['Intake','Assessment','Restoration','Reassembly','Final QC']};
export const STAGES=STAGE_PATHS.service;
export const FAULT_CHIPS=['Crown/winder non-functional','Movement loose','Strap missing','Case scratched','Water resistance unverified','Poor timing','High beat error','Magnetised','Mainspring/barrel fault','Keyless works fault','Balance/hairspring fault'];
export const SEVERITIES=['Minor','Moderate','Critical','Parts required'];
export const STATUSES=['Planned','In progress','Waiting','Complete','Cancelled'];
export const CHANNELS=['Not listed','eBay','Facebook Marketplace','Instagram','Shopify','Etsy','Auction','Private sale','Other'];
export const PHOTO_SLOTS=[['intake','Intake'],['caseback','Caseback'],['movement','Movement'],['dial','Dial'],['damage','Damage'],['progress','Repair progress'],['finished','Finished'],['hero','Sales hero']];
export const STORE_SCHEMA_VERSION=4;
const DB='calibre-co-v1',STORE='kv';let dbp;
function openDB(){if(dbp)return dbp;dbp=new Promise((resolve,reject)=>{const req=indexedDB.open(DB,1);req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE))req.result.createObjectStore(STORE);};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});return dbp;}
function get(key){return openDB().then(db=>new Promise((resolve,reject)=>{const req=db.transaction(STORE).objectStore(STORE).get(key);req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);}));}
function put(key,value){return openDB().then(db=>new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(value,key);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);}));}
export function uid(prefix='id'){return `${prefix}-${Math.random().toString(36).slice(2,8)}${Date.now().toString(36).slice(-4)}`;}
export function slugify(value){return String(value||'item').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'item';}
export function blankPhotos(){return Object.fromEntries(PHOTO_SLOTS.map(([key])=>[key,[]]));}
export function blankPart(){return {id:uid('part'),part:'',supplier:'',partNumber:'',quantity:'1',cost:'',ordered:'',received:false,fitted:false};}
export function blankStage(){return {id:uid('stage'),name:'',notes:'',condition:'',parts:'',measure:'',complete:false,photos:[],checks:{},updatedAt:null};}
export function blankPassport(){return {maker:'',model:'',country:'',year:'',confidence:'Unknown',fieldConfidence:{},dialMarkings:'',movementMaker:'',calibre:'',calibreFamily:'',beatRate:'',powerReserve:'',settingType:'',jewels:'',movementType:'',movementMm:'',escapement:'',serial:'',caseNumber:'',reference:'',caseMaterial:'',caseStyle:'',casebackType:'',crystalType:'',crownType:'',lugWidth:'',width:'',height:'',thickness:'',complications:'',waterMark:'',strap:'',hallmarks:'',engravings:'',notes:'',history:'',warnings:'',auctionHouse:'',lotNumber:'',auctionDate:'',seller:'',invoiceNumber:'',listingText:'',invoicePhoto:'',sources:[],photos:[]};}
export function blankBusiness(){return {purchasePrice:'',buyerPremium:'',postage:'',preparationCost:'',repairCost:'',partsCost:'',consumables:'',externalService:'',marketplaceFees:'',shippingToBuyer:'',otherCost:'',labourMinutes:'',labourRate:'',targetSale:'',actualSale:'',minSale:'',title:'',text:''};}
export function stagesFor(work={}){return STAGE_PATHS[String(work.type||'service').toLowerCase()]||STAGES;}
export function stockAge(item={}){const from=item.commercial?.acquiredAt||item.createdAt;return from?Math.max(0,Math.floor((Date.now()-Date.parse(from))/86400000)):0;}
export function partsCost(work={}){return (work.parts||[]).reduce((n,p)=>n+(Number(p.cost)||0)*(Number(p.quantity)||1),0);}
export function coverPhoto(record={}){const assets=Array.isArray(record.mediaAssets)?record.mediaAssets:[];return assets.find(a=>a?.isCover&&(a.thumbnailUrl||a.url))?.thumbnailUrl||assets.find(a=>a?.thumbnailUrl||a?.url)?.thumbnailUrl||assets.find(a=>a?.url)?.url||'';}
export function progress(work={}){const stages=Array.isArray(work.stages)?work.stages:[];if(!stages.length)return 0;return Math.round(stages.filter(s=>s?.complete||s?.completedAt).length/stages.length*100);}
export function money(n){const v=Number(n);return Number.isFinite(v)?v.toLocaleString('en-AU',{style:'currency',currency:'AUD'}):'$0.00';}
export function escapeHtml(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
export function labourCost(b={}){return (Number(b.labourMinutes)||0)/60*(Number(b.labourRate)||0);}
export function cashOut(b={}){return ['purchasePrice','buyerPremium','postage','preparationCost','repairCost','partsCost','consumables','externalService','marketplaceFees','shippingToBuyer','otherCost'].reduce((n,k)=>n+(Number(b[k])||0),0);}
export function investment(b){return cashOut(b);} export function salePrice(b={}){return Number(b.actualSale)||Number(b.targetSale)||0;} export function cashProfit(b={}){const sale=salePrice(b);return sale?sale-cashOut(b):0;} export function profitAfterLabour(b={}){return cashProfit(b)-labourCost(b);} export function roi(b={}){const out=cashOut(b);return out?cashProfit(b)/out:0;}
export function markSpares(item={}){item.purpose='donor';item.status='Archived';item.updatedAt=new Date().toISOString();return item;}

function mergeResources(primary=[],legacy=[]){const out=[],seen=new Set();for(const raw of [...(Array.isArray(primary)?primary:[]),...(Array.isArray(legacy)?legacy:[])]){if(!raw||typeof raw!=='object')continue;const id=String(raw.id||'');if(id&&seen.has(id))continue;if(id)seen.add(id);out.push(structuredClone(raw));}return out;}
export function canonicalInventory(value={}){const source=value&&typeof value==='object'?value:{};return {parts:Array.isArray(source.parts)?source.parts:[],tools:Array.isArray(source.tools)?source.tools:[],consumables:Array.isArray(source.consumables)?source.consumables:[],donors:Array.isArray(source.donors)?source.donors:[]};}
function typedRecord(raw,type,extra={}){return {...structuredClone(raw||{}),recordType:type,...extra};}
function typedAlias(state,canonicalKey,type,extra={}){
  const canonical=()=>Array.isArray(state[canonicalKey])?state[canonicalKey]:[];
  const rows=()=>canonical().filter(x=>x?.recordType===type);
  const wrap=value=>typedRecord(value,type,extra);
  const target=rows();
  return new Proxy(target,{
    get(arr,prop){
      if(prop==='unshift')return(...values)=>{canonical().unshift(...values.map(wrap));return rows().length;};
      if(prop==='push')return(...values)=>{canonical().push(...values.map(wrap));return rows().length;};
      if(prop==='splice')return(start,deleteCount,...values)=>{const current=rows(),removed=current.splice(start,deleteCount,...values.map(wrap));state[canonicalKey]=canonical().filter(x=>x?.recordType!==type).concat(current);return removed;};
      return Reflect.get(arr,prop);
    },
    set(arr,prop,value){
      if(/^\d+$/.test(String(prop))){const index=Number(prop),current=rows(),previous=current[index],wrapped=wrap(value),all=canonical(),at=previous?all.findIndex(x=>x===previous||String(x?.id||'')===String(previous?.id||'')):-1;if(at>=0)all[at]=wrapped;else all.push(wrapped);arr[index]=wrapped;return true;}
      return Reflect.set(arr,prop,value);
    }
  });
}
function attachCompatibilityAliases(state){
  Object.defineProperty(state,'tools',{get(){return state.inventory.tools;},set(value){state.inventory.tools=Array.isArray(value)?value:[];},enumerable:false,configurable:true});
  Object.defineProperty(state,'partsStock',{get(){return state.inventory.parts;},set(value){state.inventory.parts=Array.isArray(value)?value:[];},enumerable:false,configurable:true});
  Object.defineProperty(state,'partFitEvidence',{get(){return typedAlias(state,'compatibilityEvidence','bench-fit',{evidenceClass:'bench'});},set(value){state.compatibilityEvidence=(state.compatibilityEvidence||[]).filter(x=>x?.recordType!=='bench-fit').concat((Array.isArray(value)?value:[]).map(x=>typedRecord(x,'bench-fit',{evidenceClass:'bench'})));},enumerable:false,configurable:true});
  Object.defineProperty(state,'referenceFacts',{get(){return typedAlias(state,'knowledge','reference-fact',{evidenceClass:'external'});},set(value){state.knowledge=(state.knowledge||[]).filter(x=>x?.recordType!=='reference-fact').concat((Array.isArray(value)?value:[]).map(x=>typedRecord(x,'reference-fact',{evidenceClass:'external'})));},enumerable:false,configurable:true});
  Object.defineProperty(state,'referenceDocuments',{get(){return typedAlias(state,'knowledge','reference-document',{evidenceClass:'source-document'});},set(value){state.knowledge=(state.knowledge||[]).filter(x=>x?.recordType!=='reference-document').concat((Array.isArray(value)?value:[]).map(x=>typedRecord(x,'reference-document',{evidenceClass:'source-document'})));},enumerable:false,configurable:true});
  return state;
}

export function migratePersistedState(raw={}){
  const state=structuredClone(raw&&typeof raw==='object'?raw:{});let version=Number(state.schemaVersion)||1;
  if(version>STORE_SCHEMA_VERSION)throw new Error(`Schema ${version} is newer than this Calibre build supports`);
  if(version<2||(!Array.isArray(state.work)&&Array.isArray(state.workRecords))){if(!Array.isArray(state.work))state.work=Array.isArray(state.workRecords)?state.workRecords:[];delete state.workRecords;version=2;state.schemaVersion=2;}
  if(version<3||Array.isArray(state.tools)||Array.isArray(state.partsStock)){const inventory=canonicalInventory(state.inventory);inventory.parts=mergeResources(inventory.parts,state.partsStock);inventory.tools=mergeResources(inventory.tools,state.tools);state.inventory=inventory;delete state.partsStock;delete state.tools;version=3;state.schemaVersion=3;}
  if(version<4||Array.isArray(state.partFitEvidence)||Array.isArray(state.referenceFacts)||Array.isArray(state.referenceDocuments)){state.compatibilityEvidence=Array.isArray(state.compatibilityEvidence)?state.compatibilityEvidence:[];state.knowledge=Array.isArray(state.knowledge)?state.knowledge:[];const bench=(Array.isArray(state.partFitEvidence)?state.partFitEvidence:[]).map(x=>typedRecord(x,'bench-fit',{evidenceClass:'bench'}));const facts=(Array.isArray(state.referenceFacts)?state.referenceFacts:[]).map(x=>typedRecord(x,'reference-fact',{evidenceClass:'external'}));const docs=(Array.isArray(state.referenceDocuments)?state.referenceDocuments:[]).map(x=>typedRecord(x,'reference-document',{evidenceClass:'source-document'}));state.compatibilityEvidence=mergeResources(state.compatibilityEvidence,bench);state.knowledge=mergeResources(state.knowledge,[...facts,...docs]);delete state.partFitEvidence;delete state.referenceFacts;delete state.referenceDocuments;version=4;state.schemaVersion=4;}
  return state;
}
export function canonicalState(raw={}){const migrated=migratePersistedState(raw);const {workRecords:_retiredWorkRecords,partsStock:_retiredPartsStock,tools:_retiredTools,partFitEvidence:_retiredFit,referenceFacts:_retiredFacts,referenceDocuments:_retiredDocs,...state}=migrated;const canonical={...state,schemaVersion:STORE_SCHEMA_VERSION,items:Array.isArray(state.items)?state.items:[],work:Array.isArray(state.work)?state.work:[],inventory:canonicalInventory(state.inventory),compatibilityEvidence:Array.isArray(state.compatibilityEvidence)?state.compatibilityEvidence:[],knowledge:Array.isArray(state.knowledge)?state.knowledge:[],ledger:Array.isArray(state.ledger)?state.ledger:[],incoming:Array.isArray(state.incoming)?state.incoming:[],purchaseReview:Array.isArray(state.purchaseReview)?state.purchaseReview:[],currentItemId:String(state.currentItemId||''),currentWorkId:String(state.currentWorkId||'')};return attachCompatibilityAliases(canonical);}
export async function loadState(){const stored=await get('state');const state=canonicalState(stored||{});if(!stored||Number(stored.schemaVersion)!==STORE_SCHEMA_VERSION||Array.isArray(stored.workRecords)||Array.isArray(stored.tools)||Array.isArray(stored.partsStock)||Array.isArray(stored.partFitEvidence)||Array.isArray(stored.referenceFacts)||Array.isArray(stored.referenceDocuments))await put('state',state);return state;}
export async function saveState(raw){const state=canonicalState(raw);state._syncUpdatedAt=new Date().toISOString();await put('state',state);return state;}
export function current(state){const s=canonicalState(state);return s.work.find(w=>String(w.id)===s.currentWorkId)||s.work.find(w=>!['Complete','Cancelled'].includes(w.status))||s.work[0]||null;}
