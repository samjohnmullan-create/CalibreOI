import { readCloudState, seenCloudAt, markCloudSeen } from "./cloud.js?v=2";
import { forceCloudPull } from "./store-cloud.js?v=2";

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

async function check(){
  if(checking||document.visibilityState!=="visible")return;
  checking=true;
  try{
    const cloud=await readCloudState();
    if(!cloud.signedIn||!cloud.updatedAt)return;
    const seen=seenCloudAt();
    if(!seen){markCloudSeen(cloud.updatedAt);return;}
    if(Date.parse(cloud.updatedAt)<=Date.parse(seen))return;
    pending=true;
    if(!safeToRefresh())return;
    await forceCloudPull();
    markCloudSeen(cloud.updatedAt);
    location.reload();
  }catch(err){
    console.warn("Calibre automatic cloud refresh failed",err);
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
