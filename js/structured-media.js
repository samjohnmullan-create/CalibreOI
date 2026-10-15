import {supabaseClient} from './cloud.js?v=5';
import {structuredWorkspaceId} from './structured-cloud.js?v=4';

export async function recordStructuredMediaAsset(asset,{itemId='',workId='',checklistStepId='',note=''}={}){
  if(!asset?.id||!asset?.storageKey)throw new Error('Uploaded media asset is incomplete.');
  const workspaceId=await structuredWorkspaceId();
  if(!workspaceId)throw new Error('Structured workspace unavailable');
  if(!itemId)throw new Error('Structured media needs an Item.');
  const row={
    id:asset.id,
    workspace_id:workspaceId,
    item_id:itemId,
    work_id:workId||null,
    checklist_step_id:checklistStepId||null,
    role:asset.role||'progress',
    category:asset.category||'workshop',
    storage_key:asset.storageKey,
    thumbnail_storage_key:asset.thumbnailStorageKey||null,
    original_name:asset.originalName||'',
    mime_type:asset.mimeType||'',
    byte_size:Number(asset.bytes)||null,
    width:Number(asset.width)||null,
    height:Number(asset.height)||null,
    note:String(note||''),
    updated_at:new Date().toISOString()
  };
  const {data,error}=await supabaseClient().from('structured_media_assets').upsert(row,{onConflict:'id'}).select().single();
  if(error)throw error;
  return data;
}

export async function listStructuredMedia({itemId='',workId='',limit=24}={}){
  const workspaceId=await structuredWorkspaceId();
  if(!workspaceId)return [];
  let query=supabaseClient().from('structured_media_assets').select('*').eq('workspace_id',workspaceId).order('created_at',{ascending:false}).limit(limit);
  if(workId)query=query.eq('work_id',workId);else if(itemId)query=query.eq('item_id',itemId);
  const {data,error}=await query;
  if(error)throw error;
  return data||[];
}

export function structuredMediaToLegacyAsset(row={}){
  return {
    id:row.id,
    itemId:row.item_id||'',
    workId:row.work_id||'',
    stageId:row.checklist_step_id||'',
    role:row.role||'',
    category:row.category||'workshop',
    storageKey:row.storage_key||'',
    thumbnailStorageKey:row.thumbnail_storage_key||'',
    originalName:row.original_name||'',
    mimeType:row.mime_type||'',
    bytes:Number(row.byte_size)||0,
    width:row.width??null,
    height:row.height??null,
    createdAt:row.created_at||'',
    visibility:'private'
  };
}
