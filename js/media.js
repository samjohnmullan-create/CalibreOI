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
    visibility:partial.visibility==='public'?'public':'private'
  };
}

export async function uploadMedia(file,{watchId='',jobId='',stageId='',category='workshop'}={}){
  if(!(file instanceof File))throw new Error('Choose a file to upload.');
  if(!MEDIA_CATEGORIES.includes(category))throw new Error('Invalid media category.');
  const s=await session();
  if(!s?.access_token)throw new Error('Sign in to Calibre before uploading media.');
  const form=new FormData();
  form.append('file',file,file.name);
  form.append('watchId',watchId||'unassigned');
  form.append('jobId',jobId||'');
  form.append('stageId',stageId||'');
  form.append('category',category);
  const response=await fetch(`${MEDIA_API_BASE}/upload.php`,{
    method:'POST',
    headers:{Authorization:`Bearer ${s.access_token}`},
    body:form
  });
  let body=null;
  try{body=await response.json();}catch{}
  if(!response.ok||!body?.ok)throw new Error(body?.error||`Media upload failed (${response.status}).`);
  return blankMediaAsset(body.asset||{});
}
