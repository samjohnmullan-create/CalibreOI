import { attachMediaToItem, normaliseMediaAsset } from './media-model.js?v=2';
import { ensureItemForJob } from './item-integrity.js?v=1';

const text=value=>value==null?'':String(value);

export function mergeQueuedAssetIntoState(state={},record={}){
  const asset=normaliseMediaAsset(record.asset||{});
  if(!asset.id)return {changed:false,asset:null,item:null,job:null};
  state.jobs=Array.isArray(state.jobs)?state.jobs:[];
  state.items=Array.isArray(state.items)?state.items:[];
  const options=record.options&&typeof record.options==='object'?record.options:{};
  const jobInternalId=text(options.watchId||asset.legacyWatchId);
  let job=jobInternalId?state.jobs.find(candidate=>text(candidate?.id)===jobInternalId):null;
  let item=null,changed=false;

  if(job){
    const ensured=ensureItemForJob(state,job);
    item=ensured.item;changed=changed||ensured.changed;
    job.mediaAssets=Array.isArray(job.mediaAssets)?job.mediaAssets:[];
    const linked=normaliseMediaAsset({...asset,itemId:asset.itemId||item?.id||'',legacyWatchId:asset.legacyWatchId||job.id,legacyJobId:asset.legacyJobId||job.jobId||''});
    const ji=job.mediaAssets.findIndex(existing=>text(existing?.id)===linked.id||(linked.storageKey&&text(existing?.storageKey)===linked.storageKey));
    if(ji>=0){if(JSON.stringify(job.mediaAssets[ji])!==JSON.stringify(linked)){job.mediaAssets[ji]=linked;changed=true;}}else{job.mediaAssets.push(linked);changed=true;}
    if(item){const before=JSON.stringify(item.mediaAssets||[]);attachMediaToItem(item,linked);if(before!==JSON.stringify(item.mediaAssets||[]))changed=true;}
    return {changed,asset:linked,item,job};
  }

  if(asset.itemId){
    item=state.items.find(candidate=>text(candidate?.id)===text(asset.itemId))||null;
    if(item){const before=JSON.stringify(item.mediaAssets||[]);attachMediaToItem(item,asset);if(before!==JSON.stringify(item.mediaAssets||[]))changed=true;}
  }
  return {changed,asset,item,job:null};
}
