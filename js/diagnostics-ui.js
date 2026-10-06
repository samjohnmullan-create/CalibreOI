import { loadState, saveState, current } from "./store.js?v=25";
import { STAGE_COPY } from "./stages.js?v=10";
import { suggestionsFor } from "./diagnostics.js?v=1";

const style=document.createElement("style");
style.textContent=`
.diagnostic-panel{flex:1 1 100%;margin:8px 0 2px;padding:10px;border:1px solid var(--line);border-left:3px solid var(--brass);border-radius:8px;background:var(--surface-2)}
.diagnostic-title{font-size:.7rem;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:var(--muted);margin-bottom:7px}
.diagnostic-item{display:flex;justify-content:space-between;gap:10px;align-items:center;padding:7px 0;border-top:1px solid var(--line)}
.diagnostic-item:first-of-type{border-top:0}.diagnostic-copy{display:grid;gap:2px;min-width:0}.diagnostic-copy strong{font-size:.82rem}.diagnostic-copy span{font-size:.68rem;color:var(--muted)}
.diagnostic-actions{display:flex;gap:4px;flex-wrap:wrap;justify-content:flex-end}.diag-btn{border:1px solid var(--line);background:var(--surface);color:var(--muted);border-radius:6px;padding:5px 7px;font-size:.66rem;font-weight:700}.diag-btn.on{border-color:var(--brass);color:var(--ink);box-shadow:inset 0 0 0 1px var(--brass)}
.diagnostic-note{font-size:.64rem;color:var(--muted);margin-top:7px}.fault-register-row{display:flex;justify-content:space-between;gap:10px;align-items:start;padding:10px 0;border-bottom:1px solid var(--line)}.fault-register-row>div{display:grid;gap:3px}.fault-register-row span{font-size:.72rem;color:var(--muted)}.fault-register-row small{font-size:.66rem}.diag-ruled{margin-top:10px}.diag-ruled summary{cursor:pointer;color:var(--muted);font-size:.75rem;font-weight:700}.diag-manual{display:flex;gap:8px;margin-top:12px}.diag-manual input{flex:1}.diag-manual .btn{white-space:nowrap}
@media(max-width:640px){.diagnostic-item{align-items:stretch;flex-direction:column}.diagnostic-actions{justify-content:flex-start}.diag-manual{flex-direction:column}}
`;
document.head.appendChild(style);

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
function answerFor(stage,step){const c=stage?.checks||{};return c[step.id]??"";}
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
    if(existing)existing.severity=data.severity||existing.severity||"Moderate";else job.faults.push({text:data.text,severity:data.severity||"Moderate"});
  }else if(status==="ruledout"&&Array.isArray(job.faults))job.faults=job.faults.filter(f=>f.text!==data.text);
}
async function setFaultStatus(data,status){const {state,job}=await fresh();if(!job)return;upsertDiag(job,data,status);await saveState(state);scheduleRender(20);}
async function removeDiag(key){const {state,job}=await fresh();if(!job)return;const arr=ensureDiag(job),hit=arr.find(x=>x.key===key);job.diagnosticFaults=arr.filter(x=>x.key!==key);if(hit?.status==="confirmed"&&Array.isArray(job.faults))job.faults=job.faults.filter(f=>f.text!==hit.text);await saveState(state);scheduleRender(20);}

function suggestionPanel(stageName,step,question,suggestions,known){
  const wrap=document.createElement("div");wrap.className="diagnostic-panel";
  const title=document.createElement("div");title.className="diagnostic-title";title.textContent="Possible causes to investigate";wrap.appendChild(title);
  suggestions.forEach(f=>{
    const key=diagKey(stageName,step.id,f.id),saved=known.find(x=>x.key===key),row=document.createElement("div");row.className="diagnostic-item";
    row.innerHTML=`<div class="diagnostic-copy"><strong>${esc(f.text)}</strong><span>${esc(f.category||"General")}${saved?" · "+statusLabel(saved.status):""}</span></div><div class="diagnostic-actions"></div>`;
    const actions=row.querySelector(".diagnostic-actions");
    [["possible","Possible"],["confirmed","Confirm"],["ruledout","Rule out"]].forEach(([value,label])=>{const b=document.createElement("button");b.type="button";b.className="diag-btn"+(saved?.status===value?" on":"");b.textContent=label;b.onclick=e=>{e.preventDefault();e.stopPropagation();setFaultStatus({...f,stage:stageName,stepId:step.id,question},value);};actions.appendChild(b);});
    wrap.appendChild(row);
  });
  const note=document.createElement("div");note.className="diagnostic-note";note.textContent="Diagnostic leads only — confirm after inspection.";wrap.appendChild(note);return wrap;
}

function renderFaultRegister(job){
  const root=document.getElementById("faults");if(!root)return;
  const all=ensureDiag(job),active=all.filter(x=>x.status!=="ruledout"),ruled=all.filter(x=>x.status==="ruledout");
  root.innerHTML=`<h3>Faults for this watch</h3><p class="muted small">Only faults raised from this job's checks, plus anything you add manually.</p><div id="diagActive"></div>${ruled.length?`<details class="diag-ruled"><summary>Ruled out · ${ruled.length}</summary><div id="diagRuled"></div></details>`:""}<div class="diag-manual"><input id="diagManualText" placeholder="Add a fault specific to this watch"><button id="diagManualAdd" class="btn secondary" type="button">Add</button></div>`;
  const paintList=(el,items)=>{if(!el)return;el.innerHTML=items.length?items.map(x=>`<div class="fault-register-row"><div><strong>${esc(x.text)}</strong><span>${esc(x.category||"General")} · ${statusLabel(x.status)}<br><small>From: ${esc(x.sourceStage||"Manual")} ${x.sourceQuestion?"— "+esc(x.sourceQuestion):""}</small></span></div><button class="textbtn diag-remove" data-key="${esc(x.key)}" type="button">Remove</button></div>`).join(""):`<p class="muted small">No relevant faults recorded yet.</p>`;};
  paintList(root.querySelector("#diagActive"),active);paintList(root.querySelector("#diagRuled"),ruled);
  root.querySelectorAll(".diag-remove").forEach(b=>b.onclick=()=>removeDiag(b.dataset.key));
  const add=root.querySelector("#diagManualAdd");if(add)add.onclick=async()=>{const input=root.querySelector("#diagManualText"),text=input.value.trim();if(!text)return;const {state,job:freshJob}=await fresh(),arr=ensureDiag(freshJob),key=`manual::${Date.now()}`;arr.push({key,id:key,text,category:"Manual",severity:"Moderate",sourceStage:"Manual",sourceCheck:"manual",sourceQuestion:"Added manually",status:"confirmed",createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()});freshJob.faults=Array.isArray(freshJob.faults)?freshJob.faults:[];freshJob.faults.push({text,severity:"Moderate"});await saveState(state);scheduleRender(20);};
}

async function render(){
  if(rendering)return;rendering=true;
  try{
    const {job}=await fresh();if(!job)return;const stage=job.stages?.[job.stage];if(!stage)return;const stageName=stage.name,known=ensureDiag(job),rows=[...document.querySelectorAll("#steps .yn")];
    rows.forEach(row=>{row.querySelectorAll(".diagnostic-panel").forEach(x=>x.remove());const q=row.querySelector("p")?.textContent||"",step=stepForText(stageName,q);if(!step)return;const ans=answerFor(stage,step),suggestions=suggestionsFor(stageName,step.id,ans);if(!suggestions.length)return;row.appendChild(suggestionPanel(stageName,step,q,suggestions,known));});
    renderFaultRegister(job);
  }catch(err){console.warn("Calibre diagnostics",err);}finally{rendering=false;}
}
function scheduleRender(delay=80){if(scheduled)return;scheduled=true;setTimeout(()=>{scheduled=false;render();},delay);}
function start(){const steps=document.getElementById("steps"),faults=document.getElementById("faults");if(!steps||!faults){setTimeout(start,120);return;}const obs=new MutationObserver(()=>scheduleRender());obs.observe(steps,{childList:true,subtree:true});obs.observe(faults,{childList:true,subtree:true});document.addEventListener("click",e=>{if(e.target.closest("#steps .yn-btns button,.stage-btn,.type"))scheduleRender(180);});scheduleRender(120);}
start();
