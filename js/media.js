import { session, supabaseClient } from './cloud.js?v=4';
import { blankMediaAsset, MEDIA_CATEGORIES } from './media-model.js?v=1';

export const MEDIA_BUCKET='calibre-research-media';
export { blankMediaAsset, MEDIA_CATEGORIES } from './media-model.js?v=1';

function safePart(value,fallback='item'){
  const out=String(value||fallback).trim().toLowerCase().replace(/[^a-z0-9._-]+/g,'-').replace(/^-+|-+$/g,'');
  return (out||fallback).slice(0,100);
}

async function authSession(){
  const s=await session();
  if(!s?.user?.id||s.localOnly||!s.access_token)throw new Error('Sign in to Calibre to use private media.');
  return s;
}

export async function uploadMedia(file,{itemId='',workId='',watchId='',jobId='',stageId='',role='',slot='',category='workshop'}={}){
  if(!(file instanceof File))throw new Error('Choose a file to upload.');
  if(!MEDIA_CATEGORIES.includes(category))throw new Error('Invalid media category.');
  if(!file.type?.startsWith('image/'))throw new Error('Calibre watch media accepts image files.');
  const s=await authSession();
  const id=crypto.randomUUID();
  const ext=(file.name.split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,8)||'jpg';
  const owner=itemId||watchId||'unassigned';
  const path=[s.user.id,safePart(owner),safePart(category),`${Date.now()}-${id}.${ext}`].join('/');
  const sb=supabaseClient();
  const {error}=await sb.storage.from(MEDIA_BUCKET).upload(path,file,{contentType:file.type||'image/jpeg',cacheControl:'3600',upsert:false});
  if(error)throw error;
  return blankMediaAsset({
    id,itemId:itemId||watchId,workId,legacyWatchId:watchId,legacyJobId:jobId,stageId,role:role||slot,category,
    storageKey:path,originalName:file.name,mimeType:file.type||'image/jpeg',bytes:file.size,createdAt:new Date().toISOString(),visibility:'private'
  });
}

async function downloadAsset(asset){
  const a=blankMediaAsset(asset||{});
  if(!a.storageKey)throw new Error('This media record has no storage key.');
  await authSession();
  const {data,error}=await supabaseClient().storage.from(MEDIA_BUCKET).download(a.storageKey);
  if(error)throw error;
  if(!data)throw new Error('Media file is unavailable.');
  return data;
}

export async function fetchPrivateMedia(asset){return downloadAsset(asset);}
export async function fetchPrivateThumbnail(asset){return downloadAsset(asset);}

export async function privateMediaObjectUrl(asset){
  const blob=await fetchPrivateMedia(asset);
  return URL.createObjectURL(blob);
}

export async function privateMediaThumbnailObjectUrl(asset){
  const blob=await fetchPrivateThumbnail(asset);
  return URL.createObjectURL(blob);
}

export async function deletePrivateMedia(asset){
  const a=blankMediaAsset(asset||{});
  if(!a.storageKey)throw new Error('This media record has no storage key.');
  await authSession();
  const {error}=await supabaseClient().storage.from(MEDIA_BUCKET).remove([a.storageKey]);
  if(error)throw error;
  return {ok:true};
}

export function formatMediaSize(bytes){
  const n=Number(bytes)||0;
  if(n<1024)return `${n} B`;
  if(n<1048576)return `${(n/1024).toFixed(n<10240?1:0)} KB`;
  return `${(n/1048576).toFixed(n<10485760?1:0)} MB`;
}
