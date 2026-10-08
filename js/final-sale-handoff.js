import { saleReadiness } from "./sale-readiness.js?v=1";

const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
function bridge(){return window.calibreWorkbench||null;}
function currentStage(job){return job?.stages?.[job.stage]?.name||"";}
function nearFinal(job){const s=currentStage(job);return s==="Final QC"||s==="Regulation"||s==="Casing & function"||job?.status==="Ready to list";}
function row(x){return `<div class="sr-row ${x.ok?"ok":"miss"}"><span class="sr-mark">${x.ok?"✓":"○"}</span><div><strong>${esc(x.label)}</strong><small>${esc(x.detail||"")}${x.required?"":" · optional"}</small></div></div>`;}
function ensureBox(){let box=document.getElementById("saleReadinessBox");if(box)return box;const card=document.querySelector("section.card");if(!card)return null;box=document.createElement("section");box.id="saleReadinessBox";box.className="wb-sale-readiness";card.appendChild(box);return box;}
let lastMarkup="";
function paint(){
  const b=bridge(),job=b?.getJob?.();if(!job)return;
  const box=ensureBox();if(!box)return;
  const show=nearFinal(job);box.hidden=!show;
  if(!show){lastMarkup="";return;}
  const r=saleReadiness(job);
  const markup=`<div class="sr-head"><div><div class="kicker">FINAL QC → SALE</div><h3>Sale readiness</h3><p class="muted small">${r.requiredDone}/${r.requiredTotal} required checks complete · ${r.allDone}/${r.allTotal} total</p></div><span class="badge">${r.ready?"Ready":"Not ready"}</span></div><div class="sr-grid">${r.items.map(row).join("")}</div><div class="row" style="margin-top:10px"><a class="btn ${r.ready?"":"secondary"}" href="sales.html${r.ready?"?prepare=1":""}">${r.ready?"Prepare sale":"Open Sale workspace"}</a><a class="btn secondary" href="timegrapher.html?v=5">Timing</a><a class="btn secondary" href="passport.html">Identity</a></div>`;
  if(markup===lastMarkup)return;
  lastMarkup=markup;
  box.innerHTML=markup;
}
const style=document.createElement("style");style.textContent=`.wb-sale-readiness{margin-top:18px;padding:13px;border:1px solid var(--line);border-left:3px solid var(--accent);border-radius:9px;background:var(--surface-2)}.sr-head{display:flex;justify-content:space-between;gap:10px;align-items:start}.sr-head h3{margin:2px 0}.sr-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:10px}.sr-row{display:grid;grid-template-columns:20px 1fr;gap:7px;padding:8px;border:1px solid var(--line);border-radius:7px;background:var(--surface)}.sr-row strong,.sr-row small{display:block}.sr-row small{color:var(--muted);font-size:.64rem;margin-top:2px}.sr-mark{font-weight:900}.sr-row.ok .sr-mark{color:var(--ok)}.sr-row.miss .sr-mark{color:var(--muted)}@media(max-width:640px){.sr-grid{grid-template-columns:1fr}}`;document.head.appendChild(style);
function start(){
  if(!bridge())return setTimeout(start,150);
  paint();
  document.addEventListener("change",()=>setTimeout(paint,120),true);
  document.addEventListener("click",e=>{
    if(e.target.closest('#saleReadinessBox'))return;
    if(e.target.closest('section.card button'))setTimeout(paint,180);
  },true);
}
start();
