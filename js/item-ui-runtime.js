import {loadState} from './store.js?v=26';
import {submitResearchRequest} from './research-request.js?v=3';

const tabs=document.getElementById('itemTabs');
const head=document.querySelector('.item-head');
if(tabs&&head){
  document.body.classList.add('item-workspace-mode');
  const params=new URLSearchParams(location.search),itemId=params.get('id')||'';
  const AREAS={
    Work:['work','prep'],
    Item:['overview','identity','condition','research','record'],
    Commerce:['costs','sale']
  };
  const areaFor=panel=>Object.entries(AREAS).find(([,panels])=>panels.includes(panel))?.[0]||'Item';
  const preferred={Work:'work',Item:'overview',Commerce:'costs'};
  const areaNav=document.createElement('nav');
  areaNav.className='item-area-nav';
  areaNav.setAttribute('aria-label','Item workspace');
  areaNav.innerHTML=Object.keys(AREAS).map(name=>`<button type="button" data-area="${name}">${name}</button>`).join('');
  tabs.insertAdjacentElement('beforebegin',areaNav);

  const back=head.querySelector('a[href="inventory.html"]');
  const quick=document.createElement('div');
  quick.className='item-quick-actions';
  quick.innerHTML=`${itemId?`<button class="btn" id="requestResearch" type="button">Request research</button><a class="btn secondary" href="workbench.html">Workbench</a><a class="btn secondary" href="passport.html?id=${encodeURIComponent(itemId)}">Passport</a><a class="btn secondary" href="capture.html?item=${encodeURIComponent(itemId)}">Capture</a>`:`<a class="btn secondary" href="workbench.html">Workbench</a>`}`;
  if(back){back.replaceWith(quick);quick.appendChild(back);back.textContent='Items';}
  else head.appendChild(quick);

  const researchBar=document.createElement('div');
  researchBar.className='item-research-ref';
  researchBar.hidden=true;
  researchBar.innerHTML=`<div><span class="item-research-label">CHATGPT RESEARCH REFERENCE</span><code id="researchReference"></code><span class="muted small" id="researchReferenceStatus"></span></div><div class="item-research-actions"><button class="btn" id="shareResearchReference" type="button">Share to ChatGPT</button><button class="btn secondary" id="copyResearchReference" type="button">Copy for ChatGPT</button></div>`;
  head.insertAdjacentElement('afterend',researchBar);
  const requestBtn=document.getElementById('requestResearch'),shareBtn=document.getElementById('shareResearchReference'),copyBtn=document.getElementById('copyResearchReference'),refEl=document.getElementById('researchReference'),refStatus=document.getElementById('researchReferenceStatus');
  const reference=id=>id?`CALIBRE-RESEARCH:${id}`:'';
  const setReference=(id,status='')=>{
    if(!id&&!status){researchBar.hidden=true;return;}
    researchBar.hidden=false;
    refEl.textContent=id?reference(id):'Research request not created';
    refStatus.textContent=status;
    copyBtn.hidden=!id;
    shareBtn.hidden=!id;
  };
  const chooseWork=(state,item)=>{
    const linked=(state.work||[]).filter(w=>String(w.itemId)===String(item?.id));
    return linked.find(w=>!['Complete','Cancelled'].includes(w.status))||linked.sort((a,b)=>String(b.updatedAt||b.openedAt||b.createdAt||'').localeCompare(String(a.updatedAt||a.openedAt||a.createdAt||'')))[0]||{};
  };
  const currentRecord=async()=>{
    const state=await loadState();
    state.items=Array.isArray(state.items)?state.items:[];
    state.work=Array.isArray(state.work)?state.work:[];
    const item=state.items.find(x=>String(x.id)===String(itemId));
    return {state,item,work:chooseWork(state,item)};
  };
  const copyText=async text=>{
    try{await navigator.clipboard.writeText(text);return true;}catch{
      try{const ta=document.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();return true;}catch{return false;}
    }
  };
  const hydrateResearchReference=async()=>{
    if(!itemId)return;
    try{
      const {item}=await currentRecord(),existing=item?.researchRequest;
      if(existing?.id)setReference(existing.id,existing.status==='pending'?'Research requested':'Saved research request');
    }catch(err){console.warn('Could not load research reference',err);}
  };
  if(requestBtn)requestBtn.onclick=async()=>{
    const original=requestBtn.textContent;
    requestBtn.disabled=true;requestBtn.textContent='Requesting…';
    try{
      const saveButton=document.getElementById('save');
      if(typeof saveButton?.onclick==='function')await saveButton.onclick();
      const {state,item,work}=await currentRecord();
      if(!item)throw new Error('Item record could not be found.');
      const result=await submitResearchRequest(item,work,state);
      setReference(result.id,result.mediaError?`Request created · photos need attention: ${result.mediaError}`:'Request created · ready to share with ChatGPT');
      requestBtn.textContent='Research requested';
    }catch(err){
      const existing=refEl.textContent?.startsWith('CALIBRE-RESEARCH:')?refEl.textContent.split(':')[1]:'';
      setReference(existing,err?.message||'Research request failed.');
      requestBtn.textContent=original;
    }finally{
      requestBtn.disabled=false;
      if(requestBtn.textContent==='Research requested')setTimeout(()=>{requestBtn.textContent='Request research';},1800);
    }
  };
  if(shareBtn)shareBtn.onclick=async()=>{
    const ref=refEl.textContent.trim();if(!ref.startsWith('CALIBRE-RESEARCH:'))return;
    const original=shareBtn.textContent;shareBtn.disabled=true;shareBtn.textContent='Preparing…';
    try{
      const {state,item,work}=await currentRecord();
      if(!item)throw new Error('Item record could not be found.');
      const result=await submitResearchRequest(item,work,state);
      const links=(result.snapshot?.media||[]).map(x=>x.temporaryUrl||x.temporarySignedUrl).filter(Boolean);
      const text=[`Research this Calibre request: ${ref}`,links.length?'Temporary research photos:':'',...links].filter(Boolean).join('\n');
      if(navigator.share){shareBtn.textContent='Opening share sheet…';await navigator.share({title:`Calibre research — ${item.title||'item'}`,text});refStatus.textContent=`Shared research reference${links.length?` + ${links.length} temporary photo link${links.length===1?'':'s'}`:''}`;}
      else{await copyText(text);refStatus.textContent='Share sheet unavailable · research package copied';}
    }catch(err){if(err?.name==='AbortError')refStatus.textContent='Share cancelled';else{await copyText(`Research this Calibre request: ${ref}`);refStatus.textContent='Share failed · research reference copied';}}
    finally{shareBtn.disabled=false;shareBtn.textContent=original;}
  };
  if(copyBtn)copyBtn.onclick=async()=>{
    const ref=refEl.textContent.trim();if(!ref.startsWith('CALIBRE-RESEARCH:'))return;
    const text=`Research this Calibre request: ${ref}`;
    await copyText(text);
    const old=copyBtn.textContent;copyBtn.textContent='Copied';setTimeout(()=>copyBtn.textContent=old,1400);
  };
  hydrateResearchReference();

  if(!document.querySelector('style[data-item-research-ref]')){
    const style=document.createElement('style');style.dataset.itemResearchRef='1';style.textContent=`.item-research-ref{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:9px 11px;margin:-2px 0 10px;border:1px solid var(--line);border-radius:9px;background:var(--surface-2)}.item-research-ref[hidden]{display:none}.item-research-ref>div:first-child{min-width:0;display:flex;align-items:center;gap:9px;flex-wrap:wrap}.item-research-actions{display:flex;gap:7px;flex:0 0 auto}.item-research-label{font-size:.58rem;font-weight:900;letter-spacing:.08em;color:var(--muted)}.item-research-ref code{font-size:.69rem;color:var(--ink);overflow-wrap:anywhere}.item-research-ref .small{flex-basis:100%}@media(max-width:760px){.item-research-ref{align-items:stretch;flex-direction:column}.item-research-actions{display:grid;grid-template-columns:1fr 1fr}.item-research-ref .btn{width:100%}.item-quick-actions #requestResearch{order:-1;flex:1 1 100%}}@media(max-width:430px){.item-research-actions{grid-template-columns:1fr}}`;
    document.head.appendChild(style);
  }

  let currentArea='Item';
  function selectedPanel(){return tabs.querySelector('button.on')?.dataset.panel||params.get('tab')||'overview';}
  function applyArea(area,{navigate=false}={}){
    currentArea=AREAS[area]?area:'Item';
    areaNav.querySelectorAll('button').forEach(btn=>btn.classList.toggle('on',btn.dataset.area===currentArea));
    tabs.querySelectorAll('button[data-panel]').forEach(btn=>{btn.hidden=!AREAS[currentArea].includes(btn.dataset.panel);});
    const active=selectedPanel();
    if(navigate&&!AREAS[currentArea].includes(active))tabs.querySelector(`button[data-panel="${preferred[currentArea]}"]`)?.click();
  }
  areaNav.querySelectorAll('button').forEach(btn=>btn.addEventListener('click',()=>applyArea(btn.dataset.area,{navigate:true})));
  tabs.addEventListener('click',event=>{
    const btn=event.target.closest('button[data-panel]');
    if(!btn)return;
    const area=areaFor(btn.dataset.panel);
    if(area!==currentArea)applyArea(area);
  });
  applyArea(areaFor(selectedPanel()));
}
