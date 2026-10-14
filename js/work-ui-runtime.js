import {loadState,saveState} from './store.js?v=26';
import {cancelWork} from './item-lifecycle.js?v=1';
import {workCompletionReadiness} from './work-completion.js?v=1';

function enhanceWorkWorkspace(){
  if((location.pathname.split('/').pop()||'')!=='work.html')return;
  const progressHost=document.getElementById('stageProgress');
  const strip=document.getElementById('stageStrip');
  if(!progressHost||!strip||progressHost.dataset.enhanced)return;
  progressHost.dataset.enhanced='1';
  const workMenu=document.querySelector('.work-menu');
  const workId=new URLSearchParams(location.search).get('id')||'';
  if(workMenu&&!workMenu.querySelector('[data-work-capture]')){
    const itemLink=document.getElementById('menuItem');
    let itemId='';
    try{itemId=new URL(itemLink?.href||'',location.href).searchParams.get('id')||'';}catch{}
    const capture=document.createElement('a');
    capture.dataset.workCapture='1';
    capture.textContent='Capture';
    capture.href=`capture.html?${new URLSearchParams({...(itemId?{item:itemId}:{}),...(workId?{work:workId}:{})}).toString()}`;
    const passport=document.getElementById('menuPassport');
    if(passport)workMenu.insertBefore(capture,passport);else workMenu.appendChild(capture);
  }

  const removeButton=document.getElementById('remove');
  if(removeButton&&!removeButton.dataset.lifecycleSafe){
    removeButton.dataset.lifecycleSafe='1';
    removeButton.textContent='Cancel work';
    removeButton.title='Close this Work record without deleting its history';
    removeButton.addEventListener('click',async event=>{
      event.preventDefault();event.stopImmediatePropagation();
      if(!workId||!confirm('Cancel this Work record? Its workshop history will be kept.'))return;
      const original=removeButton.textContent;
      removeButton.disabled=true;removeButton.textContent='Cancelling…';
      try{
        const state=await loadState();
        cancelWork(state,workId,{reason:'Work cancelled from Work workspace'});
        await saveState(state);
        location.href='workbench.html';
      }catch(error){
        console.warn('Work cancellation failed',error);
        const msg=document.getElementById('msg');if(msg)msg.textContent=error?.message||'Work could not be cancelled.';
        removeButton.disabled=false;removeButton.textContent=original;
      }
    },true);
  }

  const wrap=document.createElement('div');
  wrap.innerHTML='<div class="work-ui-section-label">Workflow completion</div><div class="work-ui-progress" aria-hidden="true"><i></i></div><div class="work-ui-progress-copy"><span data-work-progress-label>0 of 0 stages</span><span data-work-progress-percent>0%</span></div><div class="work-completion-gate" data-work-completion-gate><strong>Completion gate</strong><span>Checking Final QC…</span><button type="button" class="btn secondary" data-open-final-qc hidden>Open Final QC</button></div>';
  progressHost.replaceWith(wrap);
  const fill=wrap.querySelector('.work-ui-progress>i'),label=wrap.querySelector('[data-work-progress-label]'),pct=wrap.querySelector('[data-work-progress-percent]'),gate=wrap.querySelector('[data-work-completion-gate]'),gateText=gate.querySelector('span'),qcButton=gate.querySelector('[data-open-final-qc]');
  const gateStyle=document.createElement('style');gateStyle.textContent='.work-completion-gate{margin-top:11px;padding:9px 10px;border:1px solid var(--line);border-radius:8px;background:var(--surface-2);display:grid;gap:4px}.work-completion-gate strong{font-size:.7rem}.work-completion-gate span{font-size:.64rem;color:var(--muted);line-height:1.35}.work-completion-gate.ready{border-left:3px solid var(--ok)}.work-completion-gate.blocked{border-left:3px solid var(--danger)}.work-completion-gate .btn{justify-self:start;margin-top:3px;min-height:30px;padding:4px 7px;font-size:.62rem}';document.head.appendChild(gateStyle);

  const progressRefresh=()=>{
    const buttons=[...strip.querySelectorAll('.stage-btn')],done=buttons.filter(b=>b.classList.contains('done')).length,total=buttons.length,percent=total?Math.round(done/total*100):0;
    fill.style.width=`${percent}%`;label.textContent=`${done} of ${total} stages`;pct.textContent=`${percent}%`;
    const active=strip.querySelector('.stage-btn.active');if(active)active.scrollIntoView({block:'nearest',inline:'nearest'});
  };
  new MutationObserver(progressRefresh).observe(strip,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  progressRefresh();

  let lastReadiness=null,gateTimer;
  async function gateState(){
    const state=await loadState(),work=(state.work||[]).find(row=>String(row.id)===String(workId));
    if(!work)throw new Error('Work record could not be found.');
    const item=(state.items||[]).find(row=>String(row.id)===String(work.itemId))||{};
    return {state,work,item,readiness:workCompletionReadiness(work,state,item)};
  }
  function paintGate(readiness){
    lastReadiness=readiness;gate.classList.toggle('ready',readiness.ready);gate.classList.toggle('blocked',!readiness.ready);
    if(readiness.ready){gateText.textContent='Ready to complete · Final QC, fitted parts and blockers are clear.';qcButton.hidden=true;return;}
    const first=readiness.issues[0]||'Final QC is not complete.',extra=Math.max(0,readiness.issues.length-1);gateText.textContent=`${first}${extra?` · ${extra} more item${extra===1?'':'s'} to resolve`:''}`;qcButton.hidden=readiness.qcIndex<0;
  }
  async function refreshGate(){try{const {readiness}=await gateState();paintGate(readiness);}catch(error){gate.classList.add('blocked');gateText.textContent=error?.message||'Completion readiness could not be checked.';}}
  function scheduleGate(delay=80){clearTimeout(gateTimer);gateTimer=setTimeout(refreshGate,delay);}
  qcButton.onclick=()=>{const index=lastReadiness?.qcIndex??-1;if(index>=0)[...strip.querySelectorAll('.stage-btn')][index]?.click();};

  const completeButton=document.getElementById('complete'),saveButton=document.getElementById('save'),statusSelect=document.getElementById('status'),msg=document.getElementById('msg');
  let completeBypass=false,saveBypass=false;
  if(completeButton){
    completeButton.title='Complete only after Final QC passes';
    completeButton.addEventListener('click',async event=>{
      if(completeBypass)return;
      event.preventDefault();event.stopImmediatePropagation();
      try{
        const {readiness}=await gateState();paintGate(readiness);
        if(!readiness.ready){if(msg)msg.textContent=`Cannot complete: ${readiness.issues[0]||'Final QC is incomplete.'}`;if(readiness.qcIndex>=0)[...strip.querySelectorAll('.stage-btn')][readiness.qcIndex]?.click();return;}
        if(typeof completeButton.onclick!=='function')throw new Error('Completion action is not ready yet.');
        completeBypass=true;await completeButton.onclick.call(completeButton,event);completeBypass=false;scheduleGate(120);
      }catch(error){completeBypass=false;if(msg)msg.textContent=error?.message||'Work could not be completed.';}
    },true);
  }
  if(saveButton&&statusSelect){
    saveButton.addEventListener('click',async event=>{
      if(saveBypass||statusSelect.value!=='Complete')return;
      event.preventDefault();event.stopImmediatePropagation();
      try{
        const {work,readiness}=await gateState();paintGate(readiness);
        if(!readiness.ready){statusSelect.value=work.status||'In progress';if(msg)msg.textContent=`Cannot save as Complete: ${readiness.issues[0]||'Final QC is incomplete.'}`;if(readiness.qcIndex>=0)[...strip.querySelectorAll('.stage-btn')][readiness.qcIndex]?.click();return;}
        if(typeof saveButton.onclick!=='function')throw new Error('Save action is not ready yet.');
        saveBypass=true;await saveButton.onclick.call(saveButton,event);saveBypass=false;scheduleGate(120);
      }catch(error){saveBypass=false;if(msg)msg.textContent=error?.message||'Work could not be saved as Complete.';}
    },true);
  }
  document.addEventListener('click',event=>{if(event.target.closest('.yn-btns,.stage-btn,#complete'))scheduleGate(180);},true);
  document.addEventListener('change',event=>{if(event.target.matches('#stageComplete,#status'))scheduleGate(180);},true);
  refreshGate();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enhanceWorkWorkspace,{once:true});else enhanceWorkWorkspace();
