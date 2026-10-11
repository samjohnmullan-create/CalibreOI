import {loadState,saveState,escapeHtml} from './store.js?v=26';
import {itemDisplayName} from './item-model.js?v=5';
import {timingRuns,positionSummary,compareLatest,timingRunUsable} from './timing-runs.js';

if((location.pathname.split('/').pop()||'')==='timegrapher.html')enhance();

async function enhance(){
  let state=await loadState();
  const params=new URLSearchParams(location.search),requested=params.get('work')||params.get('id')||'';
  if(requested&&String(state.currentWorkId||'')!==String(requested)&&(state.workRecords||[]).some(w=>String(w.id)===String(requested))){
    state.currentWorkId=String(requested);await saveState(state);
    const guard='calibre-tg-work-'+requested;
    if(!sessionStorage.getItem(guard)){sessionStorage.setItem(guard,'1');location.reload();return;}
  }
  const work=(state.workRecords||[]).find(w=>String(w.id)===String(requested||state.currentWorkId))||(state.workRecords||[]).find(w=>!['Complete','Cancelled'].includes(w.status))||(state.workRecords||[])[0];
  if(!work)return;
  const item=(state.items||[]).find(i=>String(i.id)===String(work.itemId));
  const title=document.getElementById('watchTitle');if(title&&item)title.textContent=`${itemDisplayName(item)} · Timing`;
  const save=document.getElementById('save'),hint=document.getElementById('hint');
  document.addEventListener('click',e=>{
    if(e.target!==save)return;
    const conf=parseInt((document.getElementById('advConf')?.textContent||'').replace(/\D/g,''),10)||0;
    const samples=parseInt(document.getElementById('advSamples')?.textContent||'',10)||0;
    const rate=document.getElementById('advRate')?.textContent||'';
    if(conf<60||samples<10||!/[+-]?\d/.test(rate)){
      e.preventDefault();e.stopImmediatePropagation();
      if(hint)hint.textContent='Wait for a reliable reading before saving: at least 60% confidence and 10 stable samples.';
    }
  },true);
  addComparison(work,item);
}

function addComparison(work,item){
  if(document.querySelector('.tg-comparison'))return;
  const host=document.querySelector('.tg-shell');if(!host)return;
  const runs=timingRuns(work),positions=positionSummary(work),comparison=compareLatest(work),usable=runs.filter(timingRunUsable);
  const esc=v=>escapeHtml(String(v??'')),fmt=v=>v==null?'—':`${v>=0?'+':''}${Number(v).toFixed(1)} s/day`,beat=v=>v==null?'—':`${Number(v).toFixed(1)} ms`;
  const section=document.createElement('section');section.className='panel tg-comparison';
  section.innerHTML=`<div class="panel-head"><div><h3>Saved timing runs</h3><p>${esc(item?itemDisplayName(item):'Current item')} · ${usable.length} reliable of ${runs.length} saved runs</p></div><a class="btn secondary" href="work.html?id=${encodeURIComponent(work.id)}">Back to Work</a></div>${comparison?`<div class="tg-compare-grid"><div><span>Latest</span><strong>${fmt(comparison.latest.rateSecondsPerDay)}</strong><small>${esc(comparison.latest.phase)} · ${esc(comparison.latest.position)}</small></div><div><span>Previous</span><strong>${fmt(comparison.previous.rateSecondsPerDay)}</strong><small>${esc(comparison.previous.phase)} · ${esc(comparison.previous.position)}</small></div><div><span>Rate change</span><strong>${fmt(comparison.rateDelta)}</strong><small>${comparison.beatErrorDelta==null?'Beat error not comparable':`Beat error Δ ${beat(comparison.beatErrorDelta)}`}</small></div></div>`:'<p class="muted small">Save at least two reliable runs to see before/after comparison.</p>'}<div class="tg-position-list">${positions.length?positions.map(row=>`<div class="tg-position-row"><div><strong>${esc(row.position)}</strong><small>${row.count} reliable run${row.count===1?'':'s'} · ${Math.round(row.confidence*100)}% confidence</small></div><b>${fmt(row.rate)}</b><span>${beat(row.beatErrorMs)}</span></div>`).join(''):'<div class="muted small">No reliable positional runs saved yet.</div>'}</div>`;
  host.appendChild(section);
  const style=document.createElement('style');style.textContent=`.tg-compare-grid{display:grid;grid-template-columns:repeat(3,1fr);border:1px solid var(--line);border-radius:10px;overflow:hidden}.tg-compare-grid>div{padding:12px}.tg-compare-grid>div+div{border-left:1px solid var(--line)}.tg-compare-grid span,.tg-position-row small{display:block;color:var(--muted);font-size:.61rem}.tg-compare-grid strong{display:block;margin:4px 0;font-size:1rem}.tg-position-list{margin-top:12px}.tg-position-row{display:grid;grid-template-columns:minmax(0,1fr) 110px 90px;gap:10px;align-items:center;padding:9px 0;border-top:1px solid var(--line)}.tg-position-row strong,.tg-position-row b{font-size:.74rem}.tg-position-row>b,.tg-position-row>span{text-align:right;font-variant-numeric:tabular-nums}.tg-position-row>span{font-size:.68rem;color:var(--muted)}@media(max-width:640px){.tg-compare-grid{grid-template-columns:1fr}.tg-compare-grid>div+div{border-left:0;border-top:1px solid var(--line)}.tg-position-row{grid-template-columns:1fr auto}.tg-position-row>span{grid-column:2}}`;document.head.appendChild(style);
}
