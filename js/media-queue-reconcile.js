import { listQueuedMediaUploads, removeQueuedMediaUpload, markQueuedMediaFailed } from './media-upload-queue.js?v=1';
import { retryQueuedMediaUpload } from './media.js?v=3';
import { mergeQueuedAssetIntoState } from './media-queue-state.js?v=1';

export async function prepareQueuedMediaForSave(state={}){
  const records=await listQueuedMediaUploads();
  if(!records.length)return [];
  const online=typeof navigator==='undefined'?true:navigator.onLine!==false;
  const completed=[];
  for(const record of records){
    try{
      let asset=record.asset;
      if(!asset){
        if(!online)continue;
        asset=await retryQueuedMediaUpload(record);
        record.asset=asset;
      }
      const merged=mergeQueuedAssetIntoState(state,record);
      if(merged.asset)completed.push(record.id);
    }catch(err){
      await markQueuedMediaFailed(record.id,err);
      console.warn('Queued media retry failed',record.id,err);
    }
  }
  return completed;
}

export async function acknowledgeQueuedMedia(ids=[]){
  for(const id of ids)await removeQueuedMediaUpload(id);
}
