import {loadState,saveState,escapeHtml} from './store.js?v=8';
import {movementCatalog} from './knowledge-database.js?v=1';
import {rankMovementCatalog,finderLabel} from './movement-finder.js?v=2';

const $=id=>document.getElementById(id),esc=escapeHtml,params=new URLSearchParams(location.search);
let state=null,catalog=[],item=null,ready=false;

function resolveItem(){const workId=params.get('work')||'',work=(state?.work||[]).find(w=>String(w.id)===String(workId)),itemId=params.get('item')||params.get('id')||work?.itemId||state?.currentItemId||'';return(state?.items||[]).find(i=>String(i.id)===String(itemId))||null;}
function observed(){return{maker:$('maker')?.value||'',calibre:$('calibre')?.value||'',diameter:$('diameter')?.value||'',height:$('height')?.value||'',jewels:$('jewels')?.value||'',bph:$('bph')?.value||'',winding:$('winding')?.value||''};}
function prefill(){item=resolveItem();if(!item?.watch)return;const p=item.watch.passport||{},m=item.watch.movement||{};if(!$('maker').value)$('maker').value=p.movementMaker||m.maker||item.identity?.maker||'';if(!$('calibre').value)$('calibre').value=p.calibre||m.calibre||'';if(!$('diameter').value)$('diameter').value=p.movementMm||'';if(!$('jewels').value)$('jewels').value=p.jewels||'';if(!$('bph').value)$('bph').value=p.beatRate||'';if(!$('winding').value)$('winding').value=String(p.movementType||m.type||'').toLowerCase().includes('auto')?'automatic':String(p.movementType||m.type||'').toLowerCase().includes('manual')?'manual':'';$('itemNote').innerHTML=`Searching the full v25 database for <strong>${esc(item.title||'current Item')}</strong>. Choosing a result records it as <strong>Probable</strong>, never Confirmed.`;}
function meta(row){const m=row.movement,r=m.richSpec||{};return[m.diameter!=null?`${m.diameter} mm`:null,m.height!=null?`${m.height} mm high`:null,m.bph?`${m.bph} BPH`:null,m.jewels!=null?`${m.jewels} jewels`:null,m.winding||r.movement_type].filter(Boolean).join(' · ');}
function provenance(row){const m=row.movement,r=m.richSpec||{};if(r.source_url)return `<div class="source">Rich verified spec: <a href="${esc(r.source_url)}" target="_blank" rel="noopener">source</a></div>`;if(m.sourceId)return `<div class="source">v25 catalogue source ID ${esc(m.sourceId)} · catalogue evidence</div>`;return '<div class="source">v25 catalogue record</div>';}
function paint(rows){
  $('resultSummary').textContent=rows.length?`${rows.length} strongest evidence matches shown from ${catalog.length.toLocaleString()} calibre records.`:'No candidates matched the supplied evidence.';
  $('results').innerHTML=rows.length?rows.map((row,i)=>{const m=row.movement;return`<article class="result"><div><div class="kicker">#${i+1}</div><h4>${esc(m.maker)} ${esc(m.calibre)}</h4><div class="result-meta">${esc(meta(row)||'v25 catalogue record')}</div><div class="evidence">${row.evidence.map(e=>`<span>${esc(e)}</span>`).join('')}</div>${provenance(row)}</div><div class="score"><strong>${row.score}</strong><small>${esc(finderLabel(row.score))}</small>${item&&row.score>=40?`<button class="btn secondary use-full" data-index="${i}" type="button">Use as probable</button>`:''}</div></article>`}).join(''):'<div class="empty">No evidence match. Remove an uncertain clue rather than forcing a result.</div>';
  [...document.querySelectorAll('.use-full')].forEach(btn=>btn.onclick=()=>useCandidate(rows[Number(btn.dataset.index)]));
}
async function useCandidate(row){if(!item||!row)return;const m=row.movement,passport=item.watch.passport=item.watch.passport||{};passport.movementMaker=m.maker;passport.calibre=m.calibre;passport.fieldConfidence=passport.fieldConfidence||{};passport.fieldConfidence.calibre='Probable';passport.knowledgeCandidate={maker:m.maker,calibre:m.calibre,calibreId:m.id,evidenceScore:row.score,evidence:[...row.evidence],database:'v25-full',recordedAt:new Date().toISOString()};item.updatedAt=new Date().toISOString();await saveState(state);$('itemNote').innerHTML=`Saved <strong>${esc(m.maker)} ${esc(m.calibre)}</strong> as a Probable candidate from the full v25 database. Confirm it physically or from authoritative reference evidence before marking it Confirmed.`;}
function run(){if(!ready)return;paint(rankMovementCatalog(catalog,observed(),30));}
function clear(){['maker','calibre','diameter','height','jewels','bph'].forEach(id=>{if($(id))$(id).value='';});if($('winding'))$('winding').value='';$('results').innerHTML='<div class="empty">No search yet.</div>';$('resultSummary').textContent='Enter at least one clue.';}
async function init(){
  try{
    $('catalogState').textContent='Loading full v25 database…';
    [state,catalog]=await Promise.all([loadState(),movementCatalog()]);ready=true;item=resolveItem();prefill();
    $('catalogState').textContent=`${catalog.length.toLocaleString()} calibre records ready · full v25`;
    $('itemNote').innerHTML=item?`Searching the full v25 database for <strong>${esc(item.title||'current Item')}</strong>. Choosing a result records it as <strong>Probable</strong>, never Confirmed.`:'Full v25 database active. Results are evidence-ranked leads, not automatic identification.';
    $('searchBtn').onclick=run;$('clearBtn').onclick=clear;
    document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target?.closest?.('#maker,#calibre,#diameter,#height,#jewels,#bph,#winding')){e.preventDefault();e.stopImmediatePropagation();run();}},true);
    if(Object.values(observed()).some(v=>String(v||'').trim()))run();
  }catch(error){console.error('Full v25 Movement Finder failed',error);$('catalogState').textContent='Full database unavailable';$('itemNote').textContent=`Full v25 database failed to load: ${error.message||error}`;}
}
setTimeout(init,0);
