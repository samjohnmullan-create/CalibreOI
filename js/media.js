import { session } from './cloud.js?v=3';

export const MEDIA_API_BASE='https://media.calibreco.com.au';
export const MEDIA_CATEGORIES=['original','identity','movement','workshop','documents','sale'];

export function blankMediaAsset(partial={}){
  return {
    id:partial.id||'',
    watchId:partial.watchId||'',
    jobId:partial.jobId||'',
    stageId:partial.stageId||'',
    category:MEDIA_CATEGORIES.includes(partial.category)?partial.category:'workshop',
    storageKey:partial.storageKey||'',
    url:partial.url||'',
    thumbnailUrl:partial.thumbnailUrl||'',
    originalName:partial.originalName||'',
    mimeType:partial.mimeType||'',
    bytes:Number(partial.bytes)||0,
    width:partial.width==null?null:Number(partial.width)||null,
    height:partial.height==null?null:Number(partial.height)||null,
    createdAt:partial.createdAt||new Date().toISOString(),
    caption:partial.caption||'',
    evidenceNote:partial.evidenceNote||'',
    checksum:partial.checksum||'',
    visibility:partial.visibility==='public'?'public':'private',
    isCover:!!partial.isCover,
    updatedAt:partial.updatedAt||''
  };
}

async function authHeaders(){
  const s=await session();
  if(!s?.access_token)throw new Error('Sign in to Calibre to access private media.');
  return {Authorization:`Bearer ${s.access_token}`};
}

export async function uploadMedia(file,{watchId='',jobId='',stageId='',category='workshop'}={}){
  if(!(file instanceof File))throw new Error('Choose a file to upload.');
  if(!MEDIA_CATEGORIES.includes(category))throw new Error('Invalid media category.');
  const headers=await authHeaders();
  const form=new FormData();
  form.append('file',file,file.name);
  form.append('watchId',watchId||'unassigned');
  form.append('jobId',jobId||'');
  form.append('stageId',stageId||'');
  form.append('category',category);
  const response=await fetch(`${MEDIA_API_BASE}/upload.php`,{method:'POST',headers,body:form});
  let body=null;
  try{body=await response.json();}catch{}
  if(!response.ok||!body?.ok)throw new Error(body?.error||`Media upload failed (${response.status}).`);
  return blankMediaAsset(body.asset||{});
}

async function fetchBlobEndpoint(endpoint,asset,{cache='no-store'}={}){
  const a=blankMediaAsset(asset||{});
  if(!a.storageKey)throw new Error('This media record has no storage key.');
  const headers=await authHeaders();
  const response=await fetch(`${MEDIA_API_BASE}/${endpoint}?key=${encodeURIComponent(a.storageKey)}`,{headers,cache});
  if(!response.ok){
    let body=null;
    try{body=await response.json();}catch{}
    throw new Error(body?.error||`Could not load media (${response.status}).`);
  }
  return response.blob();
}

export async function fetchPrivateMedia(asset){
  return fetchBlobEndpoint('file.php',asset,{cache:'no-store'});
}

export async function fetchPrivateThumbnail(asset){
  return fetchBlobEndpoint('thumb.php',asset,{cache:'force-cache'});
}

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
  const headers=await authHeaders();
  headers['Content-Type']='application/json';
  const response=await fetch(`${MEDIA_API_BASE}/delete.php`,{
    method:'DELETE',headers,body:JSON.stringify({key:a.storageKey})
  });
  let body=null;
  try{body=await response.json();}catch{}
  if(!response.ok||!body?.ok)throw new Error(body?.error||`Could not delete media (${response.status}).`);
  return body;
}

export function formatMediaSize(bytes){
  const n=Number(bytes)||0;
  if(n<1024)return `${n} B`;
  if(n<1048576)return `${(n/1024).toFixed(n<10240?1:0)} KB`;
  return `${(n/1048576).toFixed(n<10485760?1:0)} MB`;
}
