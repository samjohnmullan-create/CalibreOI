import {loadState,saveState,escapeHtml} from './store.js?v=26';
import {currentWork} from './work-model.js';
import {itemDisplayName} from './item-model.js?v=4';
import {partMatchSummary,recordPartMatchEvidence} from './parts-match-model.js';

const page=(location.pathname.split('/').pop()||'').split('?')[0];
if(page==='suppliers.html')enhanceParts();

async function enhanceParts(){
  const stockHost=document.getElementById('stock'),donorHost=document.getElementById('donors');
  if(!stockHost||!donorHost)return;
  let state=await loadState();
  state.items=Array.isArray(state.items)?state.items:[];
  state.workRecords=Array.isArray(state.workRecords)?state.workRecords:[];
  let work=currentWork(state);
  if(!work)return;

  const esc=v=>escapeHtml(String(v??''));
  const scoreClass=score=>score>=85?'likely':score>=60?'possible':score>=35?'measure':'weak';
  const sourceMeta=(row,type)=>{
    if(type==='stock'){
      const p=row.part||{};
      return [p.reference,p.calibre,p.quantity?`Qty ${p.quantity}`:'',p.storageLocation].filter(Boolean).join(' · ');
    }
    const d=row.donor||{};
    return [d.passport?.calibre,d.passport?.movementMm?`${d.passport.movementMm} mm`:'',d.storageLocation].filter(Boolean).join(' · ');
  };
  const resultLabel=e=>e?.result==='used'?'Used successfully':e?.result==='verified'?'Verified fit':e?.result==='ruledout'?'Ruled out':'';

  function controls(sourceType,sourceId,partId='',partName=''){
    const data=`data-source-type="${esc(sourceType)}" data-source-id="${esc(sourceId)}" data-part-id="${esc(partId)}" data-part-name="${esc(partName)}"`;
    return `<div class="parts-intel-actions"><button class="btn secondary" ${data} data-fit-result="verified">Verified fit</button><button class="btn secondary" ${data} data-fit-result="ruledout">Rule out</button><button class="btn secondary" ${data} data-fit-result="used">Used</button></div>`;
  }

  function paint(){
    const summary=partMatchSummary(work,state);
    stockHost.innerHTML=summary.inventory.length?summary.inventory.map(row=>{
      const p=row.part||{},history=resultLabel(row.evidence);
      return `<div class="parts-intel-row"><div class="parts-intel-top"><div><strong>${esc(p.name||p.reference||'Loose part')}</strong><div class="parts-intel-meta">${esc(sourceMeta(row,'stock')||'Loose stock')}</div></div><span class="parts-intel-score ${scoreClass(row.score)}">${row.score}% · ${esc(row.level)}</span></div><div class="parts-intel-reasons">${row.why.map(x=>`<span>${esc(x)}</span>`).join('')}</div>${history?`<div class="parts-intel-history">${esc(history)}</div>`:''}${controls('stock',p.id,p.id,p.name||'')}</div>`;
    }).join(''):'<p class="muted small">No available loose stock to compare.</p>';

    donorHost.innerHTML=summary.donors.length?summary.donors.map(row=>{
      const d=row.donor||{},history=resultLabel(row.evidence),title=d.title||itemDisplayName(state.items.find(x=>String(x.id)===String(d.id))||{});
      return `<div class="parts-intel-row"><div class="parts-intel-top"><div><strong>${esc(title||'Donor Item')}</strong><div class="parts-intel-meta">${esc(sourceMeta(row,'donor')||'Donor Item')}</div></div><span class="parts-intel-score ${scoreClass(row.score)}">${row.score}% · ${esc(row.level)}</span></div><div class="parts-intel-reasons">${row.why.map(x=>`<span>${esc(x)}</span>`).join('')}</div>${history?`<div class="parts-intel-history">${esc(history)}</div>`:''}${controls('donorItem',d.id,'','')}</div>`;
    }).join(''):'<p class="muted small">No donor Items recorded.</p>';

    document.querySelectorAll('[data-fit-result]').forEach(btn=>btn.onclick=async()=>{
      const result=btn.dataset.fitResult,note=result==='ruledout'?prompt('Why was this source ruled out? Optional bench note:','')||'':'';
      recordPartMatchEvidence(state,work,{sourceType:btn.dataset.sourceType,sourceId:btn.dataset.sourceId,partId:btn.dataset.partId||'',partName:btn.dataset.partName||''},{result,note});
      await saveState(state);
      state=await loadState();work=currentWork(state)||work;
      paint();
    });
  }

  const style=document.createElement('style');
  style.textContent=`
  .parts-intel-row{padding:12px 0;border-top:1px solid var(--line)}.parts-intel-row:first-child{border-top:0}.parts-intel-top{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.parts-intel-meta{font-size:.68rem;color:var(--muted);margin-top:3px}.parts-intel-score{flex:0 0 auto;border:1px solid var(--line);border-radius:999px;padding:4px 7px;font-size:.61rem;font-weight:800}.parts-intel-score.likely{color:var(--ok);border-color:color-mix(in srgb,var(--ok) 55%,var(--line))}.parts-intel-score.possible{color:var(--accent)}.parts-intel-score.measure{color:var(--muted)}.parts-intel-reasons{display:flex;gap:5px;flex-wrap:wrap;margin-top:8px}.parts-intel-reasons span{font-size:.61rem;padding:3px 6px;border-radius:999px;background:var(--surface-2);color:var(--muted)}.parts-intel-history{font-size:.66rem;color:var(--ok);font-weight:800;margin-top:7px}.parts-intel-actions{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}.parts-intel-actions .btn{min-height:32px;padding:5px 8px;font-size:.64rem}@media(max-width:760px){.parts-intel-top{display:grid;grid-template-columns:1fr}.parts-intel-score{justify-self:start}.parts-intel-actions .btn{flex:1 1 90px;min-height:40px}}
  `;
  document.head.appendChild(style);

  const req=document.getElementById('requirements');
  if(req)new MutationObserver(async()=>{state=await loadState();work=currentWork(state)||work;paint();}).observe(req,{childList:true,subtree:true});
  paint();
}
