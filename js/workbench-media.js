import { uploadMedia } from "./media.js?v=1";

const $=s=>document.querySelector(s);
const inFlight=new Set();
let bridgeTimer=0;

function bridge(){return window.calibreWorkbench||null;}
function current(){
  const b=bridge();
  if(!b)return null;
  const job=b.getJob?.();
  const state=b.getState?.();
  return job&&state?{b,job,state}:null;
}
function stageOf(job){return job?.stages?.[job.stage]||null;}
function keyFor(file,job,stage){return [job?.id||"",stage?.name||"",file.name,file.size,file.lastModified].join("|");}
function countForStage(job,stage){return (job.mediaAssets||[]).filter(a=>a&&a.category==="workshop"&&a.stageId===(stage?.name||"")).length;}
function statusNode(){
  const root=$("#stageShots")?.parentElement;
  if(!root)return null;
  let el=$("#stageMediaArchiveStatus");
  if(!el){
    el=document.createElement("p");
    el.id="stageMediaArchiveStatus";
    el.className="muted small";
    el.style.margin="8px 0 0";
    root.appendChild(el);
  }
  return el;
}
function paint(){
  const ctx=current(),el=statusNode();
  if(!ctx||!el)return;
  const stage=stageOf(ctx.job),n=countForStage(ctx.job,stage);
  el.textContent=n?`${n} full-resolution photo${n===1?"":"s"} archived privately for this stage.`:"New stage photos are also archived privately at full resolution.";
}
async function archive(file){
  const ctx=current();
  if(!ctx||!file)return;
  const stage=stageOf(ctx.job),key=keyFor(file,ctx.job,stage);
  if(inFlight.has(key))return;
  inFlight.add(key);
  const el=statusNode();
  try{
    if(el)el.textContent="Archiving full-resolution photo privately…";
    const asset=await uploadMedia(file,{watchId:ctx.job.id,jobId:ctx.job.jobId||"",stageId:stage?.name||"",category:"workshop"});
    ctx.job.mediaAssets=Array.isArray(ctx.job.mediaAssets)?ctx.job.mediaAssets:[];
    if(!ctx.job.mediaAssets.some(a=>a?.id===asset.id||a?.storageKey===asset.storageKey))ctx.job.mediaAssets.push(asset);
    await ctx.b.save();
    if(el)el.textContent="Full-resolution photo archived privately.";
    setTimeout(paint,500);
  }catch(err){
    console.warn("Calibre media archive failed",err);
    if(el)el.textContent="Local photo saved, but full-resolution archive failed: "+(err?.message||err);
  }finally{
    inFlight.delete(key);
  }
}

function bind(){
  const input=$("#stagePhoto");
  if(!input||!bridge())return false;
  if(input.dataset.mediaArchiveBound)return true;
  input.dataset.mediaArchiveBound="1";
  input.addEventListener("change",e=>{
    const file=e.target.files?.[0];
    if(file)archive(file);
  },true);
  paint();
  return true;
}

function start(){
  if(bind()){
    clearInterval(bridgeTimer);
    const shots=$("#stageShots");
    if(shots)new MutationObserver(()=>paint()).observe(shots,{childList:true,subtree:true});
    document.addEventListener("click",e=>{if(e.target.closest("#stageList .stage-btn"))setTimeout(paint,180);},true);
    return;
  }
}
bridgeTimer=setInterval(start,120);
start();
