// Calibre Core is a stable domain contract. The Core itself is not versioned by product generation.
// Only persisted schema data is versioned, and future changes must use explicit migrations.

export const CURRENT_SCHEMA_VERSION = 1;

export const ITEM_TYPES = ['watch','clock','jewellery','accessory','collectible','other'];
export const ITEM_PURPOSES = ['resale','personal','customer','donor','reference'];
export const ITEM_STATUSES = ['Incoming','Acquired','Researching','Preparing','On bench','Awaiting parts','Ready to list','Listed','Sold','Retained','Archived'];
export const WORK_TYPES = ['service','repair','inspection','cleaning','restoration','photography','listing'];
export const WORK_STATUSES = ['Planned','In progress','Waiting','Complete','Cancelled'];

const TOP_LEVEL_KEYS = new Set(['schemaVersion','currentItemId','currentWorkId','items','work','mediaAssets','inventory','compatibilityEvidence','incoming','knowledge','settings','updatedAt']);
const FORBIDDEN_LEGACY_KEYS = new Set(['jobs','jobId','legacyJobId','specialistJobId','sourceJobId','currentId']);
const now=()=>new Date().toISOString();
const uid=prefix=>`${prefix}-${Math.random().toString(36).slice(2,9)}${Date.now().toString(36).slice(-4)}`;
const list=v=>Array.isArray(v)?v:[];
const text=v=>v==null?'':String(v);

export function blankCommercial(partial={}){return {purchasePrice:'',buyerPremium:'',postage:'',preparationCost:'',repairCost:'',partsCost:'',consumables:'',externalService:'',marketplaceFees:'',shippingToBuyer:'',otherCost:'',labourMinutes:'',labourRate:'',targetSale:'',minSale:'',actualSale:'',source:'',saleChannel:'Not listed',acquiredAt:'',listedAt:'',soldAt:'',...partial};}
export function blankIdentity(partial={}){return {maker:'',model:'',title:'',country:'',era:'',year:'',materials:'',marks:'',reference:'',serial:'',dimensions:'',weight:'',notes:'',...partial};}
export function blankWatchExtension(partial={}){return {passport:{...(partial.passport||{})},movement:{...(partial.movement||{})},timingHistory:list(partial.timingHistory),publicPassport:{published:false,publicId:'',publishedAt:'',...(partial.publicPassport||{})}};}

export function createItem(partial={}){
  const createdAt=partial.createdAt||now(),type=ITEM_TYPES.includes(partial.type)?partial.type:'other',purpose=ITEM_PURPOSES.includes(partial.purpose)?partial.purpose:'resale';
  const item={id:partial.id||uid('item'),type,purpose,title:partial.title||'Untitled item',status:ITEM_STATUSES.includes(partial.status)?partial.status:'Acquired',identity:blankIdentity(partial.identity),condition:partial.condition||'',research:list(partial.research),mediaAssetIds:list(partial.mediaAssetIds),commercial:blankCommercial(partial.commercial),sale:partial.sale&&typeof partial.sale==='object'?partial.sale:{},workIds:list(partial.workIds),tags:list(partial.tags),notes:partial.notes||'',createdAt,updatedAt:partial.updatedAt||createdAt};
  if(type==='watch'||type==='clock')item.watch=blankWatchExtension(partial.watch);
  return item;
}

export function createWork(partial={}){
  const createdAt=partial.createdAt||now();
  return {id:partial.id||uid('work'),itemId:text(partial.itemId),number:text(partial.number),type:WORK_TYPES.includes(partial.type)?partial.type:'inspection',title:partial.title||'Work',status:WORK_STATUSES.includes(partial.status)?partial.status:'Planned',diagnosis:partial.diagnosis||'',faults:list(partial.faults),diagnosticFaults:list(partial.diagnosticFaults),stages:list(partial.stages),measurements:list(partial.measurements),partIds:list(partial.partIds),labour:partial.labour&&typeof partial.labour==='object'?{minutes:'',rate:'',...partial.labour}:{minutes:'',rate:''},timingRuns:list(partial.timingRuns),repairPerformed:partial.repairPerformed||'',decision:partial.decision||'',finalQC:partial.finalQC&&typeof partial.finalQC==='object'?partial.finalQC:{},nextAction:partial.nextAction||'',blocker:partial.blocker||'',openedAt:partial.openedAt||createdAt.slice(0,10),completedAt:partial.completedAt||'',createdAt,updatedAt:partial.updatedAt||createdAt};
}

export function createMediaAsset(partial={}){
  const createdAt=partial.createdAt||now();
  return {id:partial.id||uid('media'),itemId:text(partial.itemId),workId:text(partial.workId),category:partial.category||'workshop',source:partial.source||'',storageKey:partial.storageKey||'',url:partial.url||'',thumbnailUrl:partial.thumbnailUrl||'',originalName:partial.originalName||'',mimeType:partial.mimeType||'',bytes:Number(partial.bytes)||0,width:partial.width??null,height:partial.height??null,caption:partial.caption||'',evidenceNote:partial.evidenceNote||'',visibility:partial.visibility==='public'?'public':'private',isCover:!!partial.isCover,createdAt,updatedAt:partial.updatedAt||createdAt};
}

export function createCoreState(partial={}){
  return {schemaVersion:CURRENT_SCHEMA_VERSION,currentItemId:partial.currentItemId||null,currentWorkId:partial.currentWorkId||null,items:list(partial.items),work:list(partial.work),mediaAssets:list(partial.mediaAssets),inventory:partial.inventory&&typeof partial.inventory==='object'?partial.inventory:{parts:[],tools:[],consumables:[],donors:[]},compatibilityEvidence:list(partial.compatibilityEvidence),incoming:list(partial.incoming),knowledge:list(partial.knowledge),settings:partial.settings&&typeof partial.settings==='object'?partial.settings:{},updatedAt:partial.updatedAt||now()};
}

// Migrations are intentionally explicit. A new persisted shape increments schemaVersion
// and adds one migration step here. We do not create a second Core alongside the first.
const MIGRATIONS = new Map();
export function registerSchemaMigration(fromVersion,migrate){
  if(!Number.isInteger(fromVersion)||fromVersion<1||typeof migrate!=='function')throw new Error('Invalid schema migration');
  if(MIGRATIONS.has(fromVersion))throw new Error(`Migration from schema ${fromVersion} already registered`);
  MIGRATIONS.set(fromVersion,migrate);
}
export function migrateCoreState(raw={}){
  let state=structuredClone(raw||{}),version=Number(state.schemaVersion)||1;
  if(version>CURRENT_SCHEMA_VERSION)throw new Error(`Schema ${version} is newer than this Calibre build supports`);
  while(version<CURRENT_SCHEMA_VERSION){
    const migrate=MIGRATIONS.get(version);
    if(!migrate)throw new Error(`Missing migration from schema ${version}`);
    state=migrate(state);
    version++;
    state.schemaVersion=version;
  }
  return state;
}

function walkLegacyKeys(value,path='state',errors=[]){
  if(!value||typeof value!=='object')return errors;
  if(Array.isArray(value)){value.forEach((entry,index)=>walkLegacyKeys(entry,`${path}[${index}]`,errors));return errors;}
  for(const [key,child] of Object.entries(value)){
    if(FORBIDDEN_LEGACY_KEYS.has(key))errors.push(`Forbidden legacy field ${path}.${key}`);
    walkLegacyKeys(child,`${path}.${key}`,errors);
  }
  return errors;
}

export function validateCoreState(state={}){
  const errors=[];
  if(state.schemaVersion!==CURRENT_SCHEMA_VERSION)errors.push(`Unsupported schema version ${state.schemaVersion??'(missing)'}`);
  for(const key of Object.keys(state))if(!TOP_LEVEL_KEYS.has(key))errors.push(`Unknown top-level Core field ${key}`);
  walkLegacyKeys(state,'state',errors);

  const itemIds=new Set();
  for(const item of list(state.items)){
    if(!item?.id||itemIds.has(item.id))errors.push(`Invalid or duplicate Item id: ${item?.id||'(missing)'}`);
    else itemIds.add(item.id);
  }
  const workIds=new Set();
  for(const work of list(state.work)){
    if(!work?.id||workIds.has(work.id))errors.push(`Invalid or duplicate Work id: ${work?.id||'(missing)'}`);
    else workIds.add(work.id);
    if(!itemIds.has(work?.itemId))errors.push(`Work ${work?.id||'(missing)'} references missing Item ${work?.itemId||'(missing)'}`);
  }
  const mediaIds=new Set();
  for(const media of list(state.mediaAssets)){
    if(!media?.id||mediaIds.has(media.id))errors.push(`Invalid or duplicate MediaAsset id: ${media?.id||'(missing)'}`);
    else mediaIds.add(media.id);
    if(!itemIds.has(media?.itemId))errors.push(`MediaAsset ${media?.id||'(missing)'} references missing Item ${media?.itemId||'(missing)'}`);
    if(media?.workId&&!workIds.has(media.workId))errors.push(`MediaAsset ${media.id} references missing Work ${media.workId}`);
  }
  for(const item of list(state.items)){
    for(const workId of list(item.workIds))if(!workIds.has(workId))errors.push(`Item ${item.id} references missing Work ${workId}`);
    for(const mediaId of list(item.mediaAssetIds))if(!mediaIds.has(mediaId))errors.push(`Item ${item.id} references missing MediaAsset ${mediaId}`);
  }
  if(state.currentItemId&&!itemIds.has(state.currentItemId))errors.push(`currentItemId references missing Item ${state.currentItemId}`);
  if(state.currentWorkId&&!workIds.has(state.currentWorkId))errors.push(`currentWorkId references missing Work ${state.currentWorkId}`);
  return {healthy:errors.length===0,errors};
}
