const text=value=>value==null?'':String(value).trim();
export function donorPartStorageKey({donorJobId='',donorItemId='',partId='' }={}){const owner=text(donorItemId)?`item:${text(donorItemId)}`:`job:${text(donorJobId)}`;return `${owner}:part:${text(partId)}`;}
export function linkedDonorPartAssets(state={}, {donorJobId='',donorItemId='',partId=''}={}){
  const assets=Array.isArray(state.workshopAssets)?state.workshopAssets:[];
  return assets.filter(a=>a?.type==='part'&&(!partId||String(a.donorPartId||'')===String(partId))&&(!donorItemId||String(a.donorItemId||'')===String(donorItemId))&&(!donorJobId||String(a.donorJobId||'')===String(donorJobId)));
}
export function donorPartStorage(state={},link={}){return linkedDonorPartAssets(state,link)[0]||null;}
export function storageLocationForAsset(state={},asset={}){if(!asset)return'';const trays=Array.isArray(state.workshopAssets)?state.workshopAssets:[];const tray=asset.trayId?trays.find(a=>a?.type==='tray'&&String(a.id)===String(asset.trayId)):null;return [tray?.name,asset.location||tray?.location].filter(Boolean).join(' · ');}
export function storeDonorPart(state={}, {donorJobId='',donorItemId='',partId='',partName='',calibre='',trayId='',location='',quantity=1,notes=''}={}){
  state.workshopAssets=Array.isArray(state.workshopAssets)?state.workshopAssets:[];
  if(!partId)throw new Error('A donor part ID is required.');
  const existing=donorPartStorage(state,{donorJobId,donorItemId,partId});
  const now=new Date().toISOString();
  const asset={...(existing||{}),id:existing?.id||`part-${Math.random().toString(36).slice(2,8)}${Date.now().toString(36).slice(-4)}`,type:'part',name:text(partName)||'Donor part',partName:text(partName),calibre:text(calibre),quantity:Math.max(0,Number(quantity)||0),location:text(location),trayId:text(trayId),donorJobId:text(donorJobId),donorItemId:text(donorItemId),donorPartId:text(partId),notes:text(notes),status:'Active',createdAt:existing?.createdAt||now,updatedAt:now};
  const index=state.workshopAssets.findIndex(a=>String(a?.id)===asset.id);if(index>=0)state.workshopAssets[index]=asset;else state.workshopAssets.unshift(asset);return asset;
}
export function consumeStoredDonorPart(state={},link={}){const asset=donorPartStorage(state,link);if(!asset)return null;asset.quantity=Math.max(0,(Number(asset.quantity)||1)-1);asset.updatedAt=new Date().toISOString();if(asset.quantity===0)asset.status='Consumed';return asset;}
