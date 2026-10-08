import { loadState, saveState, current, escapeHtml } from "./store.js?v=26";
import { saleReadiness } from "./sale-readiness.js?v=3";
import { mountListingPack, makeListingPackSnapshot } from "./listing-pack.js?v=2";

const esc=escapeHtml;
let state=await loadState(),job=current(state);
function row(x){return `<div class="sale-ready-row ${x.ok?"ok":"miss"}"><span>${x.ok?"✓":"○"}</span><div><strong>${esc(x.label)}</strong><small>${esc(x.detail||"")}${x.required?"":" · optional"}</small></div></div>`;}
function ensurePanel(){let p=document.getElementById("saleReadinessPanel");if(p)return p;const host=document.querySelector(".sales-layout aside");if(!host)return null;p=document.createElement("section");p.id="saleReadinessPanel";p.className="card";host.insertBefore(p,host.firstChild);return p;}
function paint(){if(!job)return;const p=ensurePanel();if(!p)return;const r=saleReadiness(job);p.innerHTML=`<div class="row" style="justify-content:space-between;align-items:start"><div><h3 style="margin:0">Sale readiness</h3><p class="muted small" style="margin:3px 0 0">${r.requiredDone}/${r.requiredTotal} required · ${r.allDone}/${r.allTotal} total</p></div><span class="badge">${r.ready?"Ready":"Check first"}</span></div><div class="sale-ready-list">${r.items.map(row).join("")}</div>`;}
const style=document.createElement("style");style.textContent=`.sale-ready-list{display:grid;gap:6px;margin-top:9px}.sale-ready-row{display:grid;grid-template-columns:18px 1fr;gap:7px;padding:7px;border:1px solid var(--line);border-radius:7px;background:var(--surface-2)}.sale-ready-row strong,.sale-ready-row small{display:block}.sale-ready-row small{font-size:.62rem;color:var(--muted);margin-top:2px}.sale-ready-row.ok>span{color:var(--ok);font-weight:900}.sale-ready-row.miss>span{color:var(--muted)}`;document.head.appendChild(style);
paint();
if(job)mountListingPack({job,save:async()=>{await saveState(state);paint();}});
const params=new URLSearchParams(location.search);if(params.get("prepare")==="1"&&job){
  const r=saleReadiness(job);job.sale=job.sale||{};job.sale.preparedAt=new Date().toISOString();job.sale.listingPackSnapshot=makeListingPackSnapshot(job);job.sale.readinessSnapshot={at:job.sale.preparedAt,ready:r.ready,requiredDone:r.requiredDone,requiredTotal:r.requiredTotal,missing:r.items.filter(x=>x.required&&!x.ok).map(x=>x.id),qc:r.qc?.label||"",photoPack:r.photoPack||null};await saveState(state);setTimeout(()=>{const generate=document.getElementById("generate"),listing=document.getElementById("listingText");if(generate&&listing&&!listing.value.trim()&&r.ready)generate.click();},250);
}
