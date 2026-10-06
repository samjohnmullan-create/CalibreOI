import * as base from "./store-base.js?v=1";
import { readCloudState, writeCloudState, markCloudSeen } from "./cloud.js?v=2";

export * from "./store-base.js?v=1";

const DB="calibre-co-v1", STORE="kv";
let dbp;
function openDB(){
  if(dbp)return dbp;
  dbp=new Promise((res,rej)=>{
    const r=indexedDB.open(DB,1);
    r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(STORE))r.result.createObjectStore(STORE);};
    r.onsuccess=()=>res(r.result);
    r.onerror=()=>rej(r.error);
  });
  return dbp;
}
function getLocal(k){return openDB().then(db=>new Promise((res,rej)=>{const q=db.transaction(STORE).objectStore(STORE).get(k);q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error);}));}
function putLocal(k,v){return openDB().then(db=>new Promise((res,rej)=>{const tx=db.transaction(STORE,"readwrite");tx.objectStore(STORE).put(v,k);tx.oncomplete=()=>res();tx.onerror=()=>rej(tx.error);}));}
function ms(v){const n=Date.parse(v||"");return Number.isFinite(n)?n:0;}
function normaliseState(state){
  if(!state||!Array.isArray(state.jobs))return null;
  state.jobs=state.jobs.map(j=>{try{return base.normalise(j);}catch{return j;}});
  state.ledger=(Array.isArray(state.ledger)?state.ledger:[]).filter(e=>e&&e.amount);
  if(state.jobs.length&&!state.jobs.some(j=>j.id===state.currentId))state.currentId=state.jobs[0].id;
  if(!state.jobs.length)state.currentId=null;
  return state;
}
function mergeStates(local,cloud){
  local=normaliseState(structuredClone(local))||{jobs:[],currentId:null,ledger:[]};
  cloud=normaliseState(structuredClone(cloud))||{jobs:[],currentId:null,ledger:[]};
  const byId=new Map();
  [...cloud.jobs,...local.jobs].forEach(job=>{
    const prev=byId.get(job.id);
    if(!prev||ms(job.updatedAt)>=ms(prev.updatedAt))byId.set(job.id,job);
  });
  const localStamp=ms(local._syncUpdatedAt),cloudStamp=ms(cloud._syncUpdatedAt);
  const newer=localStamp>=cloudStamp?local:cloud;
  return normaliseState({
    ...newer,
    jobs:[...byId.values()],
    currentId:local.currentId&&byId.has(local.currentId)?local.currentId:(cloud.currentId&&byId.has(cloud.currentId)?cloud.currentId:null),
    ledger:structuredClone((newer.ledger||[])),
    _syncUpdatedAt:new Date(Math.max(localStamp,cloudStamp,Date.now())).toISOString()
  });
}

export async function loadState(){
  let local=await getLocal("state");
  if(!local||!Array.isArray(local.jobs)){
    local=await base.loadState();
    local._syncUpdatedAt=local._syncUpdatedAt||new Date().toISOString();
    await putLocal("state",local);
  }
  local=normaliseState(local);
  try{
    const cloud=await readCloudState();
    if(!cloud.signedIn)return local;
    if(!cloud.state){
      await writeCloudState(local);
      return local;
    }
    const merged=mergeStates(local,cloud.state);
    await putLocal("state",merged);
    markCloudSeen(cloud.updatedAt);
    return merged;
  }catch(err){
    console.warn("Calibre cloud pull failed; using local data",err);
    return local;
  }
}

export async function saveState(state){
  if(!state||!Array.isArray(state.jobs))throw new Error("Invalid Calibre state");
  const now=new Date().toISOString();
  const current=state.jobs.find(j=>j.id===state.currentId);
  if(current)current.updatedAt=now;
  state._syncUpdatedAt=now;
  await putLocal("state",state);
  try{
    const pushed=await writeCloudState(state);
    state._cloud={signedIn:!!pushed.signedIn,lastPush:pushed.updatedAt||null,error:""};
  }catch(err){
    state._cloud={signedIn:true,lastPush:null,error:err?.message||"Cloud sync failed"};
    console.warn("Calibre cloud push failed; local save kept",err);
  }
}

export async function forceCloudPull(){
  const local=normaliseState(await getLocal("state"));
  const cloud=await readCloudState();
  if(!cloud.signedIn)throw new Error("Sign in to Calibre Cloud first.");
  if(!cloud.state)return local;
  const merged=mergeStates(local||{jobs:[],currentId:null},cloud.state);
  await putLocal("state",merged);
  markCloudSeen(cloud.updatedAt);
  return merged;
}

export async function forceCloudPush(){
  const state=normaliseState(await getLocal("state"));
  if(!state)throw new Error("No local Calibre data found.");
  const result=await writeCloudState(state);
  if(!result.signedIn)throw new Error("Sign in to Calibre Cloud first.");
  return result;
}
