import { itemIntegrityReport } from "./item-integrity.js?v=1";
import { listQueuedMediaUploads } from "./media-upload-queue.js?v=1";

const text=value=>value==null?"":String(value);

export function stateHealth(state={}){
  const itemIntegrity=itemIntegrityReport(state);
  const items=Array.isArray(state.items)?state.items:[];
  const works=Array.isArray(state.workRecords)?state.workRecords:[];
  const itemIds=new Set(items.map(item=>text(item?.id)).filter(Boolean));
  const orphanWork=works.filter(work=>!work?.itemId||!itemIds.has(text(work.itemId))).map(work=>text(work?.id)).filter(Boolean);
  const invalidMedia=[];
  for(const item of items){
    for(const asset of (Array.isArray(item?.mediaAssets)?item.mediaAssets:[])){
      if(!asset?.url&&!asset?.thumbnailUrl&&!asset?.storageKey&&!asset?.thumbnailStorageKey)invalidMedia.push(text(asset?.id)||`${text(item?.id)}:media`);
    }
  }
  const healthy=itemIntegrity.healthy&&orphanWork.length===0&&invalidMedia.length===0;
  return {
    healthy,
    itemIntegrity,
    orphanWork,
    invalidMedia,
    counts:{jobs:(state.jobs||[]).length,items:items.length,work:works.length,media:items.reduce((n,item)=>n+(item.mediaAssets?.length||0),0)},
    itemModelVersion:Number(state.itemModelVersion)||0
  };
}

export async function mediaQueueHealth(){
  try{
    const records=await listQueuedMediaUploads();
    const queued=records.filter(record=>record?.status!=="uploaded");
    const uploaded=records.filter(record=>record?.status==="uploaded");
    const failed=records.filter(record=>Number(record?.attempts)>0||record?.lastError);
    return {
      available:true,
      total:records.length,
      queued:queued.length,
      uploadedAwaitingSave:uploaded.length,
      failed:failed.length,
      oldest:records[0]?.createdAt||"",
      errors:failed.map(record=>({id:text(record?.id),attempts:Number(record?.attempts)||0,error:text(record?.lastError)}))
    };
  }catch(error){
    return {available:false,total:0,queued:0,uploadedAwaitingSave:0,failed:0,oldest:"",errors:[],error:text(error?.message||error)};
  }
}

export function browserHealth(){
  return {
    online:typeof navigator==="undefined"?null:navigator.onLine,
    indexedDB:typeof indexedDB!=="undefined",
    serviceWorker:typeof navigator!=="undefined"&&"serviceWorker" in navigator
  };
}
