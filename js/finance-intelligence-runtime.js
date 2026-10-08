import { portfolioEconomics } from "./profit-intelligence.js?v=1";
import { money, escapeHtml } from "./store.js?v=26";

function bridge(){return window.calibreFinance||null;}
function metric(label,value,sub=""){return `<div><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong>${sub?`<small class="muted">${escapeHtml(sub)}</small>`:""}</div>`;}
function name(x){return x?.job?.watchName||"Untitled";}

let last="";
function paint(){
  const b=bridge(),state=b?.getState?.();
  if(!state)return;
  const p=portfolioEconomics(state.jobs||[]);
  let root=document.getElementById("financeIntelligence");
  if(!root){
    root=document.createElement("section");root.id="financeIntelligence";root.className="card fi-card";
    const headline=document.getElementById("headline");headline?.insertAdjacentElement("afterend",root);
  }
  if(!root)return;
  const atRiskCapital=p.atRisk.reduce((n,x)=>n+x.direct,0);
  const leaders=[
    p.bestProfit&&["Highest projected profit",name(p.bestProfit),money(p.bestProfit.cashProfit)],
    p.bestRoi&&["Best ROI",name(p.bestRoi),`${Math.round(p.bestRoi.roi*100)}%`],
    p.bestPerHour&&p.bestPerHour.perHour!=null&&["Best profit / hour",name(p.bestPerHour),`${money(p.bestPerHour.perHour)}/hr`]
  ].filter(Boolean);
  const issues=[...p.atRisk.map(x=>({kind:"At risk",x,detail:`${money(x.profitAfterLabour)} after labour`})),...p.thin.map(x=>({kind:"Thin margin",x,detail:`${Math.round(x.roi*100)}% ROI`}))]
    .sort((a,b)=>a.x.profitAfterLabour-b.x.profitAfterLabour);
  const markup=`<div class="fi-head"><div><div class="kicker">RISK & OPPORTUNITY</div><h3>Where to focus next</h3></div><span class="badge">${issues.length?`${issues.length} watch${issues.length===1?"":"es"} to review`:"Portfolio healthy"}</span></div>
  <div class="business-metrics fi-metrics">
    ${metric("At-risk capital",money(atRiskCapital),`${p.atRisk.length} projected loss${p.atRisk.length===1?"":"es"} after labour`)}
    ${metric("Thin-margin stock",String(p.thin.length),"Under 20% projected ROI")}
    ${metric("Projected after labour",money(p.projectedAfterLabour),`${p.unsold.length} unsold watches`)}
    ${metric("Realised profit",money(p.realisedProfit),`${p.sold.length} sold watches`)}
  </div>
  ${leaders.length?`<div class="fi-leaders">${leaders.map(([label,nm,val])=>`<div class="line"><span><strong>${escapeHtml(label)}</strong><br><span class="muted small">${escapeHtml(nm)}</span></span><strong>${escapeHtml(val)}</strong></div>`).join("")}</div>`:""}
  <div class="fi-issues">${issues.length?issues.map(({kind,x,detail})=>`<div class="line"><span><strong>${escapeHtml(kind)} · ${escapeHtml(name(x))}</strong><br><span class="muted small">Invested ${money(x.direct)} · target ${x.target?money(x.target):"not set"} · ${escapeHtml(detail)}</span></span><a class="btn secondary" href="business.html">Review</a></div>`).join(""):'<p class="muted small">No watches are currently projected to lose money after labour or sit below 20% ROI.</p>'}</div>`;
  if(markup===last)return;last=markup;root.innerHTML=markup;
}

const style=document.createElement("style");style.textContent=`.fi-card{margin:12px 0}.fi-head{display:flex;justify-content:space-between;gap:10px;align-items:start}.fi-head h3{margin:2px 0}.fi-metrics{margin-top:9px}.fi-leaders,.fi-issues{margin-top:9px}.fi-issues .line{align-items:center}`;document.head.appendChild(style);
function start(){if(!bridge())return setTimeout(start,120);paint();document.getElementById("period")?.addEventListener("change",()=>setTimeout(paint,80));document.addEventListener("click",e=>{if(e.target.closest("#add,.drop"))setTimeout(paint,180);},true);}
start();
