import { ensureSpares } from "./match.js";

export const JOB_TYPES = [
  ["manual", "Mechanical manual"],
  ["automatic", "Automatic"],
  ["quartz", "Quartz"],
  ["pocket", "Pocket watch"],
  ["clock", "Clock"],
  ["inspect", "Inspection only"]
];

const FULL_MECH = ["Intake","Pre-service timing","Uncasing","Dismantling & inspection","Cleaning & parts inspection","Repairs & parts","Reassembly & lubrication","Train & escapement","Balance & beat","Casing & function","Regulation","Final QC"];
const FULL_AUTO = ["Intake","Pre-service timing","Uncasing","Dismantling & inspection","Cleaning & parts inspection","Repairs & parts","Reassembly & lubrication","Train & escapement","Balance & beat","Automatic works","Casing & function","Regulation","Final QC"];
const FULL_POCKET = ["Intake","Pre-service timing","Case & pendant","Uncasing","Dismantling & inspection","Cleaning & parts inspection","Repairs & parts","Reassembly & lubrication","Train & escapement","Balance & beat","Casing & function","Regulation","Final QC"];

export const STAGE_PATHS = {
  manual: FULL_MECH,
  automatic: FULL_AUTO,
  pocket: FULL_POCKET,
  quartz: ["Intake","Battery & electrical","Uncasing","Movement inspection","Cleaning & contacts","Repair & reassembly","Hands & calendar","Casing & function","Final QC"],
  clock: ["Intake","Case","Clock inspection","Clock cleaning","Clock reassembly","Pendulum","Strike","Regulation","Final QC"],
  inspect: ["Intake","Inspection only","Final QC"]
};

export const STAGES = STAGE_PATHS.manual;

export function stagesFor(job){
  const type = job && STAGE_PATHS[job.jobType] ? job.jobType : "manual";
  const decision = String(job && job.decision || "");
  if (type === "inspect") return STAGE_PATHS.inspect;
  if (type === "clock" || type === "quartz") return STAGE_PATHS[type];
  if (decision === "Leave it") return ["Intake","Final QC"];
  if (decision === "Regulate only") return ["Intake","Pre-service timing","Regulation","Final QC"];
  if (decision === "Case, hands or crystal") return ["Intake","Uncasing","Case / hands / crystal","Casing & function","Final QC"];
  return STAGE_PATHS[type];
}

export const FAULT_CHIPS = ["Crown/winder non-functional","Movement loose","Strap missing","Case scratched","Water resistance unverified","Poor timing","High beat error","Magnetised","Mainspring/barrel fault","Keyless works fault","Balance/hairspring fault"];
export const SEVERITIES = ["Minor","Moderate","Critical","Parts required"];
export const STATUSES = ["Purchased","Awaiting inspection","On bench","Awaiting parts","Ready for photos","Ready to list","Listed","Sold","Spares"];
export const CHANNELS = ["Not listed","eBay","Etsy","Instagram","Shop","Auction","Other"];
const STATUS_MAP = { "on the bench":"On bench", "waiting parts":"Awaiting parts", "complete":"Ready to list", "sold":"Sold", "spares":"Spares" };

export function stockAge(job){ const from = job.acquiredAt || job.createdAt; return from ? Math.floor((Date.now()-new Date(from).getTime())/86400000) : 0; }

const DB="calibre-co-v1", STORE="kv"; let dbp;
function openDB(){ if(dbp)return dbp; dbp=new Promise((res,rej)=>{ const r=indexedDB.open(DB,1); r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(STORE))r.result.createObjectStore(STORE);}; r.onsuccess=()=>res(r.result); r.onerror=()=>rej(r.error); }); return dbp; }
function get(k){ return openDB().then(db=>new Promise((res,rej)=>{ const q=db.transaction(STORE).objectStore(STORE).get(k); q.onsuccess=()=>res(q.result); q.onerror=()=>rej(q.error); })); }
function put(k,v){ return openDB().then(db=>new Promise((res,rej)=>{ const tx=db.transaction(STORE,"readwrite"); tx.objectStore(STORE).put(v,k); tx.oncomplete=()=>res(); tx.onerror=()=>rej(tx.error); })); }

export function uid(){ return "job-"+Math.random().toString(36).slice(2,8)+Date.now().toString(36).slice(-4); }
export function slugify(s){ return String(s||"watch").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||"watch"; }
export const PHOTO_SLOTS=[["intake","Intake"],["caseback","Caseback"],["movement","Movement"],["dial","Dial"],["damage","Damage"],["progress","Repair progress"],["finished","Finished watch"],["hero","Sales hero"]];
export function blankPhotos(){ return Object.fromEntries(PHOTO_SLOTS.map(([k])=>[k,[]])); }
export function blankPart(){ return {part:"",supplier:"",partNumber:"",quantity:"1",cost:"",ordered:"",received:false,fitted:false}; }
export function blankStage(){ return {name:"",notes:"",condition:"",parts:"",measure:"",complete:false,photos:[],checks:{},updatedAt:null}; }
export function partsCost(job){ return (job.parts||[]).reduce((n,p)=>n+(Number(p.cost)||0)*(Number(p.quantity)||1),0); }
export function coverPhoto(job){ const shots=job&&job.photos||{}; for(const key of ["intake","hero","finished","dial","caseback","movement","damage","progress"]) if(shots[key]&&shots[key][0]) return shots[key][0]; if(job&&job.passport&&job.passport.photos&&job.passport.photos[0])return job.passport.photos[0]; for(const s of (job&&job.stages)||[]) if(s.photos&&s.photos[0]) return s.photos[0]; return ""; }
export function blankPassport(){ return {maker:"",model:"",country:"",year:"",confidence:"Unknown",dialMarkings:"",movementMaker:"",calibre:"",calibreFamily:"",beatRate:"",powerReserve:"",settingType:"",jewels:"",movementType:"",movementMm:"",escapement:"",serial:"",caseNumber:"",reference:"",caseMaterial:"",caseStyle:"",casebackType:"",crystalType:"",crownType:"",lugWidth:"",width:"",height:"",thickness:"",complications:"",waterMark:"",strap:"",hallmarks:"",engravings:"",notes:"",history:"",warnings:"",auctionHouse:"",lotNumber:"",auctionDate:"",seller:"",invoiceNumber:"",listingText:"",invoicePhoto:"",sources:[],photos:[]}; }
export function blankBusiness(){ return {purchasePrice:"",buyerPremium:"",postage:"",strapCost:"",batteryCost:"",partsCost:"",consumables:"",externalService:"",marketplaceFees:"",shippingToBuyer:"",otherCost:"",labourMinutes:"",labourRate:"",targetSale:"",actualSale:"",minSale:"",title:"",text:""}; }

const LEGACY_STAGE_MAP={
  "Demagnetising":"Intake","Strip-down":"Dismantling & inspection","Inspection":"Dismantling & inspection","Cleaning":"Cleaning & parts inspection","Barrel & Mainspring":"Reassembly & lubrication","Train Test":"Train & escapement","Escapement":"Train & escapement","Balance":"Balance & beat","Lubrication":"Reassembly & lubrication","Rotor":"Automatic works","Bow and pendant":"Case & pendant","Movement secure":"Casing & function","Hands and calendar":"Casing & function"
};

function normaliseDiagnosticFaults(list){
  if(!Array.isArray(list))return [];
  const seen=new Set();
  return list.filter(x=>x&&x.text).map((x,i)=>{
    const key=String(x.key||`${x.sourceStage||"legacy"}::${x.sourceCheck||i}::${x.id||i}`);
    const status=["possible","confirmed","ruledout"].includes(x.status)?x.status:"possible";
    return {
      key,
      id:String(x.id||key),
      text:String(x.text),
      category:String(x.category||"General"),
      severity:SEVERITIES.includes(x.severity)?x.severity:(x.severity||"Moderate"),
      sourceStage:String(x.sourceStage||"Manual"),
      sourceCheck:String(x.sourceCheck||"manual"),
      sourceQuestion:String(x.sourceQuestion||""),
      status,
      createdAt:x.createdAt||new Date().toISOString(),
      updatedAt:x.updatedAt||x.createdAt||new Date().toISOString()
    };
  }).filter(x=>{if(seen.has(x.key))return false;seen.add(x.key);return true;});
}

export function blankJob(partial={}){
  const initialPath=STAGE_PATHS[partial.jobType]||STAGES;
  const stages=initialPath.map(name=>Object.assign(blankStage(),{name}));
  const job={id:uid(),pushId:partial.pushId||"",jobId:partial.jobId||"CCO-"+String(Math.floor(Math.random()*9000)+1000),watchName:partial.watchName||"Untitled watch",status:"on the bench",stage:0,stages,timingRuns:[],diagnosticFaults:[],passport:blankPassport(),business:blankBusiness(),chat:[],createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
  return normalise(Object.assign(job,partial,{stages:partial.stages||stages,passport:Object.assign(blankPassport(),partial.passport),business:Object.assign(blankBusiness(),partial.business)}));
}

export function normalise(job){
  job.jobType=STAGE_PATHS[job.jobType]?job.jobType:"manual";
  job.decision=job.decision||"";
  const path=stagesFor(job), existing=Array.isArray(job.stages)?job.stages:[], byName={};
  existing.forEach((s,i)=>{
    let name=(s&&s.name)||STAGES[i]; if(!name)return; name=LEGACY_STAGE_MAP[name]||name;
    const incoming=Object.assign(blankStage(),s,{name,photos:Array.isArray(s&&s.photos)?s.photos:[],checks:(s&&s.checks&&typeof s.checks==="object")?s.checks:{}});
    if(byName[name]){
      byName[name].notes=[byName[name].notes,incoming.notes].filter(Boolean).join("\n");
      byName[name].photos=[...(byName[name].photos||[]),...(incoming.photos||[])];
      byName[name].checks=Object.assign({},byName[name].checks||{},incoming.checks||{});
      byName[name].complete=byName[name].complete||incoming.complete;
    } else byName[name]=incoming;
  });
  job.stages=path.map(name=>byName[name]||Object.assign(blankStage(),{name}));
  job.passport=Object.assign(blankPassport(),job.passport,{photos:Array.isArray(job.passport&&job.passport.photos)?job.passport.photos:[],sources:Array.isArray(job.passport&&job.passport.sources)?job.passport.sources:[]});
  job.photos=Object.assign(blankPhotos(),job.photos||{}); PHOTO_SLOTS.forEach(([k])=>job.photos[k]=Array.isArray(job.photos[k])?job.photos[k]:[]);
  job.business=Object.assign(blankBusiness(),job.business); if(!job.business.partsCost&&job.business.repairCost)job.business.partsCost=job.business.repairCost;
  job.timingRuns=Array.isArray(job.timingRuns)?job.timingRuns:[]; job.chat=Array.isArray(job.chat)?job.chat:[];
  job.diagnosticFaults=normaliseDiagnosticFaults(job.diagnosticFaults);
  job.faults=(Array.isArray(job.faults)?job.faults:[]).filter(f=>f&&f.text).map(f=>({text:String(f.text),severity:SEVERITIES.includes(f.severity)?f.severity:"Moderate"}));
  job.parts=(Array.isArray(job.parts)?job.parts:[]).map(p=>Object.assign(blankPart(),p,{received:!!p.received,fitted:!!p.fitted})); if(job.parts.length)job.business.partsCost=String(partsCost(job));
  job.labour=Object.assign({running:false,startedAt:null},job.labour||{}); job.diagnosis=job.diagnosis||""; job.repairPerformed=job.repairPerformed||"";
  job.stage=Math.max(0,Math.min(path.length-1,Number(job.stage)||0)); job.status=STATUS_MAP[job.status]||(STATUSES.includes(job.status)?job.status:"On bench"); job.channel=job.channel||"Not listed"; job.offers=(Array.isArray(job.offers)?job.offers:[]).filter(o=>o&&o.amount); job.priority=!!job.priority;
  if(job.status==="Spares")ensureSpares(job); else if(typeof job.fitsNote!=="string")job.fitsNote="";
  return job;
}

export function markSpares(job){ job.status="Spares"; ensureSpares(job); return job; }
function phenix(){ return blankJob({jobId:"CCO-0001",watchName:"Phénix 180 Pocket Watch",passport:{maker:"Phénix",calibre:"180"}}); }
export async function loadState(){ let state=await get("state"); if(!state||!Array.isArray(state.jobs)){state={jobs:[phenix()],currentId:null};state.currentId=state.jobs[0].id;await put("state",state);} state.jobs=state.jobs.map(j=>{try{return normalise(j);}catch(err){j.status=j.status||"On bench";j.stages=j.stages||[];j._error=err.message;return j;}}); state.ledger=(Array.isArray(state.ledger)?state.ledger:[]).filter(e=>e&&e.amount); if(!state.jobs.length){state.currentId=null;return state;} if(!state.jobs.find(j=>j.id===state.currentId))state.currentId=state.jobs[0].id; return state; }
export async function saveState(state){ if(!state||!Array.isArray(state.jobs))throw new Error("Invalid Calibre state"); state.jobs.forEach(j=>j.updatedAt=new Date().toISOString()); await put("state",state); }
export function current(state){ return state&&Array.isArray(state.jobs)?(state.jobs.find(j=>j.id===state.currentId)||state.jobs[0]):null; }
export function progress(job){ const all=stagesFor(job).length||1, done=(job.stages||[]).filter(s=>s.complete).length; return Math.round(done/all*100); }
export function money(n){ const v=Number(n); return Number.isFinite(v)?v.toLocaleString("en-AU",{style:"currency",currency:"AUD"}):"$0.00"; }
export function escapeHtml(s){ return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c])); }
export function labourCost(b){ return (Number(b.labourMinutes)||0)/60*(Number(b.labourRate)||0); }
export function cashOut(b){ return ["purchasePrice","buyerPremium","postage","strapCost","batteryCost","partsCost","consumables","externalService","marketplaceFees","shippingToBuyer","otherCost"].reduce((n,k)=>n+(Number(b[k])||0),0); }
export function investment(b){return cashOut(b);} export function salePrice(b){return Number(b.actualSale)||Number(b.targetSale)||0;} export function cashProfit(b){const s=salePrice(b);return s?s-cashOut(b):0;} export function profitAfterLabour(b){return cashProfit(b)-labourCost(b);} export function roi(b){const o=cashOut(b);return o?cashProfit(b)/o:0;}

export function importCard(raw){
  const sourceStages=Array.isArray(raw.stages)?raw.stages:[];
  return blankJob({pushId:raw.pushId||slugify(raw.watchName||raw.jobId||"watch"),watchName:raw.watchName||"Untitled watch",jobId:raw.jobId,status:raw.status||"on the bench",writeOff:raw.writeOff||"",fitsNote:raw.fitsNote||"",sparesParts:raw.sparesParts||[],passport:raw.passport||{},business:raw.business||{},timingRuns:raw.timingRuns||[],photos:raw.photos||{},jobType:raw.jobType||"manual",decision:raw.decision||"",diagnosis:raw.diagnosis||"",repairPerformed:raw.repairPerformed||"",faults:raw.faults||[],diagnosticFaults:raw.diagnosticFaults||[],parts:raw.parts||[],priority:!!raw.priority,channel:raw.channel||"Not listed",offers:raw.offers||[],stage:raw.stage||0,stages:sourceStages});
}
export function exportCard(job){ const pushId=job.pushId||slugify(job.watchName); return {type:"calibrejob",version:4,pushId,jobId:job.jobId,watchName:job.watchName,status:job.status,jobType:job.jobType||"manual",decision:job.decision||"",diagnosis:job.diagnosis||"",repairPerformed:job.repairPerformed||"",writeOff:job.writeOff||"",fitsNote:job.fitsNote||"",priority:!!job.priority,channel:job.channel||"Not listed",offers:job.offers||[],faults:job.faults||[],diagnosticFaults:normaliseDiagnosticFaults(job.diagnosticFaults),parts:job.parts||[],stage:job.stage||0,sparesParts:job.sparesParts||[],importUrl:"https://samjohnmullan-create.github.io/CalibreOI/?card="+encodeURIComponent(pushId),passport:job.passport,business:job.business,timingRuns:job.timingRuns||[],photos:job.photos||blankPhotos(),invoicePhoto:(job.passport&&job.passport.invoicePhoto)||"",photoCount:PHOTO_SLOTS.reduce((n,[k])=>n+((job.photos&&job.photos[k]&&job.photos[k].length)||0),0)+(job.stages||[]).reduce((n,s)=>n+((s.photos&&s.photos.length)||0),0),stages:(job.stages||[]).map(s=>({name:s.name,notes:s.notes,condition:s.condition,parts:s.parts,measure:s.measure,complete:s.complete,checks:s.checks||{},photos:s.photos||[]}))}; }
export async function compressImage(file){ const url=URL.createObjectURL(file); try{ const img=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=url;}); const scale=Math.min(1,900/Math.max(img.width,img.height)); const c=document.createElement("canvas"); c.width=Math.max(1,Math.round(img.width*scale)); c.height=Math.max(1,Math.round(img.height*scale)); c.getContext("2d").drawImage(img,0,0,c.width,c.height); return c.toDataURL("image/jpeg",0.72);} finally{URL.revokeObjectURL(url);} }
