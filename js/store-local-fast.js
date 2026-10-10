import * as base from "./store-sync-safe.js?v=1";
export * from "./store-sync-safe.js?v=1";

const DB="calibre-co-v1",STORE="kv";
let dbp;
function openDB(){
  if(dbp)return dbp;
  dbp=new Promise((resolve,reject)=>{
    const req=indexedDB.open(DB,1);
    req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE))req.result.createObjectStore(STORE);};
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error);
  });
  return dbp;
}
function getLocal(key){
  return openDB().then(db=>new Promise((resolve,reject)=>{
    const req=db.transaction(STORE).objectStore(STORE).get(key);
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error);
  }));
}

// Hot path for ordinary page reads. The saved state is already normalised when it is
// written/imported, so don't run the entire collection through every migration layer
// merely to display one job. Fall back to the full loader only for a missing/invalid
// local database.
export async function loadState(){
  try{
    const state=await getLocal("state");
    if(state&&Array.isArray(state.jobs))return state;
  }catch(err){console.warn("Fast local Calibre read failed; using full loader",err);}
  return base.loadState();
}

export async function saveState(state){return base.saveState(state);}
