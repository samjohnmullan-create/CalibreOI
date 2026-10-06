import { loadState, saveState, current } from "./store.js?v=25";
import { STAGE_COPY } from "./stages.js?v=10";
import { suggestionsFor } from "./diagnostics.js?v=1";

const style=document.createElement("style");
style.textContent=`
.diagnostic-panel{flex:1 1 100%;margin:8px 0 2px;padding:10px;border:1px solid var(--line);border-left:3px solid var(--brass);border-radius:8px;background:var(--surface-2)}
.diagnostic-title{font-size:.7rem;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:var(--muted);margin-bottom:7px}
.diagnostic-item{display:flex;justify-content:space-between;gap:10px;align-items:center;padding:8px 0;border-top:1px solid var(--line)}
.diagnostic-item:first-of-type{border-top:0}.diagnostic-copy{display:grid;gap:2px;min-width:0}.diagnostic-copy strong{font-size:.82rem}.diagnostic-copy span{font-size:.68rem;color:var(--muted)}
.diagnostic-actions{display:flex;gap:4px;flex-wrap:wrap;justify-content:flex-end}.diag-btn{border:1px solid var(--line);background:var(--surface);color:var(--muted);border-radius:6px;padding:6px 8px;font-size:.66rem;font-weight:700;cursor:pointer}.diag-btn.on{border-color:var(--brass);color:var(--ink);box-shadow:inset 0 0 0 1px var(--brass)}.diag-btn:disabled{opacity:.55;cursor:wait}
.diagnostic-note{font-size:.64rem;color:var(--muted);margin-top:7px}.fault-register-row{display:flex;justify-content:space-between;gap:10px;align-items:start;padding:10px 0;border-bottom:1px solid var(--line)}.fault-register-row>div{display:grid;gap:3px}.fault-register-row span{font-size:.72rem;color:var(--muted)}.fault-register-row small{font-size:.66rem}.fault-status{font-size:.64rem;font-weight:800;letter-spacing:.03em;text-transform:uppercase}.diag-ruled{margin-top:10px}.diag-ruled summary{cursor:pointer;color:var(--muted);font-size:.75rem;font-weight:700}.diag-manual{display:flex;gap:8px;margin-top:12px}.diag-manual input{flex:1}.diag-manual .btn{white-space:nowrap}
.stage-btn.diag-relevant{border-color:var(--brass);box-shadow:inset 0 -2px 0 var(--brass)}.stage-fault-count{position:absolute;top:8px;left:9px;font-size:.6rem;font-weight:800;letter-spacing:.02em;color:var(--brass-soft);background:var(--surface-2);border:1px solid var(--line);border-radius:999px;padding:3px 6px}.stage-btn.active .stage-fault-count{background:var(--surface)}
.stage-relevance{margin:12px 0 4px;padding:11px 12px;border:1px solid var(--line);border-left:3px solid var(--brass);border-radius:8px;background:var(--surface-2)}.stage-relevance h3{margin:0 0 6px;font-size:.8rem}.stage-relevance p{margin:0 0 7px}.stage-relevance ul{margin:0;padding-left:18px}.stage-relevance li{margin:4px 0;font-size:.75rem}.stage-relevance .fault-state{color:var(--muted);font-size:.66rem;text-transform:uppercase;font-weight:800}
@media(max-width:640px){.diagnostic-item{align-items:stretch;flex-direction:column}.diagnostic-actions{justify-content:flex-start}.diag-manual{flex-direction:column}}
`;
document.head.appendChild(style);

const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
const stepObj=(step,i)=>typeof step==="string"?{id:String(i),text:step}:step;
const diagKey=(stageName,stepId,faultId)=>`${stageName}::${stepId}::${faultId}`;
const statusLabel=v=>v==="confirmed"?"Confirmed":v==="ruledout"?"Ruled out":"Possible";
function ensureDiag(job){if(!Array.isArray(job.diagnosticFaults))job.diagnosticFaults=[];return job.diagnosticFaults;}
async function fresh(){const state=await loadState();return {state,job:current(state)};}

const CATEGORY_STAGES={
  Power:["Dismantling & inspection","Cleaning & parts inspection","Repairs & parts","Reassembly & lubrication","Balance & beat","Final QC"],
  Winding:["Dismantling & inspection","Repairs & parts","Reassembly & lubrication","Casing & function","Final QC"],
  Setting:["Dismantling & inspection","Repairs & parts","Reassembly & lubrication","Casing & function","Final QC"],
  "Keyless works":["Dismantling & inspection","Repairs & parts","Reassembly & lubrication","Casing & function","Final QC"],
  Barrel:["Dismantling & inspection","Cleaning & parts inspection","Repairs & parts","Reassembly & lubrication","Final QC"],
  Mainspring:["Dismantling & inspection","Cleaning & parts inspection","Repairs & parts","Reassembly & lubrication","Final QC"],
  Train:["Dismantling & inspection","Cleaning & parts inspection","Repairs & parts","Reassembly & lubrication","Train & escapement","Regulation","Final QC"],
  Escapement:["Dismantling & inspection","Cleaning & parts inspection","Repairs & parts","Reassembly & lubrication","Train & escapement","Balance & beat","Regulation"],
  Balance:["Dismantling & inspection","Cleaning & parts inspection","Repairs & parts","Reassembly & lubrication","Balance & beat","Regulation","Final QC"],
  Hairspring:["Dismantling & inspection","Cleaning & parts inspection","Repairs & parts","Reassembly & lubrication","Balance & beat","Regulation"],
  Timing:["Pre-service timing","Balance & beat","Regulation","Final QC"],
  Automatic:["Automatic works","Final QC"],
  "Automatic winding":["Automatic works","Final QC"],
  Lubrication:["Reassembly & lubrication","Train & escapement","Balance & beat","Regulation"],
  Jewels:["Dismantling & inspection","Cleaning & parts inspection","Repairs & parts","Reassembly & lubrication","Balance & beat"],
  Pivots:["Dismantling & inspection","Cleaning & parts inspection","Repairs & parts","Reassembly & lubrication","Train & escapement"],
  Case:["Uncasing","Case / hands / crystal","Casing & function","Final QC"],
  Casing:["Uncasing","Case / hands / crystal","Casing & function","Final QC"],
  Hands:["Case / hands / crystal","Casing & function","Final QC"],
  Dial:["Case / hands / crystal","Casing & function","Final QC"],
  Calendar:["Dismantling & inspection","Repairs & parts","Reassembly & lubrication","Casing & function","Final QC"],
  Quartz:["Battery & electrical","Movement inspection","Cleaning & contacts","Repair & reassembly","Hands & calendar","Casing & function","Final QC"],
  Parts:["Cleaning & parts inspection","Repairs & parts"],
  General:["Dismantling & inspection","Cleaning & parts inspection","Repairs & parts","Final QC"]
};
function targetStages(fault){return CATEGORY_STAGES[fault.category]||CATEGORY_STAGES.General;}
function activeFaults(job){return ensureDiag(job).filter(f=>f.status!=="ruledout");}
function relevanceByStage(job){
  const map={};
  activeFaults(job).forEach(f=>targetStages(f).forEach(stage=>{(map[stage]||(map[stage]=[])).push(f);}));
  return map;
}

function addPossible(job,stageName,step,question,fault){
  const arr=ensureDiag(job),key=diagKey(stageName,step.id,fault.id);
  if(arr.some(x=>x.key===key))return false;
  arr.push({key,id:fault.id,text:fault.text,category:fault.category||"General",severity:fault.severity||"Moderate",sourceStage:stageName,sourceCheck:step.id,sourceQuestion:question,status:"possible",createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()});
  return true;
}
function syncPossibleFaults(job){
  let changed=false;
  for(const stage of job.stages||[]){
    const defs=STAGE_COPY[stage.name]?.steps||[],checks=stage.checks||{};
    defs.forEach((raw,i)=>{
      const step=stepObj(raw,i),ans=checks[step.id]??checks[i]??"";
      if(!ans)return;
      suggestionsFor(stage.name,step.id,ans).forEach(f=>{if(addPossible(job,stage.name,step,step.text,f))changed=true;});
    });
  }
  return changed;
}
function syncConfirmedFaultList(job){
  const confirmed=ensureDiag(job).filter(x=>x.status==="confirmed");
  const diagnosticTexts=new Set(ensureDiag(job).map(x=>x.text));
  const manual=(job.faults||[]).filter(f=>!diagnosticTexts.has(f.text));
  job.faults=[...manual,...confirmed.map(x=>({text:x.text,severity:x.severity||"Moderate"}))];
}

let writeBusy=false;
async function persistStatus(key,status,button){
  if(writeBusy)return;
  writeBusy=true;
  try{
    if(button)button.disabled=true;
    const {state,job}=await fresh();
    if(!job)throw new Error("No open job");
    syncPossibleFaults(job);
    const hit=ensureDiag(job).find(x=>x.key===key);
    if(!hit)throw new Error("Fault record was not found");
    hit.status=status;
    hit.updatedAt=new Date().toISOString();
    syncConfirmedFaultList(job);
    await saveState(state);
    const statusText=document.getElementById("statusText");
    if(statusText)statusText.textContent=`${hit.text}: ${statusLabel(status)}`;
    await render(true);
  }catch(err){
    console.error("Calibre fault status",err);
    const statusText=document.getElementById("statusText");
    if(statusText)statusText.textContent="Could not update fault: "+(err.message||err);
  }finally{
    writeBusy=false;
    if(button&&button.isConnected)button.disabled=false;
  }
}
async function removeDiag(key,button){
  if(writeBusy)return;writeBusy=true;
  try{
    if(button)button.disabled=true;
    const {state,job}=await fresh();if(!job)return;
    job.diagnosticFaults=ensureDiag(job).filter(x=>x.key!==key);syncConfirmedFaultList(job);await saveState(state);await render(true);
  }finally{writeBusy=false;if(button&&button.isConnected)button.disabled=false;}
}

function actionButtons(key,status){
  return `<div class="diagnostic-actions">
    <button class="diag-btn${status==="possible"?" on":""}" data-diag-action="possible" data-diag-key="${esc(key)}" type="button">Possible</button>
    <button class="diag-btn${status==="confirmed"?" on":""}" data-diag-action="confirmed" data-diag-key="${esc(key)}" type="button">Confirm</button>
    <button class="diag-btn${status==="ruledout"?" on":""}" data-diag-action="ruledout" data-diag-key="${esc(key)}" type="button">Rule out</button>
  </div>`;
}
function panelFor(stageName,step,suggestions,known){
  const wrap=document.createElement("div");wrap.className="diagnostic-panel";
  wrap.innerHTML=`<div class="diagnostic-title">Possible faults added to this job</div>`;
  suggestions.forEach(f=>{
    const key=diagKey(stageName,step.id,f.id),saved=known.find(x=>x.key===key),status=saved?.status||"possible";
    const row=document.createElement("div");row.className="diagnostic-item";
    row.innerHTML=`<div class="diagnostic-copy"><strong>${esc(f.text)}</strong><span>${esc(f.category||"General")} · <span class="fault-status">${statusLabel(status)}</span></span></div>${actionButtons(key,status)}`;
    wrap.appendChild(row);
  });
  const note=document.createElement("div");note.className="diagnostic-note";note.textContent="These stay on the job until you confirm, rule out or remove them.";wrap.appendChild(note);return wrap;
}
function renderRegister(root,job){
  const all=ensureDiag(job),active=all.filter(x=>x.status!=="ruledout"),ruled=all.filter(x=>x.status==="ruledout");
  root.innerHTML=`<h3>Faults to investigate · ${active.length}</h3><p class="muted small">This list carries through the whole job. Possible faults are added automatically from abnormal answers.</p><div id="diagActive"></div>${ruled.length?`<details class="diag-ruled"><summary>Ruled out · ${ruled.length}</summary><div id="diagRuled"></div></details>`:""}<div class="diag-manual"><input id="diagManualText" placeholder="Add another fault or observation"><button id="diagManualAdd" class="btn secondary" type="button">Add</button></div>`;
  const paint=(el,items)=>{if(!el)return;el.innerHTML=items.length?items.map(x=>`<div class="fault-register-row"><div><strong>${esc(x.text)}</strong><span>${esc(x.category||"General")} · <span class="fault-status">${statusLabel(x.status)}</span><br><small>Raised at ${esc(x.sourceStage||"Manual")}${x.sourceQuestion?" — "+esc(x.sourceQuestion):""}</small></span></div><div>${actionButtons(x.key,x.status)}<button class="diag-btn diag-remove" data-diag-remove="1" data-diag-key="${esc(x.key)}" type="button">Remove</button></div></div>`).join(""):`<p class="muted small">No faults suggested yet.</p>`;};
  paint(root.querySelector("#diagActive"),active);paint(root.querySelector("#diagRuled"),ruled);
}
function paintStageRelevance(job){
  const map=relevanceByStage(job);
  document.querySelectorAll("#stageList .stage-btn").forEach(btn=>{
    btn.classList.remove("diag-relevant");btn.querySelectorAll(".stage-fault-count").forEach(x=>x.remove());
    const title=btn.querySelector(".stage-name")?.textContent||"";
    const key=Object.keys(STAGE_COPY).find(k=>(STAGE_COPY[k]?.title||k)===title)||title;
    const faults=map[key]||[];
    if(!faults.length)return;
    btn.classList.add("diag-relevant");
    const badge=document.createElement("span");badge.className="stage-fault-count";badge.textContent=`${faults.length} fault${faults.length===1?"":"s"}`;btn.appendChild(badge);
  });

  document.querySelectorAll(".stage-relevance").forEach(x=>x.remove());
  const stage=job.stages?.[job.stage];if(!stage)return;
  const faults=map[stage.name]||[];if(!faults.length)return;
  const box=document.createElement("div");box.className="stage-relevance";
  box.innerHTML=`<h3>Why this stage matters</h3><p class="muted small">These open faults point to checks in this stage:</p><ul>${faults.map(f=>`<li><strong>${esc(f.text)}</strong> <span class="fault-state">${statusLabel(f.status)}</span></li>`).join("")}</ul>`;
  const steps=document.getElementById("steps");if(steps)steps.parentNode.insertBefore(box,steps);
}

let rendering=false,pending=false;
async function render(force=false){
  if(rendering){pending=true;return;}
  rendering=true;
  try{
    const {state,job}=await fresh();if(!job)return;
    const changed=syncPossibleFaults(job);if(changed){syncConfirmedFaultList(job);await saveState(state);}
    const stage=job.stages?.[job.stage];if(!stage)return;const defs=STAGE_COPY[stage.name]?.steps||[],checks=stage.checks||{},known=ensureDiag(job);
    document.querySelectorAll("#steps .yn").forEach(row=>row.querySelectorAll(".diagnostic-panel").forEach(x=>x.remove()));
    [...document.querySelectorAll("#steps .yn")].forEach(row=>{
      const q=row.querySelector("p")?.textContent||"",i=defs.findIndex((x,n)=>stepObj(x,n).text===q);if(i<0)return;
      const step=stepObj(defs[i],i),ans=checks[step.id]??checks[i]??"",suggestions=suggestionsFor(stage.name,step.id,ans);if(!suggestions.length)return;
      row.appendChild(panelFor(stage.name,step,suggestions,known));
    });
    const root=document.getElementById("faults");if(root)renderRegister(root,job);
    paintStageRelevance(job);
  }catch(err){console.warn("Calibre diagnostics",err);}finally{
    rendering=false;
    if(pending){pending=false;setTimeout(()=>render(),20);}
  }
}

let timer;
function schedule(delay=120){clearTimeout(timer);timer=setTimeout(()=>render(),delay);}
function start(){
  const steps=document.getElementById("steps"),faults=document.getElementById("faults");if(!steps||!faults){setTimeout(start,120);return;}
  const obs=new MutationObserver(()=>schedule(80));obs.observe(steps,{childList:true,subtree:true});
  document.addEventListener("click",async e=>{
    const statusBtn=e.target.closest("[data-diag-action]");
    if(statusBtn){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();await persistStatus(statusBtn.dataset.diagKey,statusBtn.dataset.diagAction,statusBtn);return;}
    const removeBtn=e.target.closest("[data-diag-remove]");
    if(removeBtn){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();await removeDiag(removeBtn.dataset.diagKey,removeBtn);return;}
    const addBtn=e.target.closest("#diagManualAdd");
    if(addBtn){e.preventDefault();e.stopPropagation();const input=document.getElementById("diagManualText"),text=input?.value.trim();if(!text)return;const {state,job}=await fresh();const arr=ensureDiag(job),key=`manual::${Date.now()}`;arr.push({key,id:key,text,category:"Manual",severity:"Moderate",sourceStage:"Manual",sourceCheck:"manual",sourceQuestion:"Added manually",status:"confirmed",createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()});syncConfirmedFaultList(job);await saveState(state);await render(true);return;}
    if(e.target.closest("#steps .yn-btns button,.stage-btn,.type"))schedule(220);
  },true);
  document.addEventListener("change",()=>schedule(180));
  schedule(120);
}
start();
