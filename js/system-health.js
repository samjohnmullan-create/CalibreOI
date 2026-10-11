import {STORE_SCHEMA_VERSION} from './store-base.js?v=6';
import {itemIntegrityReport} from './item-integrity.js?v=2';
import {listQueuedMediaUploads} from './media-upload-queue.js?v=1';
const text=value=>value==null?'':String(value);
const list=value=>Array.isArray(value)?value:[];

export function stateHealth(state={}){
  const itemIntegrity=itemIntegrityReport(state),items=list(state.items),work=list(state.work),media=list(state.mediaAssets);
  const itemIds=new Set(items.map(item=>text(item?.id)).filter(Boolean)),workIds=new Set(work.map(row=>text(row?.id)).filter(Boolean));
  const duplicateMediaIds=[...media.reduce((map,asset)=>{const id=text(asset?.id);if(id)map.set(id,(map.get(id)||0)+1);return map;},new Map()).entries()].filter(([,count])=>count>1).map(([id])=>id);
  const orphanMedia=media.filter(asset=>!asset?.itemId||!itemIds.has(text(asset.itemId))||(asset.workId&&!workIds.has(text(asset.workId)))).map(asset=>text(asset?.id)||'(media without id)');
  const invalidMedia=media.filter(asset=>!asset?.storageKey&&!asset?.url&&!asset?.thumbnailUrl&&!asset?.thumbnailStorageKey).map(asset=>text(asset?.id)||'(media without id)');
  const currentItemMissing=!!state.currentItemId&&!itemIds.has(text(state.currentItemId)),currentWorkMissing=!!state.currentWorkId&&!workIds.has(text(state.currentWorkId));
  const schemaVersion=Number(state.schemaVersion)||0,schemaCurrent=schemaVersion===STORE_SCHEMA_VERSION;
  const healthy=itemIntegrity.healthy&&duplicateMediaIds.length===0&&orphanMedia.length===0&&invalidMedia.length===0&&!currentItemMissing&&!currentWorkMissing&&schemaCurrent;
  return {healthy,schemaVersion,expectedSchemaVersion:STORE_SCHEMA_VERSION,schemaCurrent,itemIntegrity,orphanWork:itemIntegrity.orphanWork,duplicateItemIds:itemIntegrity.duplicateItemIds,duplicateWorkIds:itemIntegrity.duplicateWorkIds,duplicateMediaIds,orphanMedia,invalidMedia,currentItemMissing,currentWorkMissing,counts:{items:items.length,work:work.length,media:media.length,parts:list(state.inventory?.parts).length,tools:list(state.inventory?.tools).length,locations:list(state.inventory?.locations).length,knowledge:list(state.knowledge).length,incoming:list(state.incoming).length,ledger:list(state.ledger).length}};
}

export async function mediaQueueHealth(){try{const records=await listQueuedMediaUploads(),queued=records.filter(record=>record?.status!=='uploaded'),uploaded=records.filter(record=>record?.status==='uploaded'),failed=records.filter(record=>Number(record?.attempts)>0||record?.lastError);return {available:true,total:records.length,queued:queued.length,uploadedAwaitingSave:uploaded.length,failed:failed.length,oldest:records[0]?.createdAt||'',errors:failed.map(record=>({id:text(record?.id),attempts:Number(record?.attempts)||0,error:text(record?.lastError)}))};}catch(error){return {available:false,total:0,queued:0,uploadedAwaitingSave:0,failed:0,oldest:'',errors:[],error:text(error?.message||error)};}}
export function browserHealth(){return {online:typeof navigator==='undefined'?null:navigator.onLine,indexedDB:typeof indexedDB!=='undefined',serviceWorker:typeof navigator!=='undefined'&&'serviceWorker' in navigator};}
