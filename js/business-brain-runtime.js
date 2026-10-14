import {loadState} from './store.js?v=26';
import {itemDisplayName} from './item-model.js?v=4';
import {rankWorkNext,businessSnapshot} from './business-brain.js?v=1';

const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[ch]));
const money=v=>new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD',maximumFractionDigits:0}).format(Number(v)||0);
const itemHref=id=>`item.html?id=${encodeURIComponent(id)}`;
const workHref=entry=>entry.p.work.active?.id?`work.html?id=${encodeURIComponent(entry.p.work.active.id)}`:itemHref(entry.item.id);

function metric(label,value,sub=''){return `<div class="biz-metric"><span>${esc(label)}</span><strong>${esc(value)}</strong>${sub?`<small>${esc(sub)}</small>`:''}</div>`;}
function mountAcquisitionLink(){const head=document.querySelector('.business-head');if(!head||document.getElementById('openAcquisition'))return;const link=document.createElement('a');link.id='openAcquisition';link.href='acquisition.html';link.className='btn secondary';link.textContent='Acquisition';link.style.textDecoration='none';head.appendChild(link);}
function mount(){
  mountAcquisitionLink();
  if(document.getElementById('businessBrain'))return;
  const overview=document.getElementById('panel-overview');
  const attention=document.querySelector('#panel-overview .biz-card:last-child');
  if(!overview)return;
  const section=document.createElement('section');
  section.className='biz-card business-brain';
  section.id='businessBrain';
  section.innerHTML='<div class="kicker">BUSINESS BRAIN</div><h3>What should I work on next?</h3><p class="muted small brain-intro">Ranks saleable stock by likely return, time, ageing capital and whether the work can actually move forward.</p><div class="biz-metrics" id="brainMetrics"></div><div id="brainRows"></div><p class="muted small" id="brainNote"></p>';
  if(attention)overview.insertBefore(section,attention);else overview.appendChild(section);
}

function reasonLine(entry){return entry.p.reasons.slice(0,3).join(' · ');}
function row(entry,index){const {item,p}=entry,e=p.e,rank=index+1,blocked=p.work.blocked;return `<a class="biz-row brain-row" href="${workHref(entry)}"><span><span class="brain-rank">${rank}</span><strong>${esc(itemDisplayName(item))}</strong><small>${esc(reasonLine(entry))}</small></span><span class="biz-row-value"><strong>${p.score}</strong><small>${blocked?'Blocked':`${money(e.after)} after labour`}</small></span></a>`;}

async function paint(){
  mount();
  const state=await loadState(),ranked=rankWorkNext(state),snap=businessSnapshot(state),opportunities=(state.incoming||[]).filter(row=>row?.recordType==='acquisition-candidate'&&!row.convertedItemId).length;
  const metrics=document.getElementById('brainMetrics'),rows=document.getElementById('brainRows'),note=document.getElementById('brainNote');
  if(!metrics||!rows||!note)return;
  metrics.innerHTML=metric('Capital tied up',money(snap.capital),`${snap.stockCount} unsold`)+metric('Potential after labour',money(snap.afterLabour))+metric('Aged 90+ days',String(snap.agedCount),snap.agedCount?'Capital needs attention':'Healthy')+metric('Acquisition watchlist',String(opportunities),opportunities?'Open Acquisition to review':'No saved opportunities');
  rows.innerHTML=ranked.length?ranked.slice(0,8).map(row).join(''):'<p class="muted">No saleable stock to rank yet.</p>';
  const top=ranked[0];
  note.textContent=top?`Top recommendation: ${itemDisplayName(top.item)}. Score ${top.p.score}. ${top.p.confidence==='low'?'Set a target sale to improve confidence.':'Open it to continue the next actionable step.'}`:'Add saleable Items and commercial targets to start prioritising work.';
}

const style=document.createElement('style');style.textContent=`
.business-head{display:flex;align-items:end;justify-content:space-between;gap:10px;flex-wrap:wrap}.business-brain{border-color:color-mix(in srgb,var(--accent) 32%,var(--line));background:linear-gradient(180deg,color-mix(in srgb,var(--accent) 3%,var(--surface)),var(--surface))}.brain-intro{margin:-6px 0 12px}.brain-row>span:first-child{display:grid;grid-template-columns:28px minmax(0,1fr);column-gap:8px;align-items:center}.brain-row small{grid-column:2}.brain-rank{width:26px;height:26px;border-radius:50%;display:grid;place-items:center;background:var(--surface-2);color:var(--accent);font-size:.68rem;font-weight:900}.brain-row .biz-row-value strong{font-size:1rem}.brain-row .biz-row-value small{grid-column:auto}@media(max-width:620px){.business-brain .biz-metrics{grid-template-columns:1fr 1fr}.brain-row>span:first-child{grid-template-columns:24px minmax(0,1fr)}.brain-rank{width:22px;height:22px}#openAcquisition{width:100%;justify-content:center}}
`;document.head.appendChild(style);
paint().catch(err=>console.warn('Business Brain unavailable',err));
