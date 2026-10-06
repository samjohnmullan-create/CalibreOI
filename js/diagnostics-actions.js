import { loadState, saveState, current } from "./store.js?v=25";

const LABELS={possible:"Possible",confirmed:"Confirmed",ruledout:"Ruled out"};
let saving=new Set();

const style=document.createElement("style");
style.textContent=`
[data-diag-action],[data-diag-remove]{position:relative!important;z-index:30!important;pointer-events:auto!important;touch-action:manipulation!important;-webkit-tap-highlight-color:transparent;min-height:34px}
.diagnostic-actions{position:relative;z-index:25;pointer-events:auto!important}
.diagnostic-panel,.fault-register-row{position:relative;isolation:isolate}
`;
document.head.appendChild(style);

function statusText(msg){const el=document.getElementById("statusText");if(el)el.textContent=msg;}
function syncConfirmed(job){
  const all=Array.isArray(job.diagnosticFaults)?job.diagnosticFaults:[];
  const diagnosticTexts=new Set(all.map(x=>x&&x.text).filter(Boolean));
  const manual=(Array.isArray(job.faults)?job.faults:[]).filter(f=>f&&f.text&&!diagnosticTexts.has(f.text));
  const confirmed=all.filter(x=>x&&x.status==="confirmed").map(x=>({text:x.text,severity:x.severity||"Moderate"}));
  job.faults=[...manual,...confirmed];
}
function paintKey(key,status){
  document.querySelectorAll('[data-diag-key="'+CSS.escape(key)+'"][data-diag-action]').forEach(btn=>{
    const on=btn.dataset.diagAction===status;
    btn.classList.toggle("on",on);
    btn.disabled=false;
  });
  document.querySelectorAll('[data-diag-key="'+CSS.escape(key)+'"]').forEach(el=>{
    const row=el.closest(".diagnostic-item,.fault-register-row");
    const label=row&&row.querySelector(".fault-status");
    if(label)label.textContent=LABELS[status]||status;
  });
}
async function setStatus(key,status,btn){
  if(!key||!status||saving.has(key))return;
  saving.add(key);
  try{
    document.querySelectorAll('[data-diag-key="'+CSS.escape(key)+'"][data-diag-action]').forEach(x=>x.disabled=true);
    const state=await loadState();
    const job=current(state);
    if(!job)throw new Error("No open job");
    const list=Array.isArray(job.diagnosticFaults)?job.diagnosticFaults:[];
    const hit=list.find(x=>x&&x.key===key);
    if(!hit)throw new Error("Fault record not found");
    hit.status=status;
    hit.updatedAt=new Date().toISOString();
    syncConfirmed(job);
    await saveState(state);
    paintKey(key,status);
    statusText(`${hit.text}: ${LABELS[status]||status}`);
    document.dispatchEvent(new CustomEvent("calibre-diagnostic-change",{detail:{key,status}}));
  }catch(err){
    console.error("Calibre diagnostic action",err);
    statusText("Could not update fault: "+(err.message||err));
    document.querySelectorAll('[data-diag-key="'+CSS.escape(key)+'"][data-diag-action]').forEach(x=>x.disabled=false);
  }finally{saving.delete(key);}
}

function handle(e){
  const btn=e.target.closest&&e.target.closest("[data-diag-action]");
  if(!btn)return;
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();
  setStatus(btn.dataset.diagKey,btn.dataset.diagAction,btn);
}

document.addEventListener("pointerup",handle,true);
document.addEventListener("click",handle,true);
