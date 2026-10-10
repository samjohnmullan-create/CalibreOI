import { ensureItemForJob } from './item-integrity.js?v=1';
import { attachMediaToItem, mediaForItem, mediaForWork, normaliseMediaAsset } from './media-model.js?v=1';

const text=value=>value==null?'':String(value);

export function reconcileMediaOwnership(state={}){
  state.jobs=Array.isArray(state.jobs)?state.jobs:[];
  state.items=Array.isArray(state.items)?state.items:[];
  let changed=false;
  let linked=0;

  for(const job of state.jobs){
    const assets=Array.isArray(job?.mediaAssets)?job.mediaAssets:[];
    if(!assets.length)continue;
    const result=ensureItemForJob(state,job);
    const item=result.item;
    if(!item)continue;
    if(result.changed)changed=true;

    for(let i=0;i<assets.length;i++){
      const raw=assets[i]||{};
      const canonical=normaliseMediaAsset({
        ...raw,
        itemId:item.id,
        legacyWatchId:raw.legacyWatchId||job.id,
        legacyJobId:raw.legacyJobId||job.jobId||job.id
      });
      const before=JSON.stringify(raw);
      assets[i]=canonical;
      if(before!==JSON.stringify(canonical))changed=true;
      const countBefore=Array.isArray(item.mediaAssets)?item.mediaAssets.length:0;
      const existing=(item.mediaAssets||[]).find(asset=>
        text(asset?.id)===text(canonical.id)||(canonical.storageKey&&asset?.storageKey===canonical.storageKey)
      );
      const existingBefore=existing?JSON.stringify(existing):'';
      const attached=attachMediaToItem(item,canonical);
      if(!existing||existingBefore!==JSON.stringify(attached)||item.mediaAssets.length!==countBefore)changed=true;
      linked+=1;
    }
  }

  return {changed,linked};
}

export function itemMedia(state={},itemId=''){
  const item=(state.items||[]).find(candidate=>text(candidate?.id)===text(itemId));
  return mediaForItem(item?.mediaAssets||[],itemId);
}

export function workMedia(state={},workId=''){
  const key=text(workId);
  if(!key)return [];
  const out=[];
  const seen=new Set();
  for(const item of (state.items||[])){
    for(const asset of mediaForWork(item?.mediaAssets||[],key)){
      const dedupe=asset.id||asset.storageKey;
      if(dedupe&&seen.has(dedupe))continue;
      if(dedupe)seen.add(dedupe);
      out.push(asset);
    }
  }
  return out;
}
