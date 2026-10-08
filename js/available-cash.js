import { loadState, saveState, money } from "./store.js?v=26";

const page=(location.pathname.split("/").pop()||"index.html").split("?")[0]||"index.html";
const num=v=>Number(v)||0;

function watchSpend(job){
  const b=job?.business||{};
  const base=["purchasePrice","buyerPremium","postage","strapCost","batteryCost","partsCost","consumables","externalService","otherCost"].reduce((n,k)=>n+num(b[k]),0);
  const sold=num(b.actualSale)>0;
  return base+(sold?num(b.marketplaceFees)+num(b.shippingToBuyer):0);
}

function cashPosition(state){
  const settings=state.financeSettings||{};
  const opening=num(settings.openingCash);
  const jobs=Array.isArray(state.jobs)?state.jobs:[];
  const ledger=Array.isArray(state.ledger)?state.ledger:[];
  const watchSales=jobs.reduce((n,j)=>n+num(j.business?.actualSale),0);
  const watchCosts=jobs.reduce((n,j)=>n+watchSpend(j),0);
  const otherIn=ledger.filter(e=>e.kind==="in").reduce((n,e)=>n+num(e.amount),0);
  const businessOut=ledger.filter(e=>e.kind==="out"&&!["Watch acquisition"].includes(e.category)).reduce((n,e)=>n+num(e.amount),0);
  const taken=ledger.filter(e=>e.kind==="taken").reduce((n,e)=>n+num(e.amount),0);
  return {opening,watchSales,watchCosts,otherIn,businessOut,taken,available:opening+watchSales+otherIn-watchCosts-businessOut-taken};
}

function metric(label,value,sub=""){
  return `<div><span>${label}</span><strong>${value}</strong>${sub?`<small class="muted">${sub}</small>`:""}</div>`;
}

async function financeEnhancement(){
  let state=await loadState();
  state.financeSettings=state.financeSettings||{openingCash:""};
  const shell=document.querySelector(".shell");
  if(!shell||document.getElementById("workingCashCard"))return;
  const transactions=[...document.querySelectorAll("section.card")].find(s=>s.querySelector(".kicker")?.textContent.trim()==="TRANSACTIONS");
  const card=document.createElement("section");
  card.className="card";
  card.id="workingCashCard";
  card.innerHTML=`
    <div class="kicker">CASH POSITION</div>
    <div class="row" style="justify-content:space-between;align-items:end;gap:12px">
      <div><h3 style="margin-bottom:3px">Available to spend</h3><p class="muted small" style="margin-top:0">Real cash only. Stock value and projected profit are deliberately excluded.</p></div>
      <label style="min-width:180px">Opening / working cash<input id="openingCash" inputmode="decimal" placeholder="0.00"></label>
    </div>
    <div class="business-metrics" id="cashPositionMetrics"></div>
    <div id="cashPositionBreakdown"></div>
    <p class="muted small">Watch acquisition is taken from each watch record, not duplicated from Finance ledger entries. Estimated marketplace fees and buyer shipping only count once a watch has actually sold.</p>
    <p id="cashPositionStatus" class="muted small"></p>`;
  if(transactions)transactions.insertAdjacentElement("beforebegin",card);else shell.appendChild(card);
  const input=document.getElementById("openingCash"),status=document.getElementById("cashPositionStatus");
  input.value=state.financeSettings.openingCash||"";
  function paint(){
    const c=cashPosition(state);
    const el=document.getElementById("cashPositionMetrics");
    if(el)el.innerHTML=metric("Available to spend",money(c.available),"Cash you can actually deploy")+metric("Opening cash",money(c.opening))+metric("Watch sales received",money(c.watchSales))+metric("Other money in",money(c.otherIn));
    const rows=document.getElementById("cashPositionBreakdown");
    if(rows)rows.innerHTML=`<div class="line"><span>Cash spent on watches / repairs</span><strong>−${money(c.watchCosts)}</strong></div><div class="line"><span>Tools, parts stock & operating spend</span><strong>−${money(c.businessOut)}</strong></div><div class="line"><span>Funds taken out</span><strong>−${money(c.taken)}</strong></div>`;
    const headline=document.getElementById("headline");
    if(headline){const labels=[...headline.querySelectorAll("span")];const old=labels.find(x=>x.textContent.trim()==="Available cash");if(old){old.textContent="Available to spend";old.parentElement.querySelector("strong").textContent=money(c.available);}}
  }
  let timer;
  input.addEventListener("input",()=>{state.financeSettings.openingCash=input.value;paint();clearTimeout(timer);status.textContent="Saving…";timer=setTimeout(async()=>{await saveState(state);status.textContent="Saved";},350);});
  paint();
  const period=document.getElementById("period");if(period)period.addEventListener("change",()=>setTimeout(paint,0));
}

async function homeEnhancement(){
  const state=await loadState(),c=cashPosition(state),strip=document.getElementById("moneyStrip");
  if(!strip)return;
  function add(){
    let box=document.getElementById("homeAvailableCash");
    if(!box){box=document.createElement("div");box.id="homeAvailableCash";strip.prepend(box);}
    box.innerHTML=`<span>Available to spend</span><strong>${money(c.available)}</strong>`;
    box.title="Real working cash. Open Finance to set or change opening cash.";
  }
  add();
  const obs=new MutationObserver(()=>{if(!document.getElementById("homeAvailableCash"))add();});
  obs.observe(strip,{childList:true});
}

if(page==="finance.html")financeEnhancement().catch(e=>console.warn("Cash position unavailable",e));
if(page==="index.html")homeEnhancement().catch(e=>console.warn("Home cash position unavailable",e));
