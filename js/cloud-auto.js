import { readCloudState, seenCloudAt, markCloudSeen, readInbox, markInboxImported } from "./cloud.js?v=4";
import { forceCloudPull, importInboxItems, loadState, saveState } from "./store-cloud.js?v=7";

const POLL_MS=30000;
const EDIT_GRACE_MS=1800;
let lastInteraction=0,checking=false,pending=false,timer=null;

const here=(location.pathname.split("/").pop()||"index.html").split("?")[0];
const idle=fn=>{if("requestIdleCallback" in window)requestIdleCallback(fn,{timeout:1800});else setTimeout(fn,350);};
const laterImport=(path,label)=>idle(()=>import(path).catch(err=>console.warn(label,err)));

laterImport("./qr-global-runtime.js?v=1","Calibre QR scanner entry unavailable");
if(here==="workbench.html")laterImport("./workbench-parts-intel-runtime.js?v=1","Calibre Workbench parts intelligence unavailable");
if(here==="item.html")laterImport("./item-qr-runtime.js?v=1","Calibre Item QR tools unavailable");
if(here==="passport.html")laterImport("./passport-media.js?v=5","Calibre Passport media unavailable");
if(here==="sales.html")laterImport("./publish-controls.js?v=1","Calibre public publishing controls unavailable");
if(here==="finance.html"||here==="index.html")laterImport("./available-cash.js?v=1","Calibre cash position unavailable");
if(here==="suppliers.html"){
  laterImport("./parts-intelligence-runtime.js?v=2","Calibre parts intelligence unavailable");
  laterImport("./workshop-assets-link.js?v=1","Calibre workshop IDs link unavailable");
}
if(here==="suppliers.html"||here==="inventory.html")laterImport("./parts-workflow.js?v=3","Calibre parts workflow unavailable");
if(here==="settings.html")laterImport("./settings-media-health.js?v=1","Calibre media queue health unavailable");
if(here==="inventory.html"){
  laterImport("./collection-dashboard.js?v=2","Calibre collection dashboard unavailable");
  laterImport("./purchase-review.js?v=2","Calibre purchase review unavailable");
}
if(new Set(["index.html","inventory.html","calibre.html","sales.html","service.html","passport.html","timegrapher.html","business.html","summary.html","suppliers.html","documents.html"]).has(here)){
  laterImport("./archive-cover-runtime.js?v=3","Calibre archive covers unavailable");
}

function isEditing(){const el=document.activeElement;return !!el?.closest?.("input,textarea,select,[contenteditable='true']");}
function touch(){lastInteraction=Date.now();}
["input","change","pointerdown","keydown"].forEach(type=>document.addEventListener(type,touch,true));
function safeToRefresh(){return document.visibilityState==="visible"&&!isEditing()&&Date.now()-lastInteraction>EDIT_GRACE_MS;}

function purchaseType(item){const type=String(item?.job_data?.type||"").toLowerCase();return type==="calibrepurchase"||type==="calibreincoming";}
function reviewKey(p={}){return String(p.sourceKey||p.pushId||[p.source,p.orderId,p.itemName||p.name,p.variant].filter(Boolean).join("|")||"");}
function reviewItem(source={},raw={}){
  const now=new Date().toISOString();
  return {id:`review-${Math.random().toString(36).slice(2,9)}`,sourceKey:reviewKey(source)||reviewKey(raw),pushId:String(raw.pushId||source.pushId||""),source:String(source.source||raw.source||""),orderId:String(source.orderId||raw.orderId||""),itemName:String(source.itemName||source.name||raw.itemName||raw.name||"Purchase"),category:String(source.category||raw.category||"Other"),variant:String(source.variant||raw.variant||""),quantity:Number(source.quantity||raw.quantity)||1,amount:source.amount??raw.amount??"",postage:source.postage??raw.postage??"",currency:String(source.currency||raw.currency||"AUD"),status:String(source.status||raw.status||"Ordered"),orderedAt:String(source.orderedAt||source.purchaseDate||raw.orderedAt||raw.purchaseDate||""),tracking:String(source.tracking||raw.tracking||""),eta:String(source.eta||raw.eta||""),sourceRef:String(source.sourceRef||raw.sourceRef||""),sourceMessageId:String(source.sourceMessageId||source.emailMessageId||raw.sourceMessageId||raw.emailMessageId||""),sourceSubject:String(source.sourceSubject||source.emailSubject||raw.sourceSubject||raw.emailSubject||""),notes:String(source.notes||raw.notes||""),confidence:String(source.confidence||raw.confidence||"Suggested"),detectedAt:String(source.detectedAt||raw.detectedAt||raw.createdAt||now),updatedAt:now};
}
async function queuePurchases(items){
  if(!items.length)return {added:0,updated:0,importedIds:[]};
  const state=await loadState();state.purchaseReview=Array.isArray(state.purchaseReview)?state.purchaseReview:[];
  let added=0,updated=0;const importedIds=[];
  for(const item of items){
    const raw=item?.job_data||{},sources=Array.isArray(raw.items)?raw.items:[raw];
    for(const source of sources){
      const p=reviewItem(source,raw),key=p.sourceKey||p.id,idx=state.purchaseReview.findIndex(x=>reviewKey(x)===key);
      if(idx>=0){const old=state.purchaseReview[idx];state.purchaseReview[idx]={...old,...Object.fromEntries(Object.entries(p).filter(([,v])=>v!==""&&v!=null)),id:old.id,detectedAt:old.detectedAt||p.detectedAt,updatedAt:new Date().toISOString()};updated++;}
      else{state.purchaseReview.unshift(p);added++;}
    }
    if(item.id)importedIds.push(item.id);
  }
  if(added||updated)await saveState(state);
  return {added,updated,importedIds};
}
async function importInbox(){
  const inbox=await readInbox();if(!inbox.signedIn||!inbox.items.length)return false;
  const purchaseItems=inbox.items.filter(purchaseType),normalItems=inbox.items.filter(item=>!purchaseType(item));
  const purchaseResult=await queuePurchases(purchaseItems),normalResult=normalItems.length?await importInboxItems(normalItems):{added:0,updated:0,importedIds:[]};
  for(const id of [...(purchaseResult.importedIds||[]),...(normalResult.importedIds||[])])await markInboxImported(id);
  const changed=(purchaseResult.added||0)+(purchaseResult.updated||0)+(normalResult.added||0)+(normalResult.updated||0);
  if(changed>0){pending=true;return true;}return false;
}
async function check(){
  if(checking||document.visibilityState!=="visible")return;checking=true;
  try{
    const inboxChanged=await importInbox(),cloud=await readCloudState();if(!cloud.signedIn)return;
    let cloudChanged=false;
    if(cloud.updatedAt){const seen=seenCloudAt();if(!seen)markCloudSeen(cloud.updatedAt);else if(Date.parse(cloud.updatedAt)>Date.parse(seen))cloudChanged=true;}
    if(!inboxChanged&&!cloudChanged&&!pending)return;pending=true;if(!safeToRefresh())return;
    if(cloudChanged)await forceCloudPull();if(cloud.updatedAt)markCloudSeen(cloud.updatedAt);location.reload();
  }catch(err){console.warn("Calibre automatic cloud/inbox refresh failed",err);}finally{checking=false;}
}
function schedule(){clearInterval(timer);timer=setInterval(check,POLL_MS);}
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")setTimeout(check,500);});
window.addEventListener("focus",()=>setTimeout(check,500));
setInterval(()=>{if(pending&&safeToRefresh())check();},1500);
schedule();setTimeout(check,2500);