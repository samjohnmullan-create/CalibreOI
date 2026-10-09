import { loadState, saveState, escapeHtml } from "./store.js?v=26";
import { allItems, ITEM_PURPOSES, WORK_TYPES, normaliseWork, normaliseItem, itemDisplayName } from "./item-model.js?v=4";

const esc=escapeHtml;
const purposeLabel=v=>ITEM_PURPOSES.find(([k])=>k===v)?.[1]||"Resale";
const workTypeLabel=v=>WORK_TYPES.find(([k])=>k===v)?.[1]||"Work";
const activeLegacyStatus=s=>!["Sold","Ready to list","Archived","Spares"].includes(String(s||""));
const activeGenericStatus=s=>!["Complete","Cancelled"].includes(String(s||""));
const params=new URLSearchParams(location.search);
const view=params.get("view")==="service"?"service":"queue";

const state=await loadState();
state.workRecords=Array.isArray(state.workRecords)?state.workRecords:[];
state.items=Array.isArray(state.items)?state.items:[];
const num=v=>Number(v)||0;
function syncWorkRollups(){
 let changed=false;
 state.items=state.items.map(raw=>{
  const item=normaliseItem(raw),c=item.commercial||(item.commercial={});
  const records=state.workRecords.map(normaliseWork).filter(w=>String(w.itemId)===String(item.id)&&w.status!=="Cancelled");
  const nextCost=records.reduce((n,w)=>n+num(w.cost),0),nextLabour=records.reduce((n,w)=>n+num(w.labourMinutes),0);
  const oldCost=num(c.workRollupCost),oldLabour=num(c.workRollupLabourMinutes);
  const nextPreparation=Math.max(0,num(c.preparationCost)-oldCost)+nextCost;
  const nextMinutes=Math.max(0,num(c.labourMinutes)-oldLabour)+nextLabour;
  if(num(c.preparationCost)!==nextPreparation||num(c.labourMinutes)!==nextMinutes||oldCost!==nextCost||oldLabour!==nextLabour){
   c.preparationCost=String(nextPreparation||"");c.labourMinutes=String(nextMinutes||"");
   c.workRollupCost=String(nextCost||"");c.workRollupLabourMinutes=String(nextLabour||"");
   item.updatedAt=new Date().toISOString();changed=true;
  }
  return item;
 });
 return changed;
}
if(syncWorkRollups()) await saveState(state);
const items=allItems(state);
const byLegacy=new Map(items.filter(x=>x.legacyJobId).map(x=>[x.legacyJobId,x]));
const byId=new Map(items.map(x=>[String(x.id),x]));

const legacy=(state.jobs||[]).filter(j=>activeLegacyStatus(j.status)).map(j=>({
  kind:"watch", id:j.id, item:byLegacy.get(j.id), title:j.watchName||j.passport?.maker||"Untitled watch",
  type:"service", status:j.status||"On bench", opened:j.createdAt||"", job:j
}));
const generic=state.workRecords.map(normaliseWork).filter(w=>activeGenericStatus(w.status)).map(w=>({
  kind:"work", id:w.id, item:byId.get(String(w.itemId)), title:w.title||workTypeLabel(w.type),
  type:w.type, status:w.status||"Planned", opened:w.openedAt||w.createdAt||"", work:w
}));
const rows=[...legacy,...generic].sort((a,b)=>String(b.opened).localeCompare(String(a.opened)));

const shell=document.querySelector(".shell");
const watchHero=shell?.querySelector(".hero");
const stageList=document.getElementById("stageList");
const serviceCard=stageList?.nextElementSibling;
if(!shell||!watchHero) throw new Error("Workbench shell unavailable");

const style=document.createElement("style");
style.textContent=`
.workbench-tabs{display:flex;gap:3px;overflow-x:auto;border-bottom:1px solid var(--line);margin:0 0 12px;scrollbar-width:none}.workbench-tabs::-webkit-scrollbar{display:none}.workbench-tabs a{flex:0 0 auto;border-bottom:2px solid transparent;color:var(--muted);padding:8px 10px;font-size:.72rem;font-weight:800;text-decoration:none}.workbench-tabs a.on{color:var(--accent);border-bottom-color:var(--accent)}
.work-queue{margin:0 0 14px}.work-queue-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:10px}.work-queue-head h2{margin:2px 0 3px}.work-filters{display:grid;grid-template-columns:minmax(180px,1fr) 170px 165px 165px;gap:8px;margin-bottom:10px}.work-list{display:grid;gap:7px}.work-item{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;padding:10px 11px;border:1px solid var(--line);border-radius:9px;background:var(--surface);text-decoration:none;color:var(--ink)}.work-item:hover{border-color:var(--accent)}.work-item-meta{display:flex;gap:5px;flex-wrap:wrap;margin-top:4px}.work-pill{display:inline-flex;padding:3px 7px;border:1px solid var(--line);border-radius:999px;font-size:.61rem;font-weight:800;color:var(--muted)}.work-pill.purpose{color:var(--accent);border-color:color-mix(in srgb,var(--accent) 45%,var(--line))}.work-empty{padding:14px 4px;color:var(--muted)}.work-summary{display:flex;gap:8px;flex-wrap:wrap}.work-summary span{font-size:.68rem;color:var(--muted)}
@media(max-width:760px){.work-filters{grid-template-columns:1fr 1fr}.work-filters label:first-child{grid-column:1/-1}.work-item{grid-template-columns:1fr}.work-item .btn{justify-self:start}.workbench-tabs{border-bottom:0;gap:5px}.workbench-tabs a{border:1px solid var(--line);border-radius:999px;padding:6px 10px}.workbench-tabs a.on{background:color-mix(in srgb,var(--accent) 9%,var(--surface));border-color:var(--accent)}}
@media(max-width:480px){.work-filters{grid-template-columns:1fr}.work-filters label:first-child{grid-column:auto}}
`;
document.head.appendChild(style);

const tabs=document.createElement("nav");
tabs.className="workbench-tabs";
tabs.setAttribute("aria-label","Workbench sections");
tabs.innerHTML=`<a href="workbench.html?view=queue" class="${view==="queue"?"on":""}"${view==="queue"?' aria-current="page"':''}>Queue</a><a href="workbench.html?view=service" class="${view==="service"?"on":""}"${view==="service"?' aria-current="page"':''}>Current job</a>`;
const mainNav=document.querySelector("nav.mainnav");
(mainNav||shell.firstElementChild)?.insertAdjacentElement("afterend",tabs);

const section=document.createElement("section");
section.className="card work-queue";
section.innerHTML=`<div class="work-queue-head"><div><div class="kicker">WORK QUEUE</div><h2>Workbench queue</h2><div class="work-summary"><span id="wqTotal"></span><span id="wqWatch"></span><span id="wqGeneric"></span></div></div><a class="btn secondary" href="inventory.html">Items</a></div><div class="work-filters"><label>Search<input id="wqSearch" placeholder="Item, work type, status..."></label><label>Purpose<select id="wqPurpose"></select></label><label>Work type<select id="wqType"></select></label><label>Status<select id="wqStatus"></select></label></div><div id="wqList" class="work-list"></div>`;
watchHero.insertAdjacentElement("beforebegin",section);

function applyView(){
 const queueMode=view==="queue";
 section.hidden=!queueMode;
 watchHero.hidden=queueMode;
 if(stageList) stageList.hidden=queueMode;
 if(serviceCard) serviceCard.hidden=queueMode;
 document.querySelectorAll(".watch-strip,.watch-contextnav").forEach(el=>el.hidden=queueMode);
}
applyView();

const $=id=>document.getElementById(id);
$("wqPurpose").innerHTML='<option value="all">All purposes</option>'+ITEM_PURPOSES.map(([k,l])=>`<option value="${k}">${esc(l)}</option>`).join("");
$("wqType").innerHTML='<option value="all">All work types</option><option value="service">Watch service</option>'+WORK_TYPES.filter(([k])=>k!=="service").map(([k,l])=>`<option value="${k}">${esc(l)}</option>`).join("");
$("wqStatus").innerHTML='<option value="all">All statuses</option>'+[...new Set(rows.map(x=>x.status).filter(Boolean))].sort().map(s=>`<option>${esc(s)}</option>`).join("");

function itemPurpose(row){return row.item?.purpose||"resale"}
function hay(row){return [row.title,row.status,workTypeLabel(row.type),row.item?.title,row.item?.identity?.maker,purposeLabel(itemPurpose(row))].filter(Boolean).join(" ").toLowerCase()}
function render(){
 const q=$("wqSearch").value.trim().toLowerCase(),purpose=$("wqPurpose").value,type=$("wqType").value,status=$("wqStatus").value;
 const filtered=rows.filter(r=>(!q||hay(r).includes(q))&&(purpose==="all"||itemPurpose(r)===purpose)&&(type==="all"||r.type===type)&&(status==="all"||r.status===status));
 $("wqTotal").textContent=`${rows.length} active`;
 $("wqWatch").textContent=`${legacy.length} watch service${legacy.length===1?"":"s"}`;
 $("wqGeneric").textContent=`${generic.length} other work record${generic.length===1?"":"s"}`;
 $("wqList").innerHTML=filtered.length?filtered.map(r=>{const itemName=r.item?itemDisplayName(r.item):r.title,purpose=purposeLabel(itemPurpose(r)),kind=r.kind==="watch"?"Watch service":workTypeLabel(r.type),href=r.kind==="watch"?"#":`work.html?id=${encodeURIComponent(r.id)}`;return `<a class="work-item" href="${href}" data-kind="${r.kind}" data-id="${esc(r.id)}"><div><strong>${esc(itemName)}</strong><div class="muted small">${esc(r.kind==="watch"?(r.job?.jobId||r.title):(r.title||kind))}</div><div class="work-item-meta"><span class="work-pill">${esc(kind)}</span><span class="work-pill purpose">${esc(purpose)}</span><span class="work-pill">${esc(r.status)}</span></div></div><span class="btn secondary">Open</span></a>`}).join(""):"<div class='work-empty'>No active work matches these filters.</div>";
 $("wqList").querySelectorAll('[data-kind="watch"]').forEach(a=>a.onclick=async e=>{e.preventDefault();state.currentId=a.dataset.id;await saveState(state);location.href="workbench.html?view=service";});
}
["wqSearch","wqPurpose","wqType","wqStatus"].forEach(id=>$(id).addEventListener(id==="wqSearch"?"input":"change",render));
render();
