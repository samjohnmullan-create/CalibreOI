import * as base from "./store-sync-safe.js?v=1";
export * from "./store-sync-safe.js?v=1";

const DB="calibre-co-v1",STORE="kv";
let dbp;
function openDB(){if(dbp)return dbp;dbp=new Promise((resolve,reject)=>{const req=indexedDB.open(DB,1);req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE))req.result.createObjectStore(STORE);};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});return dbp;}
function getLocal(key){return openDB().then(db=>new Promise((resolve,reject)=>{const req=db.transaction(STORE).objectStore(STORE).get(key);req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);}));}
function isCanonicalState(state){return !!state&&typeof state==='object'&&Array.isArray(state.items)&&Array.isArray(state.workRecords);}

// Canonical Item + Work collections define a valid hot-path state. Legacy Jobs are
// optional compatibility data and must never decide whether the application can load.
export async function loadState(){
  try{
    const state=await getLocal('state');
    if(isCanonicalState(state))return state;
  }catch(err){console.warn('Fast local Calibre read failed; using full loader',err);}
  const state=await base.loadState();
  if(state){state.items=Array.isArray(state.items)?state.items:[];state.workRecords=Array.isArray(state.workRecords)?state.workRecords:[];}
  return state;
}
export async function saveState(state){return base.saveState(state);}
