import {loadState,saveState} from './store.js?v=26';
import {allItems,itemDisplayName,ITEM_TYPES} from './item-model.js?v=4';

const $=id=>document.getElementById(id);
const num=v=>Number(v)||0;
const money=v=>new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD',minimumFractionDigits:2,maximumFractionDigits:2}).format(num(v));
const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const dateMs=v=>{const n=Date.parse(v||'');return Number.isFinite(n)?n:0;};
const typeLabel=type=>ITEM_TYPES.find(([key])=>key===type)?.[1]||'Other';
let state=await loadState();
state.items=Array.isArray(state.items)?state.items:[];
state.workRecords=Array.isArray(state.workRecords)?state.workRecords:[];
state.ledger=Array.isArray(state.ledger)?state.ledger:[];

function commercial(item){return item.commercial&&typeof item.commercial==='object'?item.commercial:{};}
function acquiredDate(item){return commercial(item).acquiredAt||item.createdAt||'';}
function directCost(item){const c=commercial(item);return ['purchasePrice','buyerPremium','postage','preparationCost','repairCost','partsCost','consumables','externalService','marketplaceFees','shippingToBuyer','otherCost'].reduce((sum,key)=>sum+num(c[key]),0);}
function labourCost(item){const c=commercial(item);return num(c.labourMinutes)/60*num(c.labourRate);}
function targetSale(item){return num(commercial(item).targetSale);}
function actualSale(item){return num(commercial(item).actualSale);}
function isSold(item){return item.status==='Sold'||actualSale(item)>0;}
function resaleItems(){return allItems(state).filter(item=>item.purpose==='resale');}
function activeStock(){return resaleItems().filter(item=>!isSold(item)&&item.status!=='Archived');}
function soldItems(){return resaleItems().filter(isSold);}
function economics(item,sold=false){const cost=directCost(item),sale=sold?actualSale(item):targetSale(item),cash=sale-cost,labour=labourCost(item);return {cost,sale,cash,labour,after:cash-labour,roi:cost?cash/cost:0};}
function daysOwned(item){const at=dateMs(acquiredDate(item));return at?Math.max(0,Math.floor((Date.now()-at)/86400000)):0;}
function metric(label,value,sub=''){return `<div class="biz-metric"><span>${esc(label)}</span><strong>${esc(value)}</strong>${sub?`<small>${esc(sub)}</small>`:''}</div>`;}
function itemLink(item){return `item.html?id=${encodeURIComponent(item.id)}`;}
function row(item,right,meta=''){return `<a class="biz-row" href="${itemLink(item)}"><span><strong>${esc(itemDisplayName(item))}</strong><small>${esc(typeLabel(item.type))}${meta?` · ${esc(meta)}`:''}</small></span><span class="biz-row-value">${right}</span></a>`;}
function realCash(){return state.ledger.reduce((total,entry)=>{const amount=num(entry.amount);if(entry.kind==='in')return total+amount;if(entry.kind==='out'||entry.kind==='taken')return total-amount;return total;},0);}

function paintOverview(){
  const stock=activeStock(),sold=soldItems();
  const tied=stock.reduce((n,item)=>n+directCost(item),0);
  const target=stock.reduce((n,item)=>n+targetSale(item),0);
  const projected=stock.reduce((n,item)=>n+economics(item).cash,0);
  const realised=sold.reduce((n,item)=>n+economics(item,true).cash,0);
  $('headline').innerHTML=metric('Available cash',money(realCash()),'Ledger only — no projections')+metric('Capital in stock',money(tied),`${stock.length} unsold item${stock.length===1?'':'s'}`)+metric('Potential cash profit',money(projected),target?`${money(target)} target sales`:'Targets not set')+metric('Realised cash profit',money(realised),`${sold.length} sold item${sold.length===1?'':'s'}`);
  const attention=[];
  stock.filter(item=>!targetSale(item)).forEach(item=>attention.push({item,reason:'No target sale set'}));
  stock.filter(item=>daysOwned(item)>90).forEach(item=>attention.push({item,reason:`${daysOwned(item)} days in stock`}));
  $('attentionRows').innerHTML=attention.length?attention.slice(0,8).map(x=>row(x.item,'→',x.reason)).join(''):'<p class="muted">Nothing urgent in stock right now.</p>';
  const top=stock.map(item=>({item,e:economics(item)})).sort((a,b)=>b.e.cash-a.e.cash).slice(0,5);
  $('overviewStock').innerHTML=top.length?top.map(x=>row(x.item,`<strong>${money(x.e.cash)}</strong>`,`Target ${x.e.sale?money(x.e.sale):'not set'}`)).join(''):'<p class="muted">No saleable stock yet.</p>';
  const byType=new Map();
  for(const item of sold){const key=item.type||'other',e=economics(item,true),g=byType.get(key)||{count:0,cash:0,cost:0};g.count++;g.cash+=e.cash;g.cost+=e.cost;byType.set(key,g);}
  const leaders=[...byType.entries()].sort((a,b)=>b[1].cash-a[1].cash).slice(0,4);
  $('overviewPerformance').innerHTML=leaders.length?leaders.map(([type,g])=>`<div class="biz-row static"><span><strong>${esc(typeLabel(type))}</strong><small>${g.count} sold</small></span><span class="biz-row-value"><strong>${money(g.cash)}</strong><small>${g.cost?Math.round(g.cash/g.cost*100):0}% ROI</small></span></div>`).join(''):'<p class="muted">Performance appears after sales are recorded.</p>';
}

function paintStock(){
  const records=activeStock().map(item=>({item,e:economics(item),age:daysOwned(item)})).sort((a,b)=>b.e.cash-a.e.cash);
  const tied=records.reduce((n,x)=>n+x.e.cost,0),potential=records.reduce((n,x)=>n+x.e.cash,0),after=records.reduce((n,x)=>n+x.e.after,0);
  $('stockMetrics').innerHTML=metric('Capital tied up',money(tied),`${records.length} items`)+metric('Potential cash profit',money(potential))+metric('After labour',money(after))+metric('Average age',records.length?`${Math.round(records.reduce((n,x)=>n+x.age,0)/records.length)} days`:'—');
  $('stockRows').innerHTML=records.length?records.map(({item,e,age})=>row(item,`<strong>${money(e.cash)}</strong><small>${Math.round(e.roi*100)}% ROI</small>`,`Invested ${money(e.cost)} · Target ${e.sale?money(e.sale):'not set'} · ${age}d`)).join(''):'<p class="muted">No unsold stock.</p>';
}

function paintPerformance(){
  const sold=soldItems();
  const groups=new Map();
  for(const item of sold){const type=item.type||'other',e=economics(item,true),g=groups.get(type)||{type,count:0,cost:0,sales:0,cash:0,after:0};g.count++;g.cost+=e.cost;g.sales+=e.sale;g.cash+=e.cash;g.after+=e.after;groups.set(type,g);}
  const rows=[...groups.values()].sort((a,b)=>b.after-a.after);
  $('performanceRows').innerHTML=rows.length?rows.map(g=>`<div class="performance-row"><span><strong>${esc(typeLabel(g.type))}</strong><small>${g.count} sold · ${money(g.sales)} sales</small></span><span><small>Cash profit</small><strong>${money(g.cash)}</strong></span><span><small>After labour</small><strong>${money(g.after)}</strong></span><span><small>ROI</small><strong>${g.cost?Math.round(g.cash/g.cost*100):0}%</strong></span></div>`).join(''):'<p class="muted">No completed sales yet.</p>';
  const best=sold.map(item=>({item,e:economics(item,true)})).sort((a,b)=>b.e.after-a.e.after).slice(0,8);
  $('leaderRows').innerHTML=best.length?best.map(x=>row(x.item,`<strong>${money(x.e.after)}</strong>`,`Cash ${money(x.e.cash)} · ${Math.round(x.e.roi*100)}% ROI`)).join(''):'<p class="muted">No sold items yet.</p>';
}

function paintActivity(){
  const entries=[...state.ledger].sort((a,b)=>dateMs(b.when||b.date)-dateMs(a.when||a.date));
  $('activityRows').innerHTML=entries.length?entries.slice(0,50).map(entry=>`<div class="biz-row static"><span><strong>${esc(entry.note||entry.category||'Business movement')}</strong><small>${esc(entry.when||entry.date||'No date')} · ${esc(entry.method||'')}</small></span><span class="biz-row-value ${entry.kind==='in'?'positive':''}"><strong>${entry.kind==='in'?'+':'−'}${money(entry.amount)}</strong><small>${esc(entry.category||'')}</small></span></div>`).join(''):'<p class="muted">No business movements recorded.</p>';
}
function paint(){paintOverview();paintStock();paintPerformance();paintActivity();}
for(const button of document.querySelectorAll('[data-panel]'))button.addEventListener('click',()=>{document.querySelectorAll('[data-panel]').forEach(x=>x.classList.toggle('on',x===button));document.querySelectorAll('.business-panel').forEach(panel=>panel.hidden=panel.id!==`panel-${button.dataset.panel}`);});
document.querySelectorAll('.tab-jump').forEach(button=>button.addEventListener('click',()=>document.querySelector(`[data-panel="${button.dataset.target}"]`)?.click()));
$('addMovement')?.addEventListener('click',async()=>{const amount=num($('amount').value);if(!amount)return;$('addMovement').disabled=true;state.ledger.push({id:`ledger-${Date.now().toString(36)}`,kind:$('kind').value,category:$('category').value,method:$('method').value,amount,when:$('when').value,note:$('note').value,createdAt:new Date().toISOString()});await saveState(state);$('amount').value='';$('note').value='';$('addMovement').disabled=false;paint();});
const today=new Date();$('when').value=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
paint();
