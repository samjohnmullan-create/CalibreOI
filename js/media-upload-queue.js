const DB='calibre-media-upload-queue-v1';
const STORE='uploads';
let dbPromise=null;

const now=()=>new Date().toISOString();
const makeId=()=>globalThis.crypto?.randomUUID?.()||`media-${Math.random().toString(36).slice(2)}-${Date.now()}`;

export function normaliseQueuedMediaUpload(raw={}){
  return {
    id:String(raw.id||makeId()),
    file:raw.file||null,
    options:raw.options&&typeof raw.options==='object'?raw.options:{},
    asset:raw.asset&&typeof raw.asset==='object'?raw.asset:null,
    status:raw.status==='uploaded'?'uploaded':'queued',
    attempts:Number(raw.attempts)||0,
    lastError:String(raw.lastError||''),
    createdAt:raw.createdAt||now(),
    updatedAt:raw.updatedAt||now()
  };
}

function supported(){return typeof indexedDB!=='undefined';}
function openDB(){
  if(!supported())return Promise.resolve(null);
  if(dbPromise)return dbPromise;
  dbPromise=new Promise((resolve,reject)=>{
    const request=indexedDB.open(DB,1);
    request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains(STORE))request.result.createObjectStore(STORE,{keyPath:'id'});};
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error);
  });
  return dbPromise;
}
async function transaction(mode,action){
  const db=await openDB();
  if(!db)return null;
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(STORE,mode),store=tx.objectStore(STORE);
    let request;
    try{request=action(store);}catch(err){reject(err);return;}
    if(request){request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);}
    else{tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);}
  });
}

export async function enqueueMediaUpload(file,options={}){
  const record=normaliseQueuedMediaUpload({id:options.mediaId||makeId(),file,options:{...options},status:'queued'});
  record.options.mediaId=record.id;
  if(supported())await transaction('readwrite',store=>store.put(record));
  return record;
}
export async function listQueuedMediaUploads(){
  if(!supported())return [];
  const list=await transaction('readonly',store=>store.getAll());
  return (Array.isArray(list)?list:[]).map(normaliseQueuedMediaUpload).sort((a,b)=>String(a.createdAt).localeCompare(String(b.createdAt)));
}
export async function markQueuedMediaUploaded(id,asset){
  if(!supported())return null;
  const record=await transaction('readonly',store=>store.get(String(id)));
  if(!record)return null;
  const next=normaliseQueuedMediaUpload({...record,asset,status:'uploaded',lastError:'',updatedAt:now()});
  await transaction('readwrite',store=>store.put(next));
  return next;
}
export async function markQueuedMediaFailed(id,error){
  if(!supported())return null;
  const record=await transaction('readonly',store=>store.get(String(id)));
  if(!record)return null;
  const next=normaliseQueuedMediaUpload({...record,status:'queued',attempts:(Number(record.attempts)||0)+1,lastError:String(error?.message||error||'Upload failed'),updatedAt:now()});
  await transaction('readwrite',store=>store.put(next));
  return next;
}
export async function removeQueuedMediaUpload(id){
  if(!supported())return;
  await transaction('readwrite',store=>store.delete(String(id)));
}
export async function queuedMediaUploadCount(){const list=await listQueuedMediaUploads();return list.length;}
