export const MEDIA_CATEGORIES=['original','identity','movement','workshop','documents','sale'];
export const MEDIA_VISIBILITY=['private','public'];

const text=value=>value==null?'':String(value);
const now=()=>new Date().toISOString();
const id=()=>`media-${Math.random().toString(36).slice(2,9)}${Date.now().toString(36).slice(-4)}`;

export function blankMediaAsset(partial={}){
  const itemId=text(partial.itemId);
  const workId=text(partial.workId);
  const legacyWatchId=text(partial.legacyWatchId||partial.watchId);
  const legacyJobId=text(partial.legacyJobId||partial.jobId);
  return {
    id:text(partial.id)||id(),
    itemId,
    workId,
    legacyWatchId,
    legacyJobId,
    stageId:text(partial.stageId),
    category:MEDIA_CATEGORIES.includes(partial.category)?partial.category:'workshop',
    role:text(partial.role||partial.slot),
    storageKey:text(partial.storageKey),
    thumbnailStorageKey:text(partial.thumbnailStorageKey),
    url:text(partial.url),
    thumbnailUrl:text(partial.thumbnailUrl),
    originalName:text(partial.originalName),
    mimeType:text(partial.mimeType),
    bytes:Number(partial.bytes)||0,
    width:partial.width==null?null:Number(partial.width)||null,
    height:partial.height==null?null:Number(partial.height)||null,
    checksum:text(partial.checksum),
    caption:text(partial.caption),
    evidenceNote:text(partial.evidenceNote),
    visibility:MEDIA_VISIBILITY.includes(partial.visibility)?partial.visibility:'private',
    isCover:!!partial.isCover,
    createdAt:partial.createdAt||now(),
    updatedAt:partial.updatedAt||''
  };
}

export function normaliseMediaAsset(raw={}){
  const asset=blankMediaAsset(raw);
  // Normalising old records must not manufacture a new timestamp on every save.
  // New uploads use blankMediaAsset directly and therefore still receive createdAt.
  if(!raw.createdAt)asset.createdAt='';
  return asset;
}
export function mediaAssetHasFile(asset={}){return !!(asset.storageKey||asset.thumbnailStorageKey||asset.url||asset.thumbnailUrl);}
export function mediaAssetOwnerId(asset={}){return text(asset.itemId);}
export function mediaForItem(assets=[],itemId=''){const key=text(itemId);return (Array.isArray(assets)?assets:[]).map(normaliseMediaAsset).filter(asset=>text(asset.itemId)===key);}
export function mediaForLegacyWatch(assets=[],watchId=''){const key=text(watchId);return (Array.isArray(assets)?assets:[]).map(normaliseMediaAsset).filter(asset=>text(asset.legacyWatchId)===key);}
export function mediaForWork(assets=[],workId=''){const key=text(workId);return (Array.isArray(assets)?assets:[]).map(normaliseMediaAsset).filter(asset=>text(asset.workId)===key);}
export function coverMedia(assets=[]){const list=(Array.isArray(assets)?assets:[]).map(normaliseMediaAsset).filter(mediaAssetHasFile);return list.find(asset=>asset.isCover)||list.find(asset=>asset.category==='sale')||list[0]||null;}

export function attachMediaToItem(item={},asset={}){
  item.mediaAssets=Array.isArray(item.mediaAssets)?item.mediaAssets:[];
  const next=normaliseMediaAsset({...asset,itemId:asset.itemId||item.id});
  const index=item.mediaAssets.findIndex(existing=>String(existing?.id||'')===next.id||(next.storageKey&&existing?.storageKey===next.storageKey));
  if(index>=0)item.mediaAssets[index]=next;else item.mediaAssets.push(next);
  return next;
}
