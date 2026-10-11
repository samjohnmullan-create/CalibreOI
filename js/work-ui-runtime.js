function enhanceWorkWorkspace(){
  if((location.pathname.split('/').pop()||'')!=='work.html')return;
  const progressHost=document.getElementById('stageProgress');
  const strip=document.getElementById('stageStrip');
  if(!progressHost||!strip||progressHost.dataset.enhanced)return;
  progressHost.dataset.enhanced='1';
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
