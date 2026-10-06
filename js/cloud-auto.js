import { readCloudState, seenCloudAt, markCloudSeen, readInbox, markInboxImported } from "./cloud.js?v=3";
import { forceCloudPull, importInboxItems } from "./store-cloud.js?v=3";

const POLL_MS=15000;
const EDIT_GRACE_MS=1800;
let lastInteraction=0;
let checking=false;
let pending=false;
let timer=null;

function isEditing(){
  const el=document.activeElement;
  if(!el)return false;
  return !!el.closest?.("input,textarea,select,[contenteditable='true']");
}
function touch(){lastInteraction=Date.now();}
["input","change","pointerdown","keydown"].forEach(type=>document.addEventListener(type,touch,true));

function safeToRefresh(){
  if(document.visibilityState!=="visible")return false;
  if(isEditing())return false;
  return Date.now()-lastInteraction>EDIT_GRACE_MS;
}

async function importInbox(){
  const inbox=await readInbox();
  if(!inbox.signedIn||!inbox.items.length)return false;
  const result=await importInboxItems(inbox.items);
  for(const id of result.importedIds)await markInboxImported(id);
  if(result.added>0||result.updated>0){
    pending=true;
    return true;
  }
  return false;
}

async function check(){
  if(checking||document.visibilityState!=="visible")return;
  checking=true;
  try{
    const inboxChanged=await importInbox();
    const cloud=await readCloudState();
    if(!cloud.signedIn)return;

    let cloudChanged=false;
    if(cloud.updatedAt){
      const seen=seenCloudAt();
      if(!seen)markCloudSeen(cloud.updatedAt);
      else if(Date.parse(cloud.updatedAt)>Date.parse(seen))cloudChanged=true;
    }

    if(!inboxChanged&&!cloudChanged&&!pending)return;
    pending=true;
    if(!safeToRefresh())return;
    if(cloudChanged)await forceCloudPull();
    if(cloud.updatedAt)markCloudSeen(cloud.updatedAt);
    location.reload();
  }catch(err){
    console.warn("Calibre automatic cloud/inbox refresh failed",err);
  }finally{
    checking=false;
  }
}

function schedule(){clearInterval(timer);timer=setInterval(check,POLL_MS);}

document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")setTimeout(check,200);});
window.addEventListener("focus",()=>setTimeout(check,200));
setInterval(()=>{if(pending&&safeToRefresh())check();},1000);
schedule();
setTimeout(check,1200);
