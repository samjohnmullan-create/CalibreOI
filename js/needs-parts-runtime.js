import { loadState, current, escapeHtml } from "./store.js?v=26";
import { compatibilitySummary } from "./parts-intelligence.js?v=4";

const esc=escapeHtml;
const MAX_PER_GROUP=3;

function pill(level="Not enough evidence"){
  const cls=level==="Likely"?"ok":level==="Possible"?"accent":level==="Measure first"?"warn":"muted";
  return `<span class="npr-pill ${cls}">${esc(level)}</span>`;
}
function evidenceText(e){
  if(!e)return "";
  const label=e.result==="used"?"Previously used":e.result==="verified"?"Verified fit":"Previously ruled out";
  return `<div class="npr-evidence"><strong>${esc(label)}</strong>${e.note?` · ${esc(e.note)}`:""}</div>`;
}
function whyText(list=[]){
  const useful=list.filter(Boolean).slice(0,2);
  return useful.length?`<div class="npr-why">${useful.map(esc).join(" · ")}</div>`:"";
}
function stockRow(x){
  const p=x.part||{};
  return `<div class="npr-row"><div class="npr-main"><strong>${esc(p.name||"Unnamed part")}</strong><small>${esc([p.calibre,p.reference,p.location].filter(Boolean).join(" · ")||"Loose parts stock")}</small>${evidenceText(x.evidence)}${whyText(x.why)}</div><div class="npr-score">${pill(x.level)}<span>${Number(x.score)||0}</span></div></div>`;
}
function donorRow(x){
  const d=x.donor||{},p=d.passport||{},kept=(x.kept||[]).map(k=>k.name).filter(Boolean).slice(0,3).join(", ");
  return `<div class="npr-row"><div class="npr-main"><strong>${esc(d.watchName||"Unnamed donor")}</strong><small>${esc([p.maker,p.calibre,d.storageLocation&&`Stored: ${d.storageLocation}`,kept&&`Available: ${kept}`].filter(Boolean).join(" · ")||"Donor watch")}</small>${evidenceText(x.evidence)}${whyText(x.why)}</div><div class="npr-score">${pill(x.level)}<span>${Number(x.score)||0}</span></div></div>`;
}
function historyRows(history=[]){
  if(!history.length)return "<span class='muted small'>No previous fit decisions for this watch/calibre yet.</span>";
  return history.slice(0,5).map(e=>{const label=e.result==="used"?"Used":e.result==="verified"?"Verified":"Ruled out";return `<span class="npr-history-pill"><strong>${esc(label)}</strong> ${esc(e.partName||e.sourceType||"part")}${e.note?` · ${esc(e.note)}`:""}</span>`;}).join("");
}
function ensureStyle(){
  if(document.getElementById("needsPartsRuntimeStyle"))return;
  const style=document.createElement("style");style.id="needsPartsRuntimeStyle";style.textContent=`
  #needsPartsMatches{margin-top:12px;border-color:color-mix(in srgb,var(--accent) 45%,var(--line));background:color-mix(in srgb,var(--accent) 3%,var(--surface))}
  .npr-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.npr-head h3{margin:2px 0 4px}.npr-actions{display:flex;gap:6px;flex-wrap:wrap}.npr-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:10px}.npr-grid h4{margin:0 0 4px;font-size:.7rem;text-transform:uppercase;letter-spacing:.06em;color:var(--muted)}.npr-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;padding:9px 0;border-bottom:1px solid var(--line)}.npr-row:last-child{border-bottom:0}.npr-main strong{display:block;font-size:.76rem}.npr-main small{display:block;color:var(--muted);font-size:.64rem;margin-top:2px}.npr-score{display:flex;gap:5px;align-items:flex-start}.npr-score>span:last-child{font-size:.6rem;color:var(--muted);padding-top:4px}.npr-pill{display:inline-flex;border:1px solid var(--line);border-radius:999px;padding:3px 6px;font-size:.58rem;font-weight:800;white-space:nowrap}.npr-pill.ok{color:var(--ok);border-color:var(--ok)}.npr-pill.accent{color:var(--accent);border-color:var(--accent)}.npr-pill.warn{color:#a36f32;border-color:#a36f32}.npr-pill.muted{color:var(--muted)}.npr-why{font-size:.62rem;color:var(--muted);margin-top:4px;line-height:1.35}.npr-evidence{font-size:.62rem;margin-top:4px;color:var(--ok)}.npr-history{display:flex;gap:5px;flex-wrap:wrap;margin-top:10px;padding-top:9px;border-top:1px solid var(--line)}.npr-history-pill{font-size:.6rem;padding:4px 7px;border:1px solid var(--line);border-radius:999px;color:var(--muted)}.npr-empty{padding:9px 0;color:var(--muted);font-size:.68rem}.npr-trigger{display:inline-flex;align-items:center;gap:5px;font-size:.62rem;color:var(--accent);font-weight:800}
  @media(max-width:760px){.npr-grid{grid-template-columns:1fr}.npr-head{display:grid}.npr-actions .btn{flex:1}}
  `;document.head.appendChild(style);
}
function targetAnchor(){
  const parts=document.getElementById("parts");
  if(parts)return parts;
  return document.getElementById("faults")||document.querySelector("section.card");
}
function remove(){document.getElementById("needsPartsMatches")?.remove();}
async function refresh(){
  ensureStyle();remove();
  let state;try{state=await loadState();}catch(err){console.warn("Parts match panel could not read state",err);return;}
  const job=current(state);if(!job||job.status!=="Awaiting parts")return;
  const {inventory,donors,history}=compatibilitySummary(job,state);
  const stock=inventory.filter(x=>x.evidence||x.score>=20).slice(0,MAX_PER_GROUP);
  const donor=donors.filter(x=>x.evidence||x.score>=20).slice(0,MAX_PER_GROUP);
  const p=job.passport||{},box=document.createElement("section");box.className="card";box.id="needsPartsMatches";
  box.innerHTML=`<div class="npr-head"><div><div class="kicker">AWAITING PARTS · AUTO MATCH</div><h3>Best matches already in Calibre</h3><p class="muted small" style="margin:0">${esc(job.watchName||"Open watch")}${p.calibre?` · cal. ${esc(p.calibre)}`:""}. Bench evidence ranks above similarity.</p></div><div class="npr-actions"><span class="npr-trigger">● searched automatically</span><a class="btn secondary" href="passport.html">Identity</a><a class="btn" href="suppliers.html">Open Parts</a></div></div><div class="npr-grid"><div><h4>Loose parts stock</h4>${stock.length?stock.map(stockRow).join(""):`<div class="npr-empty">No useful loose-stock match yet${p.calibre?".":" — add the calibre or movement details to improve matching."}</div>`}</div><div><h4>Donor watches</h4>${donor.length?donor.map(donorRow).join(""):`<div class="npr-empty">No donor currently ranks as a useful match${p.calibre?".":" — identity data will make donor matching much stronger."}</div>`}</div></div><div class="npr-history"><strong class="muted small" style="width:100%">Previous fit evidence</strong>${historyRows(history)}</div>`;
  const anchor=targetAnchor();if(anchor)anchor.insertAdjacentElement("afterend",box);
}

let clickTimer=0;
function scheduleRefresh(delay=80){clearTimeout(clickTimer);clickTimer=setTimeout(()=>refresh().catch(err=>console.warn("Parts auto-match refresh failed",err)),delay);}

const awaitButton=document.getElementById("awaitParts");
if(awaitButton)awaitButton.addEventListener("click",()=>scheduleRefresh(450));
window.addEventListener("calibre:parts-status-changed",()=>scheduleRefresh(50));
window.addEventListener("calibre:workbench-repaint",()=>scheduleRefresh(50));
refresh().catch(err=>console.warn("Parts auto-match unavailable",err));
