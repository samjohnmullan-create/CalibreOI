const text=value=>value==null?'':String(value).trim();
export const WORKSHOP_ASSET_TYPES=['tray','tool','part'];
const makeId=type=>`${type}-${Math.random().toString(36).slice(2,8)}${Date.now().toString(36).slice(-4)}`;
export function normaliseWorkshopAsset(raw={}){
  const type=WORKSHOP_ASSET_TYPES.includes(raw.type)?raw.type:'tray';
  const createdAt=text(raw.createdAt)||new Date().toISOString();
  return {id:text(raw.id)||makeId(type),type,name:text(raw.name)||({tray:'Storage tray',tool:'Workshop tool',part:'Loose part'}[type]),location:text(raw.location),notes:text(raw.notes),calibre:text(raw.calibre),partName:text(raw.partName),quantity:Math.max(0,Number(raw.quantity)||0),status:text(raw.status)||'Active',trayId:text(raw.trayId),donorJobId:text(raw.donorJobId),donorItemId:text(raw.donorItemId),donorPartId:text(raw.donorPartId),createdAt,updatedAt:text(raw.updatedAt)||createdAt};
}
export function workshopAssets(state={}){return (Array.isArray(state.workshopAssets)?state.workshopAssets:[]).map(normaliseWorkshopAsset);}
export function assetById(state={},id=''){return workshopAssets(state).find(asset=>asset.id===text(id))||null;}
export function upsertWorkshopAsset(state={},raw={}){state.workshopAssets=Array.isArray(state.workshopAssets)?state.workshopAssets:[];const asset=normaliseWorkshopAsset({...raw,updatedAt:new Date().toISOString()});const index=state.workshopAssets.findIndex(row=>String(row?.id)===asset.id);if(index>=0)state.workshopAssets[index]=asset;else state.workshopAssets.unshift(asset);return asset;}
