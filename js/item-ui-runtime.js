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
  quick.innerHTML=`<a class="btn secondary" href="workbench.html">Workbench</a>${itemId?`<a class="btn secondary" href="passport.html?id=${encodeURIComponent(itemId)}">Passport</a><a class="btn secondary" href="capture.html?item=${encodeURIComponent(itemId)}">Capture</a>`:''}`;
  if(back){back.replaceWith(quick);quick.appendChild(back);back.textContent='Items';}
  else head.appendChild(quick);

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
