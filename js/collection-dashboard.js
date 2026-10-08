import { loadState, money } from "./store.js?v=26";
import { watchEconomics } from "./profit-intelligence.js?v=1";
import { finalQcAssessment } from "./final-qc.js?v=2";
import { listingPackStatus } from "./listing-pack.js?v=2";

const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
const n=v=>Number(v)||0;
const raw=v=>v==null?"":String(v).trim();

function stageName(job){return job?.stages?.[Number(job?.stage)||0]?.name||"";}
function bucket(job){
  const status=raw(job?.status).toLowerCase(),stage=stageName(job).toLowerCase(),actual=n(job?.business?.actualSale);
  if(status==="sold"||actual>0)return "sold";
  if(status==="listed")return "listed";
  if(status==="ready to list")return "ready";
  if(status==="awaiting parts")return "parts";
  if(stage.includes("final qc")||stage.includes("regulation"))return "qc";
  if(status.includes("research")||stage==="intake"||stage.includes("assessment"))return "research";
  return "bench";
}
function blockers(job){
  const out=[];
  const faults=(job?.diagnosticFaults||[]).filter(f=>f&&f.status!=="ruledout");
  const parts=(job?.parts||[]).filter(p=>raw(p?.part)&&!p?.fitted);
  if(faults.length)out.push(`${faults.length} fault${faults.length===1?"":"s"}`);
  if(parts.length)out.push(`${parts.length} part${parts.length===1?"":"s"}`);
  const b=bucket(job);
  if(["qc","ready","listed"].includes(b)){
    const qc=finalQcAssessment(job);
    if(!qc.pass&&qc.blockers?.length)out.push(qc.blockers[0]);
  }
  if(["ready","listed"].includes(b)){
    const pack=listingPackStatus(job);
    if(!pack.complete)out.push("listing photos");
  }
  return out;
}
function ageDays(job){
  const d=Date.parse(job?.acquiredAt||job?.createdAt||"");
  return Number.isFinite(d)?Math.max(0,Math.floor((Date.now()-d)/86400000)):0;
}
function cardStats(job){
  const e=watchEconomics(job),target=n(job?.business?.targetSale);
  return {invested:e.direct,target,profit:target?e.cashProfit:0,roi:target?e.roi:0,blockers:blockers(job),age:ageDays(job)};
}
function pipelineCounts(jobs){
  const ids=["research","bench","parts","qc","ready","listed","sold"],counts=Object.fromEntries(ids.map(x=>[x,0]));
  jobs.forEach(j=>counts[bucket(j)]++);return counts;
}
function mount(state){
  const panel=document.getElementById("panel-watches"),groups=document.getElementById("groups");if(!panel||!groups)return;
  let dash=document.getElementById("collectionPipeline");
  if(!dash){dash=document.createElement("section");dash.id="collectionPipeline";dash.className="card collection-pipeline";groups.insertAdjacentElement("beforebegin",dash);}
  const jobs=state.jobs||[],counts=pipelineCounts(jobs),unsold=jobs.filter(j=>bucket(j)!=="sold"),stats=unsold.map(j=>({job:j,...cardStats(j)}));
  const invested=stats.reduce((a,x)=>a+x.invested,0),target=stats.reduce((a,x)=>a+x.target,0),profit=stats.reduce((a,x)=>a+x.profit,0),attention=stats.filter(x=>x.blockers.length);
  const steps=[
    ["research","Research / intake"],["bench","On bench"],["parts","Awaiting parts"],["qc","Final QC"],["ready","Ready to list"],["listed","Listed"],["sold","Sold"]
  ];
  dash.innerHTML=`<div class="cp-head"><div><div class="kicker">PIPELINE</div><h3>Watch flow</h3><p class="muted small">What needs attention, what is ready, and where your capital is sitting.</p></div><span class="badge">${attention.length} need attention</span></div><div class="cp-flow">${steps.map(([id,label])=>`<div><span>${esc(label)}</span><strong>${counts[id]}</strong></div>`).join("")}</div><div class="cp-money"><div><span>Capital tied up</span><strong>${money(invested)}</strong></div><div><span>Target sales</span><strong>${money(target)}</strong></div><div><span>Projected profit</span><strong>${money(profit)}</strong></div></div>${attention.length?`<details class="cp-attention"><summary>Needs attention · ${attention.length}</summary>${attention.sort((a,b)=>b.invested-a.invested).slice(0,10).map(x=>`<div class="cp-att-row"><span><strong>${esc(x.job.watchName||"Untitled")}</strong><small>${esc(x.blockers.join(" · "))}</small></span><span>${money(x.invested)} tied up</span></div>`).join("")}</details>`:"<p class=\"muted small\" style=\"margin-top:10px\">No current blockers detected.</p>"}`;

  const style=document.getElementById("collectionPipelineStyles")||document.createElement("style");
  style.id="collectionPipelineStyles";style.textContent=`.collection-pipeline{margin-bottom:12px;padding:12px}.cp-head{display:flex;justify-content:space-between;gap:10px;align-items:start}.cp-head h3{margin:0}.cp-head p{margin:3px 0 0}.cp-flow{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:6px;margin-top:10px}.cp-flow div,.cp-money div{padding:8px;border:1px solid var(--line);border-radius:8px;background:var(--surface-2)}.cp-flow span,.cp-money span{display:block;color:var(--muted);font-size:.58rem;line-height:1.2}.cp-flow strong,.cp-money strong{display:block;margin-top:3px;font-size:.9rem}.cp-money{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:6px}.cp-attention{margin-top:9px}.cp-attention summary{cursor:pointer;font-size:.69rem;font-weight:800;color:var(--ink)}.cp-att-row{display:flex;justify-content:space-between;gap:10px;padding:7px 0;border-bottom:1px solid var(--line);font-size:.68rem}.cp-att-row small{display:block;color:var(--muted);margin-top:2px}.collection-intel{grid-column:1/-1;display:flex;gap:7px;flex-wrap:wrap;align-items:center;padding-top:6px;margin-top:4px;border-top:1px solid var(--line);font-size:.61rem;color:var(--muted)}.collection-intel strong{color:var(--ink)}.collection-intel .ci-block{color:var(--danger)}@media(max-width:850px){.cp-flow{grid-template-columns:repeat(2,1fr)}.cp-money{grid-template-columns:1fr 1fr}.cp-att-row{display:grid}.collection-intel{display:grid;grid-template-columns:1fr 1fr}}`;
  if(!style.parentNode)document.head.appendChild(style);
}
function decorate(state){
  document.querySelectorAll("#groups .job-card[data-id]").forEach(card=>{
    const job=(state.jobs||[]).find(j=>String(j.id)===String(card.dataset.id));if(!job)return;
    card.querySelector(".collection-intel")?.remove();
    const s=cardStats(job),line=document.createElement("div");line.className="collection-intel";
    line.innerHTML=`<span>Invested <strong>${money(s.invested)}</strong></span><span>Target <strong>${s.target?money(s.target):"—"}</strong></span><span>Profit <strong>${s.target?money(s.profit):"—"}</strong></span><span>ROI <strong>${s.target?Math.round(s.roi*100)+"%":"—"}</strong></span>${s.age?`<span>${s.age} days</span>`:""}${s.blockers.length?`<span class="ci-block">${esc(s.blockers.join(" · "))}</span>`:"<span>Clear</span>"}`;
    card.appendChild(line);
  });
}

try{
  const state=await loadState();
  mount(state);
  // Inventory paints its grouped watch cards in its own module. Make a few
  // bounded attempts to decorate them without observers or continuous polling.
  [180,450,900].forEach(ms=>setTimeout(()=>decorate(state),ms));
}catch(err){console.warn("Collection dashboard unavailable",err);}
