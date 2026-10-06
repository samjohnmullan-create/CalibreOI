import { loadState, current } from "./store.js?v=25";
import { guidanceFor } from "./repair-guidance.js?v=1";

const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));

const style=document.createElement("style");
style.textContent=`
.fault-register-row{display:grid!important;grid-template-columns:minmax(0,1fr) auto;gap:10px!important;align-items:start}
.fault-register-row>.fault-guide-host{grid-column:1/-1;min-width:0}
.repair-guide{position:relative;z-index:2;width:100%;margin-top:4px;border:1px solid var(--line);border-radius:8px;background:var(--surface-2);padding:12px;pointer-events:auto!important}
.repair-guide-title{font-size:.72rem;font-weight:800;color:var(--brass-soft);margin-bottom:6px}
.repair-guide h4{font-size:.68rem;text-transform:uppercase;letter-spacing:.04em;color:var(--muted);margin:9px 0 5px}.repair-guide ul{margin:0;padding-left:18px}.repair-guide li{font-size:.73rem;line-height:1.4;margin:4px 0}
.guide-parts{display:flex;gap:5px;flex-wrap:wrap}.guide-part{border:1px solid var(--line);border-radius:999px;padding:4px 7px;font-size:.65rem;color:var(--muted);background:var(--surface)}
.guide-sources{display:grid;gap:5px}.guide-source{position:relative;z-index:4;font-size:.68rem;color:var(--brass-soft);text-decoration:none;pointer-events:auto}.guide-source:hover{text-decoration:underline}
.guide-caveat{font-size:.64rem;color:var(--muted);margin-top:8px;padding-top:7px;border-top:1px solid var(--line)}
@media(max-width:640px){.fault-register-row{grid-template-columns:1fr}.fault-register-row>div:nth-child(2){grid-column:1}.fault-register-row>.fault-guide-host{grid-column:1}}
`;
document.head.appendChild(style);

function guideMarkup(fault){
  const g=guidanceFor(fault);if(!g)return "";
  const list=(title,items)=>items?.length?`<h4>${title}</h4><ul>${items.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>`:"";
  const parts=g.parts?.length?`<h4>Likely parts to consider</h4><div class="guide-parts">${g.parts.map(x=>`<span class="guide-part">${esc(x)}</span>`).join("")}</div>`:"";
  const sources=g.sources?.length?`<h4>Reference</h4><div class="guide-sources">${g.sources.map(s=>`<a class="guide-source" href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)}</a>`).join("")}</div>`:"";
  return `<div class="fault-guide-host"><div class="repair-guide"><div class="repair-guide-title">Repair guidance</div>${list("Inspect next",g.inspect)}${list("Repair direction",g.repair)}${parts}${sources}<div class="guide-caveat">Generic guidance only. Prefer the exact calibre technical sheet/manual when available, especially for lubrication, escapement geometry, tolerances and automatic works.</div></div></div>`;
}

async function paint(){
  try{
    const state=await loadState(),job=current(state);if(!job)return;
    const faults=Array.isArray(job.diagnosticFaults)?job.diagnosticFaults:[];
    document.querySelectorAll(".fault-register-row").forEach(row=>{
      row.querySelectorAll(".fault-guide-host").forEach(x=>x.remove());
      const key=row.querySelector("[data-diag-key]")?.dataset.diagKey;if(!key)return;
      const fault=faults.find(f=>f&&f.key===key);if(!fault||fault.status==="ruledout")return;
      const html=guideMarkup(fault);if(!html)return;
      row.insertAdjacentHTML("beforeend",html);
    });
  }catch(err){console.warn("Calibre repair guidance",err);}
}

let timer;
function schedule(ms=100){clearTimeout(timer);timer=setTimeout(paint,ms);}
function start(){
  const root=document.getElementById("faults");if(!root)return setTimeout(start,120);
  new MutationObserver(()=>schedule()).observe(root,{childList:true,subtree:true});
  document.addEventListener("calibre-diagnostic-change",()=>schedule(80));
  document.addEventListener("click",e=>{if(e.target.closest(".stage-btn,#steps .yn-btns button"))schedule(250);});
  schedule(150);
}
start();
