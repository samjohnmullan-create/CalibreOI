const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
const money=v=>{const n=Number(v);return Number.isFinite(n)&&String(v).trim()!==""?n.toLocaleString("en-AU",{style:"currency",currency:"AUD"}):"—";};
const arr=v=>Array.isArray(v)?v.filter(Boolean):[];

const style=document.createElement("style");
style.textContent=`
.research-brief{margin:0 0 12px;padding:0;overflow:hidden}.research-brief>summary{list-style:none;cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px 12px}.research-brief>summary::-webkit-details-marker{display:none}.research-brief>summary:after{content:'+';font-size:1rem;color:var(--muted)}.research-brief[open]>summary:after{content:'−'}.research-brief[open]>summary{border-bottom:1px solid var(--line)}.research-title{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.research-title h3{margin:0;font-size:.9rem}.research-body{padding:11px 12px 12px}.research-value-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-bottom:10px}.research-value{padding:8px 9px;border:1px solid var(--line);border-radius:7px;background:var(--surface-2)}.research-value span{display:block;font-size:.6rem;color:var(--muted);text-transform:uppercase;letter-spacing:.05em}.research-value strong{display:block;margin-top:2px;font-size:.84rem}.research-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}.research-block{border-top:1px solid var(--line);padding-top:8px}.research-block.wide{grid-column:1/-1}.research-block h4{margin:0 0 5px;font-size:.66rem;text-transform:uppercase;letter-spacing:.07em;color:var(--muted)}.research-block p{margin:0;font-size:.75rem;line-height:1.45}.research-block ul{margin:0;padding-left:17px}.research-block li{font-size:.73rem;margin:3px 0;line-height:1.35}.research-part{padding:7px 0;border-bottom:1px solid var(--line);font-size:.72rem}.research-part:last-child{border-bottom:0}.research-part strong{display:block}.research-part small{display:block;color:var(--muted);margin-top:2px}.research-actions{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}.research-actions .btn{min-height:30px;padding:5px 8px;font-size:.67rem}@media(max-width:700px){.research-grid{grid-template-columns:1fr}.research-block.wide{grid-column:auto}.research-value-grid{grid-template-columns:1fr 1fr 1fr}}
`;
document.head.appendChild(style);

function bridge(){return window.calibreWorkbench||null;}
function unique(list){return [...new Set(arr(list).map(x=>String(x).trim()).filter(Boolean))];}
function researchFor(job){
  const r=job.researchBrief||{},b=job.business||{},p=job.passport||{};
  const parts=arr(r.partsLeads).length?arr(r.partsLeads):arr(job.parts).filter(x=>x.part||x.partNumber).map(x=>({part:x.part,reference:x.partNumber,confidence:"Provisional",notes:x.supplier?`Supplier: ${x.supplier}`:""}));
  const activeFaults=arr(job.diagnosticFaults).filter(x=>x.status!=="ruledout").map(x=>x.text);
  const risks=unique([...arr(r.risks),p.warnings]);
  const repairPlan=unique([...arr(r.repairPlan),job.service]);
  const nextChecks=unique([...arr(r.nextChecks),...activeFaults.slice(0,5)]);
  return {r,b,p,parts,risks,repairPlan,nextChecks,summary:r.summary||job.research||job.diagnosis||p.notes||"",technical:r.technicalNotes||job.serviceNotes||"",valuationBasis:r.valuationBasis||b.text||"",valuationConfidence:r.valuationConfidence||""};
}
function hasUseful(x){return !!(x.summary||x.technical||x.valuationBasis||x.parts.length||x.risks.length||x.repairPlan.length||x.nextChecks.length||x.b.minSale||x.b.targetSale||x.b.optimisticSale);}
function block(title,html,wide=false){return html?`<div class="research-block${wide?" wide":""}"><h4>${esc(title)}</h4>${html}</div>`:"";}
function bullets(items){return items.length?`<ul>${items.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>`:"";}
function parts(items){return items.length?items.map(x=>`<div class="research-part"><strong>${esc(x.part||"Part lead")}${x.reference?` · ${esc(x.reference)}`:""}</strong><small>${[x.compatibility,x.confidence,x.notes].filter(Boolean).map(esc).join(" · ")}</small></div>`).join(""):"";}
function paint(){
  const b=bridge();if(!b)return false;const job=b.getJob?.();if(!job)return true;const data=researchFor(job),old=$("#researchBrief");if(!hasUseful(data)){old?.remove();return true;}
  let root=old;if(!root){root=document.createElement("details");root.id="researchBrief";root.className="card research-brief";root.open=true;const stageList=$("#stageList");stageList?.insertAdjacentElement("afterend",root);}
  const confidence=data.valuationConfidence?`<span class="badge">${esc(data.valuationConfidence)}</span>`:"";
  root.innerHTML=`<summary><div class="research-title"><div class="kicker">RESEARCHED INTAKE</div><h3>Research brief</h3>${confidence}</div></summary><div class="research-body"><div class="research-value-grid"><div class="research-value"><span>Quick</span><strong>${money(data.b.minSale)}</strong></div><div class="research-value"><span>Expected</span><strong>${money(data.b.targetSale)}</strong></div><div class="research-value"><span>Optimistic</span><strong>${money(data.b.optimisticSale)}</strong></div></div><div class="research-grid">${block("Research conclusion",data.summary?`<p>${esc(data.summary)}</p>`:"",true)}${block("Technical notes",data.technical?`<p>${esc(data.technical)}</p>`:"")}${block("Valuation basis",data.valuationBasis?`<p>${esc(data.valuationBasis)}</p>`:"")}${block("Bench plan",bullets(data.repairPlan))}${block("Next checks",bullets(data.nextChecks))}${block("Parts leads",parts(data.parts),true)}${block("Risks / cautions",bullets(data.risks),true)}</div><div class="research-actions"><a class="btn secondary" href="passport.html">Identity & sources</a><a class="btn secondary" href="business.html">Money & valuation</a></div></div>`;
  return true;
}
function start(){if(!paint())setTimeout(start,80);}
start();
