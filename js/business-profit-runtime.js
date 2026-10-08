import { watchEconomics } from "./profit-intelligence.js?v=1";
import { money } from "./store.js?v=26";

const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));

function bridge(){return window.calibreMoney||null;}
function metric(label,value,sub=""){return `<div><span>${esc(label)}</span><strong>${esc(value)}</strong>${sub?`<small class="muted">${esc(sub)}</small>`:""}</div>`;}
function fmtPct(v){return `${Math.round((Number(v)||0)*100)}%`;}

let last="";
function paint(){
  const b=bridge();
  const job=b?.getJob?.();
  if(!job)return;
  let root=document.getElementById("profitIntelligence");
  if(!root){
    root=document.createElement("section");
    root.id="profitIntelligence";
    root.className="card pi-card";
    const base=$(".shell .card");
    base?.insertAdjacentElement("beforebegin",root);
  }
  if(!root)return;
  const x=watchEconomics(job),hourlyTarget=Number(job.business?.targetHourlyRate)||50;
  const target=x.target;
  const targetMargin=target?target-x.breakEven:0;
  const markup=`<div class="pi-head"><div><div class="kicker">PROFIT INTELLIGENCE</div><h3>Is this watch worth the work?</h3></div><span class="badge">${esc(x.health)}</span></div>
  <div class="business-metrics pi-metrics">
    ${metric("Break-even sale",money(x.breakEven),"All recorded direct cash costs")}
    ${metric("Target cash profit",target?money(targetMargin):"—",target?fmtPct(x.roi)+" ROI":"Set a target sale")}
    ${metric("After labour",target?money(x.profitAfterLabour):"—",x.hours?`${x.hours.toFixed(1)} bench hours`:"No labour logged")}
    ${metric("Profit / hour",x.perHour==null?"—":money(x.perHour)+"/hr",x.hours?"After valuing your time":"Log labour time")}
  </div>
  <div class="pi-thresholds">
    <div class="line"><span><strong>20% ROI sale</strong><br><span class="muted small">Minimum healthy-margin reference</span></span><strong>${money(x.saleForRoi(.2))}</strong></div>
    <div class="line"><span><strong>30% ROI sale</strong><br><span class="muted small">Solid resale target</span></span><strong>${money(x.saleForRoi(.3))}</strong></div>
    <div class="line"><span><strong>50% ROI sale</strong><br><span class="muted small">Strong-margin target</span></span><strong>${money(x.saleForRoi(.5))}</strong></div>
    <div class="line"><span><strong>Sale for ${money(hourlyTarget)}/hr bench return</strong><br><span class="muted small">Direct costs plus your logged hours</span></span><strong>${money(x.saleForHourly(hourlyTarget))}</strong></div>
  </div>
  <label class="pi-hourly">Target bench return / hour<input id="targetHourlyRate" type="number" min="0" step="1" value="${esc(hourlyTarget)}"></label>
  <p class="muted small pi-note">Acquisition ${money(x.acquisition)} · repairs/parts ${money(x.repair)} · selling costs ${money(x.selling)} · labour value ${money(x.labour)}.</p>`;
  if(markup===last)return;
  last=markup;root.innerHTML=markup;
  root.querySelector("#targetHourlyRate")?.addEventListener("change",async e=>{job.business=job.business||{};job.business.targetHourlyRate=e.target.value;await b.save?.();last="";paint();});
}

const style=document.createElement("style");
style.textContent=`.pi-card{margin-bottom:12px}.pi-head{display:flex;justify-content:space-between;gap:10px;align-items:start}.pi-head h3{margin:2px 0}.pi-metrics{margin-top:9px}.pi-thresholds{margin-top:9px}.pi-hourly{display:block;max-width:260px;margin-top:10px}.pi-note{margin:8px 0 0}`;
document.head.appendChild(style);

function start(){if(!bridge())return setTimeout(start,120);paint();document.addEventListener("input",e=>{if(e.target.closest(".shell")&&!e.target.closest("#profitIntelligence"))setTimeout(paint,450);},true);document.addEventListener("change",e=>{if(!e.target.closest("#profitIntelligence"))setTimeout(paint,180);},true);}
start();
