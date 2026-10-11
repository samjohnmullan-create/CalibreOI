import { loadState, money } from "./store.js?v=26";

const page=(location.pathname.split("/").pop()||"index.html").split("?")[0]||"index.html";
const num=v=>Number(v)||0;

function cashPosition(state={}){
  const ledger=Array.isArray(state.ledger)?state.ledger:[];
  return ledger.reduce((total,entry)=>{
    const amount=num(entry.amount);
    if(entry.kind==="in")return total+amount;
    if(entry.kind==="out"||entry.kind==="taken")return total-amount;
    return total;
  },0);
}

async function homeEnhancement(){
  const state=await loadState(),available=cashPosition(state),strip=document.getElementById("moneyStrip");
  if(!strip)return;
  function add(){
    let box=document.getElementById("homeAvailableCash");
    if(!box){box=document.createElement("div");box.id="homeAvailableCash";strip.prepend(box);}
    box.innerHTML=`<span>Available to spend</span><strong>${money(available)}</strong>`;
    box.title="Real ledger cash only. Stock value and projected profit are excluded.";
  }
  add();
  const obs=new MutationObserver(()=>{if(!document.getElementById("homeAvailableCash"))add();});
  obs.observe(strip,{childList:true});
}

// Business owns its own canonical cash/stock/profit presentation. This helper is
// intentionally Home-only so legacy cash UI can never be injected into finance.html.
if(page==="index.html")homeEnhancement().catch(e=>console.warn("Home cash position unavailable",e));
