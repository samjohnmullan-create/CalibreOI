import { loadState, saveState, current, escapeHtml, partsCost } from "./store.js?v=26";
import { recordFitEvidence } from "./parts-intelligence.js?v=3";

const $=s=>document.querySelector(s),esc=escapeHtml;
const now=()=>new Date().toISOString();
const uid=p=>p+"-"+Math.random().toString(36).slice(2,9);
const slug=s=>String(s||"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,72)||"part";
function partKey(p,i){if(p.workflowKey)return p.workflowKey;p.workflowKey=p.researchKey||`jobpart:${slug(p.part||p.partNumber||"part")}:${i}`;return p.workflowKey;}
function ensureState(s){s.incoming=Array.isArray(s.incoming)?s.incoming:[];return s;}
function incomingFor(state,job,p,key){return state.incoming.find(x=>x&&x.linkedJobId===job.id&&x.linkedPartKey===key&&!['Cancelled / closed'].includes(x.status));}
function syncJobCost(job){job.business=job.business||{};job.business.partsCost=String(partsCost(job));}
function unresolved(job){return (job.parts||[]).filter(p=>!p.fitted);}
function maybeReady(job){const waiting=unresolved(job).filter(p=>!p.received);if(!waiting.length&&job.status==="Awaiting parts")job.status="On bench";}
function pickerForPart(name){const s=String(name||"").toLowerCase();if(/main.?spring|barrel spring/.test(s))return"mainspring";if(/balance staff|staff/.test(s))return"staff";if(/balance/.test(s))return"balance";if(/pallet/.test(s))return"pallet";if(/escape/.test(s))return"escape";if(/train|wheel|pinion/.test(s))return"train";if(/stem|winding stem/.test(s))return"stem";if(/crown/.test(s))return"crown";if(/hand/.test(s))return"hands";if(/crystal|glass/.test(s))return"crystal";if(/dial/.test(s))return"dial";if(/case/.test(s))return"case";if(/movement/.test(s))return"movement";return"";}
function checkOwned(part){const pick=document.getElementById('partPick'),wanted=pickerForPart(part?.part);if(pick&&wanted&&[...pick.options].some(o=>o.value===wanted)){pick.value=wanted;pick.dispatchEvent(new Event('change',{bubbles:true}));}document.getElementById('partsIntelligence')?.scrollIntoView({behavior:'smooth',block:'start'});}
function render(){
  if((location.pathname.split('/').pop()||'').split('?')[0]!=="suppliers.html")return;
  loadState().then(state=>{ensureState(state);const job=current(state);if(!job)return;const rows=(job.parts||[]).map((p,i)=>({p,i,key:partKey(p,i)})).filter(x=>!x.p.fitted);let box=$("#partsWorkflow");if(!box){box=document.createElement("section");box.id="partsWorkflow";box.className="card";const anchor=[...document.querySelectorAll("section.card")].find(x=>x.querySelector("h3")?.textContent.trim()==="Match a part");anchor?.insertAdjacentElement("beforebegin",box);}if(!box)return;
    box.innerHTML=`<div class="kicker">PARTS NEEDED</div><h3>Requirements for ${esc(job.watchName||"this watch")}</h3><p class="muted small">Use owned stock or donors first. If nothing suitable is available, create a linked purchase here.</p>${rows.length?rows.map(({p,i,key})=>{const inc=incomingFor(state,job,p,key),status=p.fitted?"Fitted":p.received?"Received":inc?inc.status||"Ordered":"Needed";return `<article class="pw-row" data-part-key="${esc(key)}"><div><strong>${esc(p.part||"Unnamed part")}</strong><div class="muted small">${esc([p.partNumber,p.supplier].filter(Boolean).join(" · ")||"No supplier/reference yet")}</div></div><span class="badge">${esc(status)}</span><div class="pw-actions"><button class="btn secondary pw-find" type="button">Check owned</button>${!inc&&!p.received?`<button class="btn pw-buy" type="button">Need to buy</button>`:""}${p.received&&!p.fitted?`<button class="btn pw-fit" type="button">Fit part</button>`:""}${inc?`<a class="btn secondary" href="inventory.html#incoming">Incoming</a>`:""}</div></article>`;}).join(""):'<p class="muted small">No open part requirements on this watch.</p>'}`;
    box.querySelectorAll('.pw-find').forEach(b=>b.onclick=()=>{const key=b.closest('[data-part-key]').dataset.partKey,p=(job.parts||[]).find((x,i)=>partKey(x,i)===key);checkOwned(p);});
    box.querySelectorAll('.pw-buy').forEach(b=>b.onclick=()=>buy(state,job,b.closest('[data-part-key]').dataset.partKey));
    box.querySelectorAll('.pw-fit').forEach(b=>b.onclick=()=>fit(state,job,b.closest('[data-part-key]').dataset.partKey));
  }).catch(e=>console.warn("Parts workflow unavailable",e));
}
async function buy(state,job,key){const i=(job.parts||[]).findIndex((p,n)=>partKey(p,n)===key),p=job.parts[i];if(!p)return;if(incomingFor(state,job,p,key))return;const inc={id:uid('buy'),itemName:p.part||"Watch part",category:"Part",source:p.supplier||"",orderId:p.partNumber||"",quantity:Number(p.quantity)||1,amount:p.cost||"",status:"Ordered",variant:p.partNumber||"",tracking:"",eta:"",linkedJobId:job.id,linkedJobName:job.watchName||"",linkedPartKey:key,createdAt:now(),updatedAt:now()};state.incoming.unshift(inc);p.purchaseId=inc.id;p.ordered=p.ordered||new Date().toISOString().slice(0,10);job.status="Awaiting parts";await saveState(state);render();}
async function fit(state,job,key){const i=(job.parts||[]).findIndex((p,n)=>partKey(p,n)===key),p=job.parts[i];if(!p||!p.received)return;p.fitted=true;p.fittedAt=now();job.repairPerformed=[job.repairPerformed,`Fitted ${p.part||"part"}${p.partNumber?` (${p.partNumber})`:""}.`].filter(Boolean).join("\n");if(p.purchaseId)recordFitEvidence(state,job,{sourceType:"purchase",sourceId:p.purchaseId,partId:p.partNumber||key,partName:p.part||"Purchased part",result:"used",note:p.partNumber?`Purchased reference ${p.partNumber}`:"Purchased part fitted successfully"});syncJobCost(job);maybeReady(job);await saveState(state);render();}

async function reconcileIncoming(){if((location.pathname.split('/').pop()||'').split('?')[0]!=="inventory.html")return;const state=ensureState(await loadState());let changed=false;for(const inc of state.incoming){if(!inc?.linkedJobId||!inc.linkedPartKey)continue;const job=(state.jobs||[]).find(j=>j.id===inc.linkedJobId);if(!job)continue;const p=(job.parts||[]).find((x,i)=>partKey(x,i)===inc.linkedPartKey);if(!p)continue;if(!p.purchaseId){p.purchaseId=inc.id;changed=true;}if(inc.status==="Delivered"&&!p.received){p.received=true;p.receivedAt=inc.receivedAt||now();if((p.cost===""||p.cost==null)&&inc.amount!==""&&inc.amount!=null)p.cost=String(inc.amount);if(!p.supplier&&inc.source)p.supplier=inc.source;if(!p.partNumber&&inc.variant)p.partNumber=inc.variant;syncJobCost(job);maybeReady(job);changed=true;}}
if(changed)await saveState(state);}

const style=document.createElement('style');style.textContent=`.pw-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px 12px;padding:10px 0;border-bottom:1px solid var(--line)}.pw-actions{grid-column:1/-1;display:flex;gap:6px;flex-wrap:wrap}.pw-actions .btn{min-height:30px;padding:5px 8px;font-size:.66rem}@media(max-width:640px){.pw-row{grid-template-columns:1fr}.pw-row>.badge{justify-self:start}}`;document.head.appendChild(style);

render();
if((location.pathname.split('/').pop()||'').split('?')[0]==="inventory.html"){
  if(location.hash==="#incoming")setTimeout(()=>document.querySelector('#tabs [data-tab="incoming"]')?.click(),300);
  setTimeout(()=>reconcileIncoming().catch(console.warn),500);
  document.addEventListener('change',e=>{if(e.target.closest('.incoming-status'))setTimeout(()=>reconcileIncoming().catch(console.warn),250);},true);
  window.addEventListener('focus',()=>setTimeout(()=>reconcileIncoming().catch(console.warn),250));
}
