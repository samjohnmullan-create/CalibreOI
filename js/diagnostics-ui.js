import { loadState, saveState, current } from "./store.js?v=25";
import { STAGE_COPY } from "./stages.js?v=10";
import { suggestionsFor } from "./diagnostics.js?v=1";

const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let rendering=false, scheduled=false;
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));

async function fresh(){
  const state=await loadState();
  return {state,job:current(state)};
}
function stepForText(stageName,text){
  const defs=STAGE_COPY[stageName]?.steps||[];
  for(let i=0;i<defs.length;i++){
    const o=typeof defs[i]==="string"?{id:String(i),text:defs[i]}:defs[i];
    if(o.text===text)return o;
  }
  return null;
}
function answerFor(stage,step){
  const c=stage?.checks||{};
  return c[step.id]??"";
}
function diagKey(stageName,stepId,faultId){return `${stageName}::${stepId}::${faultId}`;}
function statusLabel(v){return v==="confirmed"?"Confirmed":v==="ruledout"?"Ruled out":"Possible";}
function ensureDiag(job){if(!Array.isArray(job.diagnosticFaults))job.diagnosticFaults=[];return job.diagnosticFaults;}
function upsertDiag(job,data,status){
  const arr=ensureDiag(job), key=diagKey(data.stage,data.stepId,data.id);
  let hit=arr.find(x=>x.key===key);
  if(!hit){hit={key,id:data.id,text:data.text,category:data.category||"General",severity:data.severity||"Moderate",sourceStage:data.stage,sourceCheck:data.stepId,sourceQuestion:data.question,status,createdAt:new Date().toISOString()};arr.push(hit);}else hit.status=status;
  hit.updatedAt=new Date().toISOString();
  if(status==="confirmed"){
    job.faults=Array.isArray(job.faults)?job.faults:[];
    const existing=job.faults.find(f=>f.text===data.text);
    if(existing) existing.severity=data.severity||existing.severity||"Moderate";
    else job.faults.push({text:data.text,severity:data.severity||"Moderate"});
  } else if(status==="ruledout" && Array.isArray(job.faults)) {
    job.faults=job.faults.filter(f=>f.text!==data.text);
  }
}

async function setFaultStatus(data,status){
  const {state,job}=await fresh(); if(!job)return;
  upsertDiag(job,data,status);
  await saveState(state);
  scheduleRender(20);
}
async function removeDiag(key){
  const {state,job}=await fresh(); if(!job)return;
  const arr=ensureDiag(job); const hit=arr.find(x=>x.key===key);
  job.diagnosticFaults=arr.filter(x=>x.key!==key);
  if(hit?.status==="confirmed"&&Array.isArray(job.faults)) job.faults=job.faults.filter(f=>f.text!==hit.text);
  await saveState(state); scheduleRender(20);
}

function suggestionPanel(stageName,step,question,answer,suggestions,known){
  const wrap=document.createElement("div"); wrap.className="diagnostic-panel";
  const title=document.createElement("div"); title.className="diagnostic-title"; title.textContent="Possible causes to investigate"; wrap.appendChild(title);
  suggestions.forEach(f=>{
    const key=diagKey(stageName,step.id,f.id), saved=known.find(x=>x.key===key);
    const row=document.createElement("div"); row.className="diagnostic-item";
    row.innerHTML=`<div class="diagnostic-copy"><strong>${esc(f.text)}</strong><span>${esc(f.category||"General")}${saved?" · "+statusLabel(saved.status):""}</span></div><div class="diagnostic-actions"></div>`;
    const actions=row.querySelector(".diagnostic-actions");
    [["possible","Possible"],["confirmed","Confirm"],["ruledout","Rule out"]].forEach(([value,label])=>{const b=document.createElement("button");b.type="button";b.className="diag-btn"+(saved?.status===value?" on":"");b.textContent=label;b.onclick=e=>{e.preventDefault();e.stopPropagation();setFaultStatus({...f,stage:stageName,stepId:step.id,question},value);};actions.appendChild(b);});
    wrap.appendChild(row);
  });
  const note=document.createElement("div"); note.className="diagnostic-note"; note.textContent="Suggestions are diagnostic leads, not automatic diagnoses."; wrap.appendChild(note);
  return wrap;
}

function renderFaultRegister(job){
  const root=document.getElementById("faults"); if(!root)return;
  const all=ensureDiag(job); const active=all.filter(x=>x.status!=="ruledout"), ruled=all.filter(x=>x.status==="ruledout");
  root.innerHTML=`<h3>Faults for this watch</h3><p class="muted small">Built from the checks on this job. Confirm a fault only after you have verified it.</p><div id="diagActive"></div>${ruled.length?`<details class="diag-ruled"><summary>Ruled out · ${ruled.length}</summary><div id="diagRuled"></div></details>`:""}<div class="diag-manual"><input id="diagManualText" placeholder="Add a fault specific to this watch"><button id="diagManualAdd" class="btn secondary" type="button">Add</button></div>`;
  const paintList=(el,items)=>{if(!el)return;el.innerHTML=items.length?items.map(x=>`<div class="fault-register-row"><div><strong>${esc(x.text)}</strong><span>${esc(x.category||"General")} · ${statusLabel(x.status)}<br><small>From: ${esc(x.sourceStage||"Manual")} ${x.sourceQuestion?"— "+esc(x.sourceQuestion):""}</small></span></div><button class="textbtn diag-remove" data-key="${esc(x.key)}" type="button">Remove</button></div>`).join(""):`<p class="muted small">No check-linked faults recorded yet.</p>`;};
  paintList(root.querySelector("#diagActive"),active); paintList(root.querySelector("#diagRuled"),ruled);
  root.querySelectorAll(".diag-remove").forEach(b=>b.onclick=()=>removeDiag(b.dataset.key));
  const add=root.querySelector("#diagManualAdd"); if(add)add.onclick=async()=>{const input=root.querySelector("#diagManualText"),text=input.value.trim();if(!text)return;const {state,job:freshJob}=await fresh();const arr=ensureDiag(freshJob);const key=`manual::${Date.now()}`;arr.push({key,id:key,text,category:"Manual",severity:"Moderate",sourceStage:"Manual",sourceCheck:"manual",sourceQuestion:"Added manually",status:"confirmed",createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()});freshJob.faults=Array.isArray(freshJob.faults)?freshJob.faults:[];freshJob.faults.push({text,severity:"Moderate"});await saveState(state);scheduleRender(20);};
}

async function render(){
  if(rendering)return; rendering=true;
  try{
    const {job}=await fresh(); if(!job)return;
    const stage=job.stages?.[job.stage]; if(!stage)return; const stageName=stage.name;
    const known=ensureDiag(job), rows=[...document.querySelectorAll("#steps .yn")];
    rows.forEach(row=>{
      row.querySelectorAll(".diagnostic-panel").forEach(x=>x.remove());
      const q=row.querySelector("p")?.textContent||"", step=stepForText(stageName,q); if(!step)return;
      const ans=answerFor(stage,step), suggestions=suggestionsFor(stageName,step.id,ans); if(!suggestions.length)return;
      row.appendChild(suggestionPanel(stageName,step,q,ans,suggestions,known));
    });
    renderFaultRegister(job);
  }catch(err){console.warn("Calibre diagnostics",err);}finally{rendering=false;}
}
function scheduleRender(delay=80){if(scheduled)return;scheduled=true;setTimeout(()=>{scheduled=false;render();},delay);}

function start(){
  const steps=document.getElementById("steps"), faults=document.getElementById("faults"); if(!steps||!faults){setTimeout(start,120);return;}
  const obs=new MutationObserver(()=>scheduleRender()); obs.observe(steps,{childList:true,subtree:true}); obs.observe(faults,{childList:true,subtree:true});
  document.addEventListener("click",e=>{if(e.target.closest("#steps .yn-btns button,.stage-btn,.type"))scheduleRender(180);});
  scheduleRender(120);
}
start();
