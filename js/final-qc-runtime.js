import { FINAL_QC_CHECKS, finalQcAssessment, finalTiming } from "./final-qc.js?v=2";

const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
const bridge=()=>window.calibreWorkbench||null;
const currentStage=job=>job?.stages?.[job.stage]?.name||"";
const answer=(job,id)=>job?.finalQc?.checks?.[id]||"";

function ensure(job){
  if(!job.finalQc||typeof job.finalQc!=="object")job.finalQc={};
  if(!job.finalQc.checks||typeof job.finalQc.checks!=="object")job.finalQc.checks={};
  return job.finalQc;
}
function timingText(run){
  if(!run)return "No final timing run saved";
  const rate=Number(run.rateSecondsPerDay??run.rate),beat=Number(run.beatError),bits=[];
  if(Number.isFinite(rate))bits.push(`${rate>=0?"+":""}${rate.toFixed(1)} s/day`);
  if(Number.isFinite(beat))bits.push(`${beat.toFixed(2)} ms beat error`);
  if(run.position)bits.push(run.position);
  if(run.phase)bits.push(run.phase);
  return bits.join(" · ")||"Final timing run saved";
}
function ensureBox(){
  let box=document.getElementById("finalQcRelease");
  if(box)return box;
  const complete=document.getElementById("completeSection"),card=document.querySelector("section.card");
  if(!card)return null;
  box=document.createElement("section");box.id="finalQcRelease";box.className="final-qc-release section-block";
  (complete||card).insertAdjacentElement(complete?"beforebegin":"beforeend",box);
  return box;
}
function checkRow(job,item){
  const cur=answer(job,item.id);
  const btn=(v,label)=>`<button type="button" class="fqc-choice${cur===v?" on":""}" data-fqc-id="${item.id}" data-fqc-value="${v}">${label}</button>`;
  return `<div class="fqc-row"><div><strong>${esc(item.label)}</strong><small>${esc(item.detail)}${item.optional?" · optional":""}</small></div><div class="fqc-actions">${btn("pass","Pass")}${btn("fail","Fail")}${btn("na","N/A")}</div></div>`;
}
function paint(){
  const b=bridge(),job=b?.getJob?.(),box=ensureBox();if(!job||!box)return;
  const show=currentStage(job)==="Final QC";box.hidden=!show;if(!show)return;
  ensure(job);
  const a=finalQcAssessment(job),run=finalTiming(job),tone=a.status==="pass"?"pass":a.status==="attention"?"attention":"hold";
  const blockers=a.blockers.length?`<ul>${a.blockers.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>`:'<p class="muted small">No release blockers detected.</p>';
  box.innerHTML=`<div class="fqc-head"><div><div class="kicker">RELEASE INSPECTION</div><h3>Final QC release</h3><p class="muted small">A watch is only sale-ready after this release inspection passes.</p></div><span class="fqc-status ${tone}">${a.label}</span></div>
  <div class="fqc-timing"><strong>Final timing</strong><span>${esc(timingText(run))}</span><a href="timegrapher.html?v=5">Open timing</a></div>
  <div class="fqc-list">${FINAL_QC_CHECKS.map(x=>checkRow(job,x)).join("")}</div>
  <label class="fqc-note">Release notes / remaining limitations<textarea id="fqcNotes" rows="3" placeholder="Anything the buyer should know, remaining cosmetic wear, test limitations…">${esc(job.finalQc.notes||"")}</textarea></label>
  <div class="fqc-blockers"><strong>Release blockers</strong>${blockers}</div>`;

  box.querySelectorAll("[data-fqc-id]").forEach(btn=>btn.addEventListener("click",async()=>{
    const b=bridge(),job=b?.getJob?.();if(!job)return;ensure(job);
    const id=btn.dataset.fqcId,value=btn.dataset.fqcValue;
    job.finalQc.checks[id]=answer(job,id)===value?"":value;
    job.finalQc.updatedAt=new Date().toISOString();
    await b.save?.();paint();
  }));
  box.querySelector("#fqcNotes")?.addEventListener("change",async e=>{
    const b=bridge(),job=b?.getJob?.();if(!job)return;ensure(job);job.finalQc.notes=e.target.value;job.finalQc.updatedAt=new Date().toISOString();await b.save?.();
  });
}

function blockPrematureCompletion(e){
  const job=bridge()?.getJob?.();if(!job||currentStage(job)!=="Final QC")return;
  const a=finalQcAssessment(job);if(a.pass)return;
  e.preventDefault();e.stopImmediatePropagation();
  alert(`Final QC is ${a.label}.\n\n${a.blockers.join("\n")||"Complete the release inspection before marking this watch ready to list."}`);
  paint();
}

const style=document.createElement("style");style.textContent=`
.final-qc-release{margin-top:18px}.fqc-head{display:flex;justify-content:space-between;gap:12px;align-items:start}.fqc-head h3{margin:2px 0}.fqc-status{border:1px solid var(--line);border-radius:999px;padding:5px 9px;font-size:.65rem;font-weight:900;letter-spacing:.06em;white-space:nowrap}.fqc-status.pass{color:var(--ok);border-color:var(--ok)}.fqc-status.attention{color:var(--danger);border-color:var(--danger)}.fqc-status.hold{color:var(--muted)}.fqc-timing{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:9px;align-items:center;padding:9px 10px;margin:10px 0;background:var(--surface-2);border-radius:8px}.fqc-timing strong{font-size:.69rem}.fqc-timing span{font-size:.68rem;color:var(--muted)}.fqc-timing a{font-size:.65rem;font-weight:800;color:var(--accent)}.fqc-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;padding:9px 0;border-bottom:1px solid var(--line)}.fqc-row strong,.fqc-row small{display:block}.fqc-row strong{font-size:.73rem}.fqc-row small{font-size:.63rem;color:var(--muted);margin-top:2px;line-height:1.35}.fqc-actions{display:flex;gap:4px}.fqc-choice{min-height:31px;padding:5px 8px;border:1px solid var(--line);border-radius:6px;background:var(--surface);color:var(--muted);font-size:.63rem;font-weight:800;cursor:pointer}.fqc-choice.on{border-color:var(--accent);color:var(--ink);background:var(--surface-2)}.fqc-note{display:block;margin-top:11px}.fqc-note textarea{margin-top:5px}.fqc-blockers{margin-top:10px;padding:9px 10px;border:1px solid var(--line);border-radius:8px;background:var(--surface-2)}.fqc-blockers strong{font-size:.68rem}.fqc-blockers ul{margin:6px 0 0;padding-left:18px}.fqc-blockers li{font-size:.66rem;color:var(--muted);margin:2px 0}@media(max-width:640px){.fqc-row{grid-template-columns:1fr}.fqc-actions{width:100%}.fqc-choice{flex:1}.fqc-timing{grid-template-columns:1fr}.fqc-head{align-items:center}}
`;document.head.appendChild(style);

function start(){
  if(!bridge())return setTimeout(start,100);
  paint();
  document.getElementById("completeJob")?.addEventListener("click",blockPrematureCompletion,true);
  document.addEventListener("click",e=>{if(e.target.closest("#stageList .stage-btn,#prevStage,#nextStage,#stageComplete"))setTimeout(paint,220);},true);
  document.addEventListener("change",e=>{if(e.target.closest("#stageComplete"))setTimeout(paint,180);},true);
}
start();
