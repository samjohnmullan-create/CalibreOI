import {loadState,saveState,escapeHtml} from './store.js?v=26';
import {resolveSaleContext,saleReadiness,listingSnapshot,ensureSale} from './sale-workspace.js?v=1';
import {mountListingPack} from './listing-pack.js?v=3';
import {mountChannelStrategy} from './channel-strategy.js?v=3';
import './sold-public-sync.js?v=1';

const esc=escapeHtml,params=new URLSearchParams(location.search);
let state=await loadState(),context=resolveSaleContext(state,{itemId:params.get('item')||params.get('id')||'',workId:params.get('work')||''}),item=context.item,work=context.work;
function row(x){return `<div class="sale-ready-row ${x.ok?'ok':'miss'}"><span>${x.ok?'✓':'○'}</span><div><strong>${esc(x.label)}</strong><small>${esc(x.detail||'')}${x.required?'':' · optional'}</small></div></div>`;}
function ensurePanel(){let panel=document.getElementById('saleReadinessPanel');if(panel)return panel;const host=document.querySelector('.sales-layout aside');if(!host)return null;panel=document.createElement('section');panel.id='saleReadinessPanel';panel.className='card';host.insertBefore(panel,host.firstChild);return panel;}
function paint(){if(!item)return;const panel=ensurePanel();if(!panel)return;const readiness=saleReadiness(item,work,state);panel.innerHTML=`<div class="row" style="justify-content:space-between;align-items:start"><div><h3 style="margin:0">Sale readiness</h3><p class="muted small" style="margin:3px 0 0">${readiness.requiredDone}/${readiness.requiredTotal} required · ${readiness.allDone}/${readiness.allTotal} total</p></div><span class="badge">${readiness.ready?'Ready':'Check first'}</span></div><div class="sale-ready-list">${readiness.checks.map(row).join('')}</div>`;}
const style=document.createElement('style');style.textContent=`.sale-ready-list{display:grid;gap:6px;margin-top:9px}.sale-ready-row{display:grid;grid-template-columns:18px 1fr;gap:7px;padding:7px;border:1px solid var(--line);border-radius:7px;background:var(--surface-2)}.sale-ready-row strong,.sale-ready-row small{display:block}.sale-ready-row small{font-size:.62rem;color:var(--muted);margin-top:2px}.sale-ready-row.ok>span{color:var(--ok);font-weight:900}.sale-ready-row.miss>span{color:var(--muted)}`;document.head.appendChild(style);
const save=async()=>{item.updatedAt=new Date().toISOString();await saveState(state);paint();};
paint();
if(item){mountChannelStrategy({item,work,save});mountListingPack({item,work,save});}
document.addEventListener('calibre:sale-updated',paint);
document.getElementById('generate')?.addEventListener('click',async()=>{if(!item)return;const sale=ensureSale(item);sale.listingPackSnapshot=listingSnapshot(item,work||{});await save();},true);
if(params.get('prepare')==='1'&&item){const readiness=saleReadiness(item,work,state),sale=ensureSale(item);sale.preparedAt=new Date().toISOString();sale.listingPackSnapshot=listingSnapshot(item,work||{});sale.readinessSnapshot={at:sale.preparedAt,ready:readiness.ready,requiredDone:readiness.requiredDone,requiredTotal:readiness.requiredTotal,missing:readiness.checks.filter(row=>row.required&&!row.ok).map(row=>row.id),photoPack:readiness.pack};await saveState(state);setTimeout(()=>{const generate=document.getElementById('generate'),listing=document.getElementById('listingText');if(generate&&listing&&!listing.value.trim()&&readiness.ready)generate.click();},200);}
