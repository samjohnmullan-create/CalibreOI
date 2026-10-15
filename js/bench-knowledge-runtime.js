import {loadStructuredBenchDetail} from './structured-cloud.js?v=4';
import {loadBenchKnowledgeSuggestions} from './bench-knowledge.js?v=1';

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeUrl=value=>{try{const u=new URL(String(value||''),location.href);return u.protocol==='https:'?u.href:'';}catch{return '';}};
const params=new URLSearchParams(location.search),workId=params.get('work')||params.get('id')||'';

function mount(){
  const exceptions=document.getElementById('exceptions')?.closest('.bench-card');if(!exceptions||document.querySelector('[data-bench-knowledge]'))return null;
  const card=document.createElement('section');card.className='bench-card';card.style.marginTop='10px';card.dataset.benchKnowledge='1';card.innerHTML='<div class="bench-label">Knowledge suggestions</div><div id="benchKnowledgeRows" class="bench-list"><div class="muted small">Checking Calibre Knowledge…</div></div><div id="benchKnowledgeWhy" class="bench-status"></div>';
  exceptions.insertAdjacentElement('afterend',card);return card;
}
function paint(result={}){
  const rows=document.getElementById('benchKnowledgeRows'),why=document.getElementById('benchKnowledgeWhy');if(!rows)return;
  const cards=result.rows||[];rows.innerHTML=cards.length?cards.map(row=>{const url=safeUrl(row.source);return `<div class="bench-list-row"><strong>${esc(row.title||'Knowledge')}</strong><div style="font-size:.59rem;color:var(--accent);font-weight:800;text-transform:uppercase;letter-spacing:.045em">${esc(row.level||'Reference')}</div>${row.detail?`<div style="margin-top:3px">${esc(row.detail)}</div>`:''}${row.relation?`<div class="muted" style="margin-top:4px;font-size:.61rem">Why shown: ${esc(row.relation)}</div>`:''}${url?`<a class="textbtn" style="display:inline-block;margin-top:5px;font-size:.62rem" href="${esc(url)}" target="_blank" rel="noopener">Open source ↗</a>`:''}</div>`;}).join(''):`<div class="bench-list-row">${esc(result.message||'No sourced Knowledge suggestion for this context.')}</div>`;
  const triggers=result.context?.triggers||[];why.textContent=triggers.length?`Triggered by: ${triggers.map(t=>t.kind).join(' · ')}`:'Knowledge stays quiet until there is movement or bench evidence to use.';
}

async function run(){if(!workId||!mount())return;try{const detail=await loadStructuredBenchDetail(workId),result=await loadBenchKnowledgeSuggestions(detail);paint(result);}catch(error){paint({rows:[],message:error?.message||'Knowledge suggestions unavailable.'});}}
run();
