import * as base from "./store-base.js?v=1";
import { readCloudState, writeCloudState, markCloudSeen } from "./cloud.js?v=3";

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
function cleanCategory(v){const s=String(v||"").toLowerCase();if(s.includes("watch"))return "Watch";if(s.includes("tool"))return "Tool";if(s.includes("strap")||s.includes("band"))return "Strap";if(s.includes("consum"))return "Consumable";if(s.includes("part"))return "Part";return "Other";}
function cleanStatus(v){const s=String(v||"").toLowerCase();if(s.includes("cancel")||s.includes("closed"))return "Cancelled / closed";if(s.includes("out for delivery"))return "Out for delivery";if(s.includes("deliver")||s.includes("received"))return "Delivered";if(s.includes("transit")||s.includes("departure"))return "In transit";if(s.includes("carrier")||s.includes("collected"))return "Collected by carrier";if(s.includes("ready")||s.includes("dispatch"))return "Awaiting dispatch";if(s.includes("ship"))return "Shipped";if(s.includes("confirm")||s.includes("order"))return "Ordered";return v||"Ordered";}
function purchaseKey(p){return String(p.sourceKey||p.pushId||[p.source,p.orderId,p.itemName,p.variant].filter(Boolean).join("|")||p.id||"");}
function normalisePurchase(p={}){
  const now=new Date().toISOString();
  return {
    id:p.id||"buy-"+Math.random().toString(36).slice(2,9),
    sourceKey:purchaseKey(p),
    source:p.source||"",
    orderId:p.orderId||"",
    itemName:p.itemName||p.name||"Incoming item",
    category:cleanCategory(p.category),
    variant:p.variant||"",
    quantity:Number(p.quantity)||1,
    amount:p.amount===""||p.amount==null?"":String(p.amount),
    currency:p.currency||"AUD",
    status:cleanStatus(p.status),
    orderedAt:p.orderedAt||p.purchaseDate||"",
    tracking:p.tracking||"",
    eta:p.eta||"",
    sourceRef:p.sourceRef||"",
    notes:p.notes||"",
    receivedAt:p.receivedAt||"",
    createdAt:p.createdAt||now,
    updatedAt:p.updatedAt||now
  };
}
function normaliseState(state){
  if(!state||!Array.isArray(state.jobs))return null;
  state.jobs=state.jobs.map(j=>{try{return base.normalise(j);}catch{return j;}});
  state.ledger=(Array.isArray(state.ledger)?state.ledger:[]).filter(e=>e&&e.amount);
  state.incoming=(Array.isArray(state.incoming)?state.incoming:[]).map(normalisePurchase);
  if(state.jobs.length&&!state.jobs.some(j=>j.id===state.currentId))state.currentId=state.jobs[0].id;
  if(!state.jobs.length)state.currentId=null;
  return state;
}
function mergePurchaseLists(a=[],b=[]){
  const byKey=new Map();
  [...a,...b].forEach(raw=>{
    const p=normalisePurchase(raw),key=purchaseKey(p)||p.id,prev=byKey.get(key);
    if(!prev||ms(p.updatedAt)>=ms(prev.updatedAt))byKey.set(key,p);
  });
  return [...byKey.values()];
}
function mergeStates(local,cloud){
  local=normaliseState(structuredClone(local))||{jobs:[],currentId:null,ledger:[],incoming:[]};
  cloud=normaliseState(structuredClone(cloud))||{jobs:[],currentId:null,ledger:[],incoming:[]};
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
    incoming:mergePurchaseLists(cloud.incoming,local.incoming),
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
    if(!cloud.state){await writeCloudState(local);return local;}
    const merged=mergeStates(local,cloud.state);
    await putLocal("state",merged);
    markCloudSeen(cloud.updatedAt);
    return merged;
  }catch(err){console.warn("Calibre cloud pull failed; using local data",err);return local;}
}

export async function saveState(state){
  if(!state||!Array.isArray(state.jobs))throw new Error("Invalid Calibre state");
  state=normaliseState(state);
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

function importPurchase(state,raw){
  const list=Array.isArray(raw.items)?raw.items:[raw];
  let added=0,updated=0;
  for(const source of list){
    const p=normalisePurchase({...source,sourceKey:source.sourceKey||raw.sourceKey||raw.pushId});
    const key=purchaseKey(p);
    const idx=state.incoming.findIndex(x=>purchaseKey(x)===key);
    if(idx>=0){
      const old=state.incoming[idx];
      state.incoming[idx]=normalisePurchase({...old,...Object.fromEntries(Object.entries(p).filter(([,v])=>v!==""&&v!=null)),id:old.id,createdAt:old.createdAt,updatedAt:new Date().toISOString()});
      updated++;
    }else{
      state.incoming.unshift(p);
      added++;
    }
  }
  return {added,updated};
}

function meaningful(v){
  if(v==null)return false;
  if(typeof v==="string")return v.trim()!=="";
  if(Array.isArray(v))return v.length>0;
  if(typeof v==="object")return Object.keys(v).length>0;
  return true;
}
function mergeObject(existing={},incoming={},incomingWins=true){
  const out=structuredClone(existing||{});
  for(const [k,v] of Object.entries(incoming||{})){
    if(!meaningful(v))continue;
    if(v&&typeof v==="object"&&!Array.isArray(v))out[k]=mergeObject(out[k]||{},v,incomingWins);
    else if(incomingWins||!meaningful(out[k]))out[k]=structuredClone(v);
  }
  return out;
}
function stableKey(v){
  if(v&&typeof v==="object")return String(v.id||v.key||v.code||v.name||v.text||v.partNumber||v.ref||JSON.stringify(v));
  return String(v);
}
function mergeArray(existing=[],incoming=[]){
  const out=Array.isArray(existing)?structuredClone(existing):[];
  const seen=new Set(out.map(stableKey));
  for(const item of (Array.isArray(incoming)?incoming:[])){
    const key=stableKey(item);
    if(!seen.has(key)){out.push(structuredClone(item));seen.add(key);}
  }
  return out;
}
function earlyStatus(v){return !v||["Purchased","Awaiting inspection"].includes(v);}
function mergeJob(existing,incoming,raw={}){
  const now=new Date().toISOString();
  const merged={...structuredClone(existing)};

  // Research/passport/business fields can improve with later pushes.
  for(const k of ["watchName","jobId","jobType","channel","askingPrice","research","references","notes"]){
    if(meaningful(incoming[k]))merged[k]=structuredClone(incoming[k]);
  }
  merged.passport=mergeObject(existing.passport||{},incoming.passport||{},true);
  merged.business=mergeObject(existing.business||{},incoming.business||{},true);

  // Additive fields: new information is appended, never wipes bench-entered entries.
  merged.faults=mergeArray(existing.faults,incoming.faults);
  merged.parts=mergeArray(existing.parts,incoming.parts);
  merged.photos=mergeObject(incoming.photos||{},existing.photos||{},true); // existing photos win; incoming fills gaps.

  // Bench progress is local-authoritative once work has started.
  for(const k of ["stages","timingRuns","diagnostics","diagnosticFaults","repairPerformed","diagnosis","decision","service","serviceNotes"]){
    if(!meaningful(existing[k])&&meaningful(incoming[k]))merged[k]=structuredClone(incoming[k]);
  }

  // Preserve workflow status after the watch has moved beyond intake unless explicitly forced.
  if(raw.forceStatus===true&&meaningful(incoming.status))merged.status=incoming.status;
  else if(earlyStatus(existing.status)&&meaningful(incoming.status))merged.status=incoming.status;
  else merged.status=existing.status||incoming.status;

  merged.id=existing.id;
  merged.createdAt=existing.createdAt||incoming.createdAt;
  merged.pushId=incoming.pushId||existing.pushId||raw.pushId||"";
  merged.updatedAt=now;
  merged.lastInboxMergeAt=now;
  merged.lastInboxPushId=raw.pushId||incoming.pushId||"";
  return base.normalise(merged);
}

export async function importInboxItems(items){
  const state=normaliseState(await getLocal("state"))||{jobs:[],currentId:null,ledger:[],incoming:[]};
  let added=0,updated=0;
  const importedIds=[];
  for(const item of (Array.isArray(items)?items:[])){
    try{
      const raw=item&&item.job_data;
      if(!raw)continue;
      if(raw.type==="calibrejob"){
        const incoming=base.importCard(raw);
        incoming.pushId=raw.pushId||incoming.pushId;
        incoming.updatedAt=new Date().toISOString();
        const idx=state.jobs.findIndex(j=>(incoming.pushId&&j.pushId===incoming.pushId)||(raw.jobId&&j.jobId===raw.jobId));
        if(idx>=0){
          state.jobs[idx]=mergeJob(state.jobs[idx],incoming,raw);
          updated++;
        }else{
          state.jobs.push(base.normalise(incoming));
          added++;
        }
        state.currentId=state.jobs[idx>=0?idx:state.jobs.length-1].id;
      }else if(raw.type==="calibrepurchase"||raw.type==="calibreincoming"){
        const r=importPurchase(state,raw);added+=r.added;updated+=r.updated;
      }else continue;
      if(item.id)importedIds.push(item.id);
    }catch(err){console.warn("Skipped invalid Calibre inbox item",item?.id,err);}
  }
  if(added||updated){
    state._syncUpdatedAt=new Date().toISOString();
    await putLocal("state",state);
    try{await writeCloudState(state);}catch(err){console.warn("Inbox imported locally but cloud push failed",err);}
  }
  return {state,added,updated,importedIds};
}

export async function forceCloudPull(){
  const local=normaliseState(await getLocal("state"));
  const cloud=await readCloudState();
  if(!cloud.signedIn)throw new Error("Sign in to Calibre Cloud first.");
  if(!cloud.state)return local;
  const merged=mergeStates(local||{jobs:[],currentId:null,incoming:[]},cloud.state);
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
