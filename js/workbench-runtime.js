import { loadState, saveState, current } from "./store.js?v=26";
import { STAGE_COPY } from "./stages.js?v=10";
import { suggestionsFor } from "./diagnostics.js?v=1";
import { guidanceFor } from "./repair-guidance.js?v=1";

const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
const stepObj=(s,i)=>typeof s==="string"?{id:String(i),text:s}:s;
const keyFor=(stage,step,id)=>`${stage}::${step}::${id}`;
const label=s=>s==="confirmed"?"Confirmed":s==="ruledout"?"Ruled out":"Possible";
let paintTimer=0,painting=false,saving=new Set();

const CATEGORY_STAGES={
 Power:["Dismantling & inspection","Cleaning & parts inspection","Repairs & parts","Reassembly & lubrication","Balance & beat","Final QC"],
 Winding:["Dismantling & inspection","Repairs & parts","Reassembly & lubrication","Casing & function","Final QC"],
 Setting:["Dismantling & inspection","Repairs & parts","Reassembly & lubrication","Casing & function","Final QC"],
 Barrel:["Dismantling & inspection","Cleaning & parts inspection","Repairs & parts","Reassembly & lubrication","Final QC"],
 Train:["Dismantling & inspection","Cleaning & parts inspection","Repairs & parts","Reassembly & lubrication","Train & escapement","Regulation","Final QC"],
 Escapement:["Dismantling & inspection","Cleaning & parts inspection","Repairs & parts","Reassembly & lubrication","Train & escapement","Balance & beat","Regulation"],
 Balance:["Dismantling & inspection","Cleaning & parts inspection","Repairs & parts","Reassembly & lubrication","Balance & beat","Regulation","Final QC"],
 Timing:["Pre-service timing","Balance & beat","Regulation","Final QC"],
 Automatic:["Automatic works","Final QC"],
 Lubrication:["Reassembly & lubrication","Train & escapement","Balance & beat","Regulation"],
 Case:["Uncasing","Case / hands / crystal","Casing & function","Final QC"],
 Hands:["Case / hands / crystal","Casing & function","Final QC"],
 Dial:["Case / hands / crystal","Casing & function","Final QC"],
 Calendar:["Dismantling & inspection","Repairs & parts","Reassembly & lubrication","Casing & function","Final QC"],
 Quartz:["Battery & electrical","Movement inspection","Cleaning & contacts","Repair & reassembly","Hands & calendar","Casing & function","Final QC"],
 General:["Dismantling & inspection","Cleaning & parts inspection","Repairs & parts","Final QC"]
};

const style=document.createElement("style");
style.textContent=`
.wb-runtime-card{margin:12px 0;padding:11px 12px;border:1px solid var(--line);border-left:3px solid var(--brass);border-radius:8px;background:var(--surface-2)}
.wb-runtime-card h3{margin:0 0 7px}.diag-row{padding:11px 0;border-bottom:1px solid var(--line)}.diag-head{display:flex;justify-content:space-between;gap:10px;align-items:start}.diag-copy{display:grid;gap:3px}.diag-copy small{color:var(--muted)}
.diag-actions{display:flex;gap:5px;flex-wrap:wrap}.diag-action{min-height:34px;padding:6px 9px;border:1px solid var(--line);border-radius:6px;background:var(--surface);color:var(--muted);font-weight:700;cursor:pointer;touch-action:manipulation}.diag-action.on{border-color:var(--brass);color:var(--ink);box-shadow:inset 0 0 0 1px var(--brass)}
.repair-guide-live{margin-top:9px;padding:9px 10px;border-radius:7px;background:var(--surface)}.repair-guide-live h4{margin:8px 0 4px;font-size:.68rem;text-transform:uppercase;color:var(--muted)}.repair-guide-live ul{margin:0;padding-left:18px}.repair-guide-live li{font-size:.73rem;margin:3px 0}.guide-parts{display:flex;gap:5px;flex-wrap:wrap}.guide-part{border:1px solid var(--line);border-radius:999px;padding:4px 7px;font-size:.65rem;color:var(--muted)}.guide-source{display:block;font-size:.68rem;color:var(--brass-soft);margin:3px 0}.guide-caveat{font-size:.64rem;color:var(--muted);margin-top:7px}
.stage-btn.diag-relevant{border-color:var(--brass)!important;box-shadow:inset 0 -2px 0 var(--brass)}.stage-fault-count{position:absolute;top:8px;left:8px;border:1px solid var(--line);border-radius:999px;padding:2px 5px;background:var(--surface-2);font-size:.58rem;font-weight:800;color:var(--brass-soft)}
.workflow-runtime-footer{margin-top:18px;display:grid;gap:10px}.workflow-runtime-footer .section-block{margin-top:0}.workflow-runtime-footer [hidden]{display:none!important}
@media(max-width:640px){.diag-head{display:grid}.diag-actions{justify-content:flex-start}}
`;
document.head.appendChild(style);

function ensure(job){if(!Array.isArray(job.diagnosticFaults))job.diagnosticFaults=[];return job.diagnosticFaults;}
function syncLegacy(job){
 const all=ensure(job),diagTexts=new Set(all.map(x=>x.text));
 const manual=(Array.isArray(job.faults)?job.faults:[]).filter(f=>f&&f.text&&!diagTexts.has(f.text));
 job.faults=[...manual,...all.filter(x=>x.status==="confirmed").map(x=>({text:x.text,severity:x.severity||"Moderate"}))];
}
function addSuggestions(job){
 let changed=false;
 for(const stage of job.stages||[]){
  const defs=STAGE_COPY[stage.name]?.steps||[],checks=stage.checks||{};
  defs.forEach((raw,i)=>{const step=stepObj(raw,i),ans=checks[step.id]??checks[i]??"";if(!ans)return;
   suggestionsFor(stage.name,step.id,ans).forEach(f=>{const key=keyFor(stage.name,step.id,f.id);if(ensure(job).some(x=>x.key===key))return;ensure(job).push({key,id:f.id,text:f.text,category:f.category||"General",severity:f.severity||"Moderate",sourceStage:stage.name,sourceCheck:step.id,sourceQuestion:step.text,status:"possible",createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()});changed=true;});
  });
 }
 return changed;
}
function conditionMatches(actual,rule){if(Array.isArray(rule?.values))return rule.values.includes(actual);return actual===rule?.value;}
function visibleStep(job,stage,raw,i){
 const o=stepObj(raw,i),defs=STAGE_COPY[stage.name]?.steps||[];
 if(o.when){const di=defs.findIndex((x,n)=>stepObj(x,n).id===o.when.id);if(di>=0&&!conditionMatches((stage.checks||{})[stepObj(defs[di],di).id]??"",o.when))return false;}
 if(o.whenGlobal){const other=(job.stages||[]).find(s=>s.name===o.whenGlobal.stage);if(!other)return false;const od=STAGE_COPY[other.name]?.steps||[];const di=od.findIndex((x,n)=>stepObj(x,n).id===o.whenGlobal.id);if(di<0||!conditionMatches((other.checks||{})[stepObj(od[di],di).id]??"",o.whenGlobal))return false;}
 return true;
}
function syncAutomaticCompletion(job){
 let changed=false;
 (job.stages||[]).forEach(stage=>{
  if(["Intake","Final QC"].includes(stage.name))return;
  const defs=STAGE_COPY[stage.name]?.steps||[];
  const applicable=defs.map((x,i)=>({x,i})).filter(({x,i})=>visibleStep(job,stage,x,i));
  if(!applicable.length)return;
  const answered=applicable.every(({x,i})=>{const id=stepObj(x,i).id;return ["yes","no","na",true,false].includes((stage.checks||{})[id]);});
  if(stage.complete!==answered){stage.complete=answered;changed=true;}
 });
 return changed;
}
function syncCompletionUi(job){
 const stage=job.stages?.[job.stage],manual=stage&&["Intake","Final QC"].includes(stage.name),checkbox=$("#stageComplete");
 if(stage&&checkbox&&!manual)checkbox.checked=!!stage.complete;
 const state=$("#stageState");if(stage&&state)state.textContent=stage.complete?"Complete":"In progress";
 document.querySelectorAll("#stageList .stage-btn").forEach((btn,i)=>{const done=!!job.stages?.[i]?.complete;btn.classList.toggle("done",done);const mark=btn.querySelector(".stage-check");if(mark)mark.textContent=done?"✓":"";});
}
function guideMarkup(fault){
 const g=guidanceFor(fault);if(!g)return "";
 const list=(t,a)=>a?.length?`<h4>${t}</h4><ul>${a.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>`:"";
 const parts=g.parts?.length?`<h4>Likely parts to consider</h4><div class="guide-parts">${g.parts.map(x=>`<span class="guide-part">${esc(x)}</span>`).join("")}</div>`:"";
 const sources=g.sources?.length?`<h4>Reference</h4>${g.sources.map(s=>`<a class="guide-source" href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)}</a>`).join("")}`:"";
 return `<div class="repair-guide-live">${list("Inspect next",g.inspect)}${list("Repair direction",g.repair)}${parts}${sources}<div class="guide-caveat">Use calibre-specific service data when available. Generic guidance should not override the movement manufacturer's instructions.</div></div>`;
}
function actionButtons(f){return `<div class="diag-actions">${[["possible","Possible"],["confirmed","Confirm"],["ruledout","Rule out"]].map(([v,t])=>`<button type="button" class="diag-action${f.status===v?" on":""}" data-runtime-status="${v}" data-runtime-key="${esc(f.key)}">${t}</button>`).join("")}</div>`;}
function renderFaults(job){
 const root=$("#faults");if(!root)return;
 const all=ensure(job),active=all.filter(f=>f.status!=="ruledout"),ruled=all.filter(f=>f.status==="ruledout");
 const row=f=>`<div class="diag-row"><div class="diag-head"><div class="diag-copy"><strong>${esc(f.text)}</strong><small>${esc(f.category||"General")} · ${label(f.status)}<br>Raised at ${esc(f.sourceStage||"Manual")}${f.sourceQuestion?" — "+esc(f.sourceQuestion):""}</small></div>${actionButtons(f)}</div>${f.status!=="ruledout"?guideMarkup(f):""}</div>`;
 root.innerHTML=`<h3>Faults to investigate · ${active.length}</h3><p class="muted small">Possible faults are carried through the whole job until confirmed, ruled out or removed.</p>${active.map(row).join("")||'<p class="muted small">No faults suggested yet.</p>'}${ruled.length?`<details><summary>Ruled out · ${ruled.length}</summary>${ruled.map(row).join("")}</details>`:""}<div class="row" style="margin-top:10px"><input id="runtimeFaultText" placeholder="Add another fault or observation"><button id="runtimeFaultAdd" class="btn secondary" type="button">Add</button></div>`;
}
function stageMap(job){const map={};ensure(job).filter(f=>f.status!=="ruledout").forEach(f=>(CATEGORY_STAGES[f.category]||CATEGORY_STAGES.General).forEach(s=>(map[s]||(map[s]=[])).push(f)));return map;}
function renderStageRelevance(job){
 const map=stageMap(job);
 document.querySelectorAll("#stageList .stage-btn").forEach(btn=>{btn.classList.remove("diag-relevant");btn.querySelectorAll(".stage-fault-count").forEach(x=>x.remove());const title=btn.querySelector(".stage-name")?.textContent||"";const key=Object.keys(STAGE_COPY).find(k=>(STAGE_COPY[k]?.title||k)===title)||title;const faults=map[key]||[];if(!faults.length)return;btn.classList.add("diag-relevant");const b=document.createElement("span");b.className="stage-fault-count";b.textContent=`${faults.length} fault${faults.length===1?"":"s"}`;btn.appendChild(b);});
 document.querySelectorAll(".stage-relevance-runtime").forEach(x=>x.remove());const stage=job.stages?.[job.stage],faults=stage?map[stage.name]||[]:[];if(!faults.length)return;const box=document.createElement("div");box.className="wb-runtime-card stage-relevance-runtime";box.innerHTML=`<h3>Why this stage matters</h3><p class="muted small">Open faults connected to this stage:</p><ul>${faults.map(f=>`<li>${esc(f.text)} · ${label(f.status)}</li>`).join("")}</ul>`;const steps=$("#steps");steps?.parentNode.insertBefore(box,steps);
}
function arrangeWorkflowControls(job){
 const card=$("section.card"),footer=$(".footer-actions");if(!card||!footer)return;
 let host=$(".workflow-runtime-footer");if(!host){host=document.createElement("div");host.className="workflow-runtime-footer";card.insertBefore(host,footer);}
 const decision=$("#decision"),complete=$("#stageComplete");
 if(decision){const block=decision.closest("label")?.parentElement;if(block&&!block.dataset.runtimeMoved){block.dataset.runtimeMoved="1";host.appendChild(block);}}
 if(complete){const lab=complete.closest("label");if(lab&&!lab.dataset.runtimeMoved){lab.dataset.runtimeMoved="1";const wrap=document.createElement("div");wrap.className="section-block";wrap.id="runtimeCompleteBlock";wrap.appendChild(lab);host.appendChild(wrap);}}
 const stage=job.stages?.[job.stage]?.name||"";const decisionBlock=decision?.closest(".section-block");if(decisionBlock)decisionBlock.hidden=stage!=="Intake";const cb=$("#runtimeCompleteBlock");if(cb)cb.hidden=!(["Intake","Final QC"].includes(stage));
}
async function paint(){
 if(painting)return;painting=true;
 try{const state=await loadState(),job=current(state);if(!job)return;const changed=Boolean(addSuggestions(job)|syncAutomaticCompletion(job));syncLegacy(job);if(changed)await saveState(state);syncCompletionUi(job);renderFaults(job);renderStageRelevance(job);arrangeWorkflowControls(job);}catch(e){console.error("Calibre Workbench runtime",e);const s=$("#statusText");if(s)s.textContent="Workbench runtime error: "+(e.message||e);}finally{painting=false;}}
function schedule(ms=80){clearTimeout(paintTimer);paintTimer=setTimeout(paint,ms);}
async function setStatus(key,status){if(saving.has(key))return;saving.add(key);try{const state=await loadState(),job=current(state),f=ensure(job).find(x=>x.key===key);if(!f)throw new Error("Fault not found");f.status=status;f.updatedAt=new Date().toISOString();syncLegacy(job);await saveState(state);const s=$("#statusText");if(s)s.textContent=`${f.text}: ${label(status)}`;await paint();}catch(e){const s=$("#statusText");if(s)s.textContent="Could not update fault: "+(e.message||e);console.error(e);}finally{saving.delete(key);}}

document.addEventListener("click",async e=>{
 const b=e.target.closest("[data-runtime-status]");if(b){e.preventDefault();e.stopPropagation();await setStatus(b.dataset.runtimeKey,b.dataset.runtimeStatus);return;}
 const add=e.target.closest("#runtimeFaultAdd");if(add){e.preventDefault();const input=$("#runtimeFaultText"),text=input?.value.trim();if(!text)return;const state=await loadState(),job=current(state),key=`manual::${Date.now()}`;ensure(job).push({key,id:key,text,category:"Manual",severity:"Moderate",sourceStage:"Manual",sourceCheck:"manual",sourceQuestion:"Added manually",status:"confirmed",createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()});syncLegacy(job);await saveState(state);await paint();return;}
 if(e.target.closest("section.card button,section.card select"))schedule(180);
},true);
document.addEventListener("change",()=>schedule(160));
function start(){
 const steps=$("#steps"),faults=$("#faults");if(!steps||!faults)return setTimeout(start,120);
 new MutationObserver(()=>schedule(120)).observe(steps,{childList:true,subtree:true});
 new MutationObserver(()=>{if(faults.querySelector(".chip,#addFault")||faults.querySelector("h3")?.textContent?.trim()==="Faults found")schedule(25);}).observe(faults,{childList:true,subtree:true});
 schedule(40);
}
start();
