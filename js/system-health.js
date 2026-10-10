import { itemIntegrityReport } from "./item-integrity.js?v=1";

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
      if(!asset?.url&&!asset?.thumbnailUrl&&!asset?.storageKey)invalidMedia.push(text(asset?.id)||`${text(item?.id)}:media`);
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

export function browserHealth(){
  return {
    online:typeof navigator==="undefined"?null:navigator.onLine,
    indexedDB:typeof indexedDB!=="undefined",
    serviceWorker:typeof navigator!=="undefined"&&"serviceWorker" in navigator
  };
}
