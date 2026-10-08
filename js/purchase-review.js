import { loadState, saveState, blankJob, escapeHtml, money } from "./store.js?v=26";

const CATEGORIES=["Watch","Tool","Part","Strap","Consumable","Other"];
const $=id=>document.getElementById(id);
const raw=v=>v==null?"":String(v).trim();
const num=v=>Number(v)||0;
const now=()=>new Date().toISOString();
const keyFor=p=>String(p?.sourceKey||p?.pushId||[p?.source,p?.orderId,p?.itemName,p?.variant].filter(Boolean).join("|")||p?.id||"");

function cleanCategory(v){
  const s=raw(v).toLowerCase();
  if(s.includes("watch"))return "Watch";
  if(s.includes("tool"))return "Tool";
  if(s.includes("strap")||s.includes("band"))return "Strap";
  if(s.includes("consum"))return "Consumable";
  if(s.includes("part"))return "Part";
  return CATEGORIES.includes(v)?v:"Other";
}
function normalise(rawItem={}){
  return {
    id:rawItem.id||`review-${Math.random().toString(36).slice(2,9)}`,
    sourceKey:keyFor(rawItem),
    pushId:raw(rawItem.pushId),
    source:raw(rawItem.source),
    orderId:raw(rawItem.orderId),
    itemName:raw(rawItem.itemName||rawItem.name)||"Purchase",
    category:cleanCategory(rawItem.category||rawItem.suggestedCategory),
    variant:raw(rawItem.variant),
    quantity:Number(rawItem.quantity)||1,
    amount:rawItem.amount==null?"":String(rawItem.amount),
    postage:rawItem.postage==null?"":String(rawItem.postage),
    currency:raw(rawItem.currency)||"AUD",
    status:raw(rawItem.status)||"Ordered",
    orderedAt:raw(rawItem.orderedAt||rawItem.purchaseDate),
    tracking:raw(rawItem.tracking),
    eta:raw(rawItem.eta),
    sourceRef:raw(rawItem.sourceRef),
    sourceMessageId:raw(rawItem.sourceMessageId||rawItem.emailMessageId),
    sourceSubject:raw(rawItem.sourceSubject||rawItem.emailSubject),
    notes:raw(rawItem.notes),
    confidence:raw(rawItem.confidence)||"Suggested",
    detectedAt:raw(rawItem.detectedAt||rawItem.createdAt)||now(),
    updatedAt:raw(rawItem.updatedAt)||now()
  };
}
function ensure(state){
  state.purchaseReview=Array.isArray(state.purchaseReview)?state.purchaseReview.map(normalise):[];
  return state.purchaseReview;
}
function incomingFrom(item){
  return {
    id:`buy-${Math.random().toString(36).slice(2,9)}`,
    sourceKey:item.sourceKey||keyFor(item),source:item.source,orderId:item.orderId,itemName:item.itemName,
    category:item.category,variant:item.variant,quantity:item.quantity,amount:item.amount,currency:item.currency,
    status:item.status||"Ordered",orderedAt:item.orderedAt,tracking:item.tracking,eta:item.eta,sourceRef:item.sourceRef,
    notes:[item.notes,item.sourceSubject?`Email: ${item.sourceSubject}`:""].filter(Boolean).join(" · "),
    createdAt:item.detectedAt||now(),updatedAt:now()
  };
}
function watchFrom(item){
  const price=item.amount===""?"":String(item.amount),postage=item.postage===""?"":String(item.postage);
  return blankJob({
    watchName:item.itemName||"Purchased watch",
    status:"Purchased",
    acquiredAt:item.orderedAt||item.detectedAt||now(),
    passport:{seller:item.source||"",invoiceNumber:item.orderId||"",notes:[item.variant,item.sourceRef].filter(Boolean).join(" · ")},
    business:{purchasePrice:price,postage},
    notes:[item.notes,item.sourceSubject?`Purchase email: ${item.sourceSubject}`:""].filter(Boolean).join("\n"),
    purchaseSource:{sourceKey:item.sourceKey,source:item.source,orderId:item.orderId,sourceRef:item.sourceRef,sourceMessageId:item.sourceMessageId,detectedAt:item.detectedAt}
  });
}
function categoryOptions(selected){return CATEGORIES.map(c=>`<option${c===selected?" selected":""}>${c}</option>`).join("");}
function detailBits(p){
  return [p.source,p.orderId?`Order ${p.orderId}`:"",p.variant,p.orderedAt,p.status].filter(Boolean);
}

async function start(){
  const tabs=$("tabs"),watchPanel=$("panel-watches");
  if(!tabs||!watchPanel)return;
  let state=await loadState();
  let list=ensure(state);

  const button=document.createElement("button");
  button.type="button";button.dataset.tab="review";button.innerHTML=`Review <span id="purchaseReviewCount" class="badge">${list.length}</span>`;
  const incomingBtn=tabs.querySelector('[data-tab="incoming"]');
  tabs.insertBefore(button,incomingBtn||null);

  const panel=document.createElement("section");
  panel.className="panel";panel.id="panel-review";panel.hidden=true;
  panel.innerHTML=`<section class="card"><div class="row" style="justify-content:space-between;align-items:center"><div><div class="kicker">PURCHASE INBOX</div><h3 style="margin:.2rem 0">Review detected purchases</h3><p class="muted small">Nothing is added to stock or jobs until you approve it.</p></div><span class="badge" id="purchaseReviewBadge">0</span></div><div id="purchaseReviewRows"></div><p class="muted small" id="purchaseReviewMsg"></p></section>`;
  watchPanel.parentNode.insertBefore(panel,watchPanel.nextSibling);

  const style=document.createElement("style");
  style.textContent=`.purchase-review-row{display:grid;grid-template-columns:minmax(0,1.5fr) .7fr .8fr auto;gap:9px;align-items:center;padding:11px 0;border-bottom:1px solid var(--line)}.purchase-review-row:last-child{border-bottom:0}.purchase-review-meta{display:flex;gap:5px;flex-wrap:wrap;margin-top:3px}.purchase-review-meta span{font-size:.63rem;color:var(--muted)}.purchase-review-actions{display:flex;gap:5px;flex-wrap:wrap}.purchase-review-row select{min-width:120px}.purchase-review-source{font-size:.62rem;color:var(--muted);margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:520px}@media(max-width:850px){.purchase-review-row{grid-template-columns:1fr}.purchase-review-actions .btn{flex:1}}`;
  document.head.appendChild(style);

  function activate(tab){
    document.querySelectorAll(".panel").forEach(x=>x.hidden=x.id!==`panel-${tab}`);
    tabs.querySelectorAll("button").forEach(b=>b.classList.toggle("on",b.dataset.tab===tab));
  }
  button.addEventListener("click",()=>activate("review"));

  async function refreshState(){state=await loadState();list=ensure(state);paint();}
  async function persist(message){await saveState(state);if($("purchaseReviewMsg"))$("purchaseReviewMsg").textContent=message||"Saved";paint();}
  function remove(id){state.purchaseReview=ensure(state).filter(x=>x.id!==id);list=state.purchaseReview;}
  function find(id){return ensure(state).find(x=>x.id===id);}
  function hasIncoming(sourceKey){return (state.incoming||[]).some(x=>keyFor(x)===sourceKey);}
  function hasWatch(sourceKey){return (state.jobs||[]).some(j=>j.purchaseSource?.sourceKey===sourceKey);}

  async function accept(id){
    const item=find(id);if(!item)return;
    item.category=cleanCategory(item.category);
    if(item.category==="Watch"){
      if(item.sourceKey&&hasWatch(item.sourceKey)){remove(id);await persist("That watch purchase is already a job.");return;}
      const job=watchFrom(item);state.jobs=Array.isArray(state.jobs)?state.jobs:[];state.jobs.push(job);state.currentId=job.id;remove(id);await saveState(state);location.href="summary.html?research=1";return;
    }
    if(item.sourceKey&&hasIncoming(item.sourceKey)){remove(id);await persist("That purchase is already in Incoming.");return;}
    state.incoming=Array.isArray(state.incoming)?state.incoming:[];state.incoming.unshift(incomingFrom(item));remove(id);await persist(`${item.itemName} sent to Incoming.`);
  }

  function paint(){
    list=ensure(state).sort((a,b)=>String(b.detectedAt||"").localeCompare(String(a.detectedAt||"")));
    const count=list.length;const c=$("purchaseReviewCount"),badge=$("purchaseReviewBadge");if(c)c.textContent=count;if(badge)badge.textContent=count;
    const root=$("purchaseReviewRows");if(!root)return;
    root.innerHTML=count?list.map(p=>`<div class="purchase-review-row" data-id="${escapeHtml(p.id)}"><div><strong>${escapeHtml(p.itemName)}</strong><div class="purchase-review-meta">${detailBits(p).map(x=>`<span>${escapeHtml(x)}</span>`).join("")}</div>${p.sourceSubject?`<div class="purchase-review-source">${escapeHtml(p.sourceSubject)}</div>`:""}</div><div><strong>${p.amount!==""?money(p.amount):"—"}</strong><div class="muted small">${escapeHtml(p.currency||"AUD")} · Qty ${p.quantity}</div></div><select class="purchase-review-category">${categoryOptions(p.category)}</select><div class="purchase-review-actions"><button class="btn accept-review" type="button">${p.category==="Watch"?"Create job":"Accept"}</button><button class="btn secondary dismiss-review" type="button">Dismiss</button></div></div>`).join(""):`<p class="empty">Nothing waiting for review.</p>`;
    root.querySelectorAll(".purchase-review-category").forEach(sel=>sel.onchange=async()=>{const p=find(sel.closest(".purchase-review-row").dataset.id);if(!p)return;p.category=sel.value;p.updatedAt=now();await saveState(state);paint();});
    root.querySelectorAll(".accept-review").forEach(b=>b.onclick=()=>accept(b.closest(".purchase-review-row").dataset.id));
    root.querySelectorAll(".dismiss-review").forEach(b=>b.onclick=async()=>{const id=b.closest(".purchase-review-row").dataset.id;remove(id);await persist("Suggestion dismissed.");});
  }

  window.addEventListener("focus",()=>setTimeout(refreshState,150));
  paint();
}

start().catch(err=>console.warn("Calibre purchase review unavailable",err));
