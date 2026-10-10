import { session, supabaseClient } from './cloud.js?v=4';
import { blankMediaAsset, MEDIA_CATEGORIES } from './media-model.js?v=2';
import { enqueueMediaUpload, markQueuedMediaUploaded, markQueuedMediaFailed } from './media-upload-queue.js?v=1';

export const MEDIA_BUCKET='calibre-research-media';
export { blankMediaAsset, MEDIA_CATEGORIES } from './media-model.js?v=2';

function safePart(value,fallback='item'){
  const out=String(value||fallback).trim().toLowerCase().replace(/[^a-z0-9._-]+/g,'-').replace(/^-+|-+$/g,'');
  return (out||fallback).slice(0,100);
}

async function authSession(){
  const s=await session();
  if(!s?.user?.id||s.localOnly||!s.access_token)throw new Error('Sign in to Calibre to use private media.');
  return s;
}

async function makeThumbnail(file,maxSide=480){
  if(typeof createImageBitmap!=='function'||typeof document==='undefined')return null;
  let bitmap=null;
  try{
    bitmap=await createImageBitmap(file);
    const scale=Math.min(1,maxSide/Math.max(bitmap.width,bitmap.height));
    const width=Math.max(1,Math.round(bitmap.width*scale)),height=Math.max(1,Math.round(bitmap.height*scale));
    const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
    const ctx=canvas.getContext('2d',{alpha:false});if(!ctx)return null;
    ctx.drawImage(bitmap,0,0,width,height);
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',0.72));
    if(!blob)return null;
    return {blob,width:bitmap.width,height:bitmap.height};
  }catch(err){console.warn('Media thumbnail generation failed',err);return null;}
  finally{try{bitmap?.close?.();}catch{}}
}

async function rawUploadMedia(file,{itemId='',workId='',watchId='',jobId='',stageId='',role='',slot='',category='workshop',mediaId=''}={}){
  if(!(file instanceof File))throw new Error('Choose a file to upload.');
  if(!MEDIA_CATEGORIES.includes(category))throw new Error('Invalid media category.');
  if(!file.type?.startsWith('image/'))throw new Error('Calibre watch media accepts image files.');
  const s=await authSession();
  const id=mediaId||crypto.randomUUID();
  const ext=(file.name.split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,8)||'jpg';
  const owner=itemId||watchId||'unassigned';
  const base=[s.user.id,safePart(owner),safePart(category),id].join('/');
  const path=`${base}.${ext}`,thumbnailPath=`${base}-thumb.webp`;
  const sb=supabaseClient(),thumb=await makeThumbnail(file);
  const {error}=await sb.storage.from(MEDIA_BUCKET).upload(path,file,{contentType:file.type||'image/jpeg',cacheControl:'86400',upsert:true});
  if(error)throw error;
  let thumbnailStorageKey='';
  if(thumb?.blob){
    const uploaded=await sb.storage.from(MEDIA_BUCKET).upload(thumbnailPath,thumb.blob,{contentType:'image/webp',cacheControl:'86400',upsert:true});
    if(!uploaded.error)thumbnailStorageKey=thumbnailPath;else console.warn('Thumbnail upload failed; original retained',uploaded.error);
  }
  return blankMediaAsset({
    id,itemId,workId,legacyWatchId:watchId,legacyJobId:jobId,stageId,role:role||slot,category,
    storageKey:path,thumbnailStorageKey,originalName:file.name,mimeType:file.type||'image/jpeg',bytes:file.size,
    width:thumb?.width??null,height:thumb?.height??null,createdAt:new Date().toISOString(),visibility:'private'
  });
}

export async function uploadMedia(file,options={}){
  const queued=await enqueueMediaUpload(file,options);
  try{
    const asset=await rawUploadMedia(file,{...options,mediaId:queued.id});
    await markQueuedMediaUploaded(queued.id,asset);
    return asset;
  }catch(err){await markQueuedMediaFailed(queued.id,err);throw err;}
}

export async function retryQueuedMediaUpload(record){
  if(!record?.file)throw new Error('Queued media file is unavailable.');
  const asset=await rawUploadMedia(record.file,{...(record.options||{}),mediaId:record.id});
  await markQueuedMediaUploaded(record.id,asset);
  return asset;
}

async function downloadKey(storageKey){
  if(!storageKey)throw new Error('This media record has no storage key.');
  await authSession();
  const {data,error}=await supabaseClient().storage.from(MEDIA_BUCKET).download(storageKey);
  if(error)throw error;
  if(!data)throw new Error('Media file is unavailable.');
  return data;
}

export async function fetchPrivateMedia(asset){const a=blankMediaAsset(asset||{});return downloadKey(a.storageKey);}
export async function fetchPrivateThumbnail(asset){const a=blankMediaAsset(asset||{});return downloadKey(a.thumbnailStorageKey||a.storageKey);}

export async function privateMediaObjectUrl(asset){const blob=await fetchPrivateMedia(asset);return URL.createObjectURL(blob);}
export async function privateMediaThumbnailObjectUrl(asset){const blob=await fetchPrivateThumbnail(asset);return URL.createObjectURL(blob);}

export async function deletePrivateMedia(asset){
  const a=blankMediaAsset(asset||{});
  if(!a.storageKey)throw new Error('This media record has no storage key.');
  await authSession();
  const keys=[a.storageKey,a.thumbnailStorageKey].filter(Boolean);
  const {error}=await supabaseClient().storage.from(MEDIA_BUCKET).remove(keys);
  if(error)throw error;
  return {ok:true};
}

export function formatMediaSize(bytes){
  const n=Number(bytes)||0;
  if(n<1024)return `${n} B`;
  if(n<1048576)return `${(n/1024).toFixed(n<10240?1:0)} KB`;
  return `${(n/1048576).toFixed(n<10485760?1:0)} MB`;
}
