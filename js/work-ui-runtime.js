import {loadState,saveState} from './store.js?v=26';
import {cancelWork} from './item-lifecycle.js?v=1';

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
      // work.html still contains the older delete handler. Capture this action first
      // so cancelling a Work record can never silently erase workshop history.
      event.preventDefault();
      event.stopImmediatePropagation();
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
        const msg=document.getElementById('msg');
        if(msg)msg.textContent=error?.message||'Work could not be cancelled.';
        removeButton.disabled=false;removeButton.textContent=original;
      }
    },true);
  }

  const wrap=document.createElement('div');
  wrap.innerHTML='<div class="work-ui-section-label">Workflow completion</div><div class="work-ui-progress" aria-hidden="true"><i></i></div><div class="work-ui-progress-copy"><span data-work-progress-label>0 of 0 stages</span><span data-work-progress-percent>0%</span></div>';
  progressHost.replaceWith(wrap);
  const fill=wrap.querySelector('.work-ui-progress>i');
  const label=wrap.querySelector('[data-work-progress-label]');
  const pct=wrap.querySelector('[data-work-progress-percent]');
  const refresh=()=>{
    const buttons=[...strip.querySelectorAll('.stage-btn')];
    const done=buttons.filter(b=>b.classList.contains('done')).length;
    const total=buttons.length;
    const percent=total?Math.round(done/total*100):0;
    fill.style.width=`${percent}%`;
    label.textContent=`${done} of ${total} stages`;
    pct.textContent=`${percent}%`;
    const active=strip.querySelector('.stage-btn.active');
    if(active)active.scrollIntoView({block:'nearest',inline:'nearest'});
  };
  new MutationObserver(refresh).observe(strip,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  refresh();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enhanceWorkWorkspace,{once:true});else enhanceWorkWorkspace();
