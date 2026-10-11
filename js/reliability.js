import {STORE_SCHEMA_VERSION,canonicalState} from './store-base.js?v=6';

export const BACKUP_TYPE='calibre-backup';
export const BACKUP_VERSION=2;
export const AUDIT_LIMIT=150;
const text=value=>value==null?'':String(value);
const list=value=>Array.isArray(value)?value:[];

function stable(value){
  if(Array.isArray(value))return value.map(stable);
  if(!value||typeof value!=='object')return value;
  return Object.fromEntries(Object.keys(value).sort().map(key=>[key,stable(value[key])]));
}
function checksum(value){
  const source=JSON.stringify(stable(value));let hash=2166136261;
  for(let i=0;i<source.length;i++){hash^=source.charCodeAt(i);hash=Math.imul(hash,16777619);}
  return `fnv1a-${(hash>>>0).toString(16).padStart(8,'0')}`;
}

export function portableCoreState(raw={}){
  const state=canonicalState(structuredClone(raw||{}));
  return {
    schemaVersion:STORE_SCHEMA_VERSION,
    currentItemId:text(state.currentItemId),
    currentWorkId:text(state.currentWorkId),
    items:list(state.items),
    work:list(state.work),
    mediaAssets:list(state.mediaAssets),
    inventory:state.inventory&&typeof state.inventory==='object'?state.inventory:{parts:[],tools:[],consumables:[],donors:[],locations:[]},
    compatibilityEvidence:list(state.compatibilityEvidence),
    incoming:list(state.incoming),
    knowledge:list(state.knowledge),
    ledger:list(state.ledger),
    settings:state.settings&&typeof state.settings==='object'?state.settings:{},
    updatedAt:text(state.updatedAt||state._syncUpdatedAt||new Date().toISOString())
  };
}

export function buildBackupPayload(raw={},meta={}){
  const state=portableCoreState(raw),exportedAt=text(meta.exportedAt)||new Date().toISOString();
  return {type:BACKUP_TYPE,version:BACKUP_VERSION,schemaVersion:state.schemaVersion,exportedAt,reason:text(meta.reason)||'manual-export',app:'Calibre & Co.',checksum:checksum(state),state};
}

export function validateBackupPayload(payload={}){
  const errors=[],warnings=[];
  if(!payload||typeof payload!=='object')return {ok:false,errors:['Backup is not a JSON object.'],warnings,state:null};
  if(payload.type!==BACKUP_TYPE)errors.push('File is not a Calibre backup.');
  if(!payload.state||typeof payload.state!=='object')errors.push('Backup contains no state object.');
  const sourceVersion=Number(payload.state?.schemaVersion||payload.schemaVersion||0);
  if(sourceVersion>STORE_SCHEMA_VERSION)errors.push(`Backup schema ${sourceVersion} is newer than this Calibre build supports (${STORE_SCHEMA_VERSION}).`);
  if(payload.version&&Number(payload.version)>BACKUP_VERSION)warnings.push(`Backup format ${payload.version} is newer than this build's format ${BACKUP_VERSION}.`);
  if(errors.length)return {ok:false,errors,warnings,state:null};
  try{
    const state=portableCoreState(payload.state);
    if(payload.checksum&&payload.checksum!==checksum(state))errors.push('Backup checksum does not match its state. The file may be incomplete or altered.');
    if(!payload.checksum)warnings.push('Older backup has no checksum; contents cannot be corruption-checked.');
    return {ok:errors.length===0,errors,warnings,state,sourceVersion};
  }catch(error){errors.push(text(error?.message||error));return {ok:false,errors,warnings,state:null,sourceVersion};}
}

export function appendAuditEvent(state={},event={}){
  state.settings=state.settings&&typeof state.settings==='object'?state.settings:{};
  const reliability=state.settings.reliability&&typeof state.settings.reliability==='object'?state.settings.reliability:{};
  const rows=list(reliability.auditTrail);
  const now=new Date().toISOString();
  const record={id:text(event.id)||`audit-${Math.random().toString(36).slice(2,8)}${Date.now().toString(36).slice(-4)}`,at:text(event.at)||now,type:text(event.type)||'note',summary:text(event.summary)||'Reliability event',detail:text(event.detail),itemId:text(event.itemId),workId:text(event.workId),source:text(event.source)||'app'};
  reliability.auditTrail=[record,...rows.filter(row=>row?.id!==record.id)].slice(0,AUDIT_LIMIT);
  state.settings.reliability=reliability;
  return record;
}
export function auditEvents(state={}){return list(state.settings?.reliability?.auditTrail).slice().sort((a,b)=>text(b?.at).localeCompare(text(a?.at)));}

export function stateCounts(raw={}){
  const state=portableCoreState(raw),inventory=state.inventory;
  return {items:state.items.length,work:state.work.length,media:state.mediaAssets.length,parts:list(inventory.parts).length,tools:list(inventory.tools).length,consumables:list(inventory.consumables).length,donors:list(inventory.donors).length,locations:list(inventory.locations).length,incoming:state.incoming.length,knowledge:state.knowledge.length,ledger:state.ledger.length};
}
