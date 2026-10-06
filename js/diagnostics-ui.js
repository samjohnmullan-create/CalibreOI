import { loadState, saveState, current } from "./store.js?v=25";
import { STAGE_COPY } from "./stages.js?v=10";
import { suggestionsFor } from "./diagnostics.js?v=1";

const style=document.createElement("style");
style.textContent=`
.diagnostic-panel{flex:1 1 100%;margin:8px 0 2px;padding:10px;border:1px solid var(--line);border-left:3px solid var(--brass);border-radius:8px;background:var(--surface-2)}
.diagnostic-title{font-size:.7rem;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:var(--muted);margin-bottom:7px}
.diagnostic-item{display:flex;justify-content:space-between;gap:10px;align-items:center;padding:8px 0;border-top:1px solid var(--line)}
.diagnostic-item:first-of-type{border-top:0}.diagnostic-copy{display:grid;gap:2px;min-width:0}.diagnostic-copy strong{font-size:.82rem}.diagnostic-copy span{font-size:.68rem;color:var(--muted)}
.diagnostic-actions{display:flex;gap:4px;flex-wrap:wrap;justify-content:flex-end}.diag-btn{border:1px solid var(--line);background:var(--surface);color:var(--muted);border-radius:6px;padding:6px 8px;font-size:.66rem;font-weight:700}.diag-btn.on{border-color:var(--brass);color:var(--ink);box-shadow:inset 0 0 0 1px var(--brass)}
.diagnostic-note{font-size:.64rem;color:var(--muted);margin-top:7px}.fault-register-row{display:flex;justify-content:space-between;gap:10px;align-items:start;padding:10px 0;border-bottom:1px solid var(--line)}.fault-register-row>div{display:grid;gap:3px}.fault-register-row span{font-size:.72rem;color:var(--muted)}.fault-register-row small{font-size:.66rem}.fault-status{font-size:.64rem;font-weight:800;letter-spacing:.03em;text-transform:uppercase}.diag-ruled{margin-top:10px}.diag-ruled summary{cursor:pointer;color:var(--muted);font-size:.75rem;font-weight:700}.diag-manual{display:flex;gap:8px;margin-top:12px}.diag-manual input{flex:1}.diag-manual .btn{white-space:nowrap}
@media(max-width:640px){.diagnostic-item{align-items:stretch;flex-direction:column}.diagnostic-actions{justify-content:flex-start}.diag-manual{flex-direction:column}}
`;
document.head.appendChild(style);

const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
const stepObj=(step,i)=>typeof step==="string"?{id:String(i),text:step}:step;
const diagKey=(stageName,stepId,faultId)=>`${stageName}::${stepId}::${faultId}`;
const statusLabel=v=>v==="confirmed"?"Confirmed":v==="ruledout"?"Ruled out":"Possible";
function ensureDiag(job){if(!Array.isArray(job.diagnosticFaults))job.diagnosticFaults=[];return job.diagnosticFaults;}
async function fresh(){const state=await loadState();return {state,job:current(state)};}

function addPossible(job,stageName,step,question,fault){
  const arr=ensureDiag(job),key=diagKey(stageName,step.id,fault.id);
  if(arr.some(x=>x.key===key)) return false;
  arr.push({key,id:fault.id,text:fault.text,category:fault.category||"General",severity:fault.severity||"Moderate",sourceStage:stageName,sourceCheck:step.id,sourceQuestion:question,status:"possible",createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()});
  return true;
}

function syncPossibleFaults(job){
  let changed=false;
  for(const stage of job.stages||[]){
    const defs=STAGE_COPY[stage.name]?.steps||[];
    const checks=stage.checks||{};
    defs.forEach((raw,i)=>{
      const step=stepObj(raw,i),ans=checks[step.id]??checks[i]??"";
      if(!ans)return;
      const suggestions=suggestionsFor(stage.name,step.id,ans);
      suggestions.forEach(f=>{if(addPossible(job,stage.name,step,step.text,f))changed=true;});
    });
  }
  return changed;
}

function syncConfirmedFaultList(job){
  const confirmed=ensureDiag(job).filter(x=>x.status==="confirmed");
  const manual=(job.faults||[]).filter(f=>!confirmed.some(x=>x.text===f.text));
  job.faults=[...manual,...confirmed.map(x=>({text:x.text,severity:x.severity||"Moderate"}))];
}

async function setFaultStatus(key,status){
  const {state,job}=await fresh();if(!job)return;
  syncPossibleFaults(job);
  const hit=ensureDiag(job).find(x=>x.key===key);if(!hit)return;
  hit.status=status;hit.updatedAt=new Date().toISOString();syncConfirmedFaultList(job);
  await saveState(state);await render();
}
async function removeDiag(key){
  const {state,job}=await fresh();if(!job)return;
  job.diagnosticFaults=ensureDiag(job).filter(x=>x.key!==key);syncConfirmedFaultList(job);await saveState(state);await render();
}

function panelFor(stageName,step,suggestions,known){
  const wrap=document.createElement("div");wrap.className="diagnostic-panel";
  wrap.innerHTML=`<div class="diagnostic-title">Possible faults added to this job</div>`;
  suggestions.forEach(f=>{
    const key=diagKey(stageName,step.id,f.id),saved=known.find(x=>x.key===key);
    const row=document.createElement("div");row.className="diagnostic-item";
    row.innerHTML=`<div class="diagnostic-copy"><strong>${esc(f.text)}</strong><span>${esc(f.category||"General")} · <span class="fault-status">${statusLabel(saved?.status||"possible")}</span></span></div><div class="diagnostic-actions"></div>`;
    const actions=row.querySelector(".diagnostic-actions");
    [["possible","Possible"],["confirmed","Confirm"],["ruledout","Rule out"]].forEach(([value,label])=>{
      const b=document.createElement("button");b.type="button";b.className="diag-btn"+(saved?.status===value?" on":"");b.textContent=label;
      b.addEventListener("click",async e=>{e.preventDefault();e.stopPropagation();b.disabled=true;await setFaultStatus(key,value);});actions.appendChild(b);
    });
    wrap.appendChild(row);
  });
  const note=document.createElement("div");note.className="diagnostic-note";note.textContent="These stay on the job until you confirm, rule out or remove them.";wrap.appendChild(note);
  return wrap;
}

function renderRegister(root,job){
  const all=ensureDiag(job),active=all.filter(x=>x.status!=="ruledout"),ruled=all.filter(x=>x.status==="ruledout");
  root.innerHTML=`<h3>Faults to investigate · ${active.length}</h3><p class="muted small">This list carries through the whole job. Possible faults are added automatically from abnormal answers.</p><div id="diagActive"></div>${ruled.length?`<details class="diag-ruled"><summary>Ruled out · ${ruled.length}</summary><div id="diagRuled"></div></details>`:""}<div class="diag-manual"><input id="diagManualText" placeholder="Add another fault or observation"><button id="diagManualAdd" class="btn secondary" type="button">Add</button></div>`;
  const paint=(el,items)=>{if(!el)return;el.innerHTML=items.length?items.map(x=>`<div class="fault-register-row"><div><strong>${esc(x.text)}</strong><span>${esc(x.category||"General")} · ${statusLabel(x.status)}<br><small>Raised at ${esc(x.sourceStage||"Manual")}${x.sourceQuestion?" — "+esc(x.sourceQuestion):""}</small></span></div><div class="diagnostic-actions"><button class="diag-btn${x.status==="possible"?" on":""}" data-action="possible" data-key="${esc(x.key)}" type="button">Possible</button><button class="diag-btn${x.status==="confirmed"?" on":""}" data-action="confirmed" data-key="${esc(x.key)}" type="button">Confirm</button><button class="diag-btn" data-action="ruledout" data-key="${esc(x.key)}" type="button">Rule out</button><button class="diag-btn diag-remove" data-key="${esc(x.key)}" type="button">Remove</button></div></div>`).join(""):`<p class="muted small">No faults suggested yet.</p>`;};
  paint(root.querySelector("#diagActive"),active);paint(root.querySelector("#diagRuled"),ruled);
  root.querySelectorAll("[data-action]").forEach(b=>b.addEventListener("click",async()=>{b.disabled=true;await setFaultStatus(b.dataset.key,b.dataset.action);}));
  root.querySelectorAll(".diag-remove").forEach(b=>b.addEventListener("click",async()=>{b.disabled=true;await removeDiag(b.dataset.key);}));
  const add=root.querySelector("#diagManualAdd");if(add)add.addEventListener("click",async()=>{const input=root.querySelector("#diagManualText"),text=input.value.trim();if(!text)return;const {state,job:freshJob}=await fresh(),arr=ensureDiag(freshJob),key=`manual::${Date.now()}`;arr.push({key,id:key,text,category:"Manual",severity:"Moderate",sourceStage:"Manual",sourceCheck:"manual",sourceQuestion:"Added manually",status:"confirmed",createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()});syncConfirmedFaultList(freshJob);await saveState(state);await render();});
}

let rendering=false;
async function render(){
  if(rendering)return;rendering=true;
  try{
    const {state,job}=await fresh();if(!job)return;
    const changed=syncPossibleFaults(job);if(changed){syncConfirmedFaultList(job);await saveState(state);}
    const stage=job.stages?.[job.stage];if(!stage)return;const defs=STAGE_COPY[stage.name]?.steps||[],checks=stage.checks||{},known=ensureDiag(job);
    document.querySelectorAll("#steps .yn").forEach(row=>row.querySelectorAll(".diagnostic-panel").forEach(x=>x.remove()));
    const rows=[...document.querySelectorAll("#steps .yn")];
    rows.forEach(row=>{
      const q=row.querySelector("p")?.textContent||"";const i=defs.findIndex((x,n)=>stepObj(x,n).text===q);if(i<0)return;
      const step=stepObj(defs[i],i),ans=checks[step.id]??checks[i]??"",suggestions=suggestionsFor(stage.name,step.id,ans);if(!suggestions.length)return;
      row.appendChild(panelFor(stage.name,step,suggestions,known));
    });
    const root=document.getElementById("faults");if(root)renderRegister(root,job);
  }catch(err){console.warn("Calibre diagnostics",err);}finally{rendering=false;}
}

let timer;
function schedule(delay=120){clearTimeout(timer);timer=setTimeout(render,delay);}
function start(){
  const steps=document.getElementById("steps"),faults=document.getElementById("faults");if(!steps||!faults){setTimeout(start,120);return;}
  const obs=new MutationObserver(()=>schedule(80));obs.observe(steps,{childList:true,subtree:true});
  document.addEventListener("click",e=>{if(e.target.closest("#steps .yn-btns button,.stage-btn,.type"))schedule(220);});
  document.addEventListener("change",()=>schedule(180));
  schedule(120);
}
start();
