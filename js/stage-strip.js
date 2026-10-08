const list=document.getElementById("stageList");
if(list&&!document.querySelector('.stage-strip-prev')){
  const style=document.createElement('style');
  style.textContent=`
    .stage-list{position:relative;scroll-behavior:smooth}
    .stage-strip-nav{position:absolute;top:50%;transform:translateY(-50%);z-index:5;width:34px;height:48px;border:1px solid var(--line);border-radius:8px;background:var(--surface);color:var(--ink);display:grid;place-items:center;font-size:1.25rem;font-weight:800;cursor:pointer;box-shadow:0 3px 12px rgba(0,0,0,.12)}
    .stage-strip-nav:hover{border-color:var(--accent)}
    .stage-strip-prev{left:6px}.stage-strip-next{right:6px}
    @media(max-width:760px){.stage-strip-nav{display:none}}
  `;
  document.head.appendChild(style);

  const parent=list.parentElement;
  if(parent){
    parent.style.position='relative';
    const prev=document.createElement('button');
    const next=document.createElement('button');
    prev.type=next.type='button';
    prev.className='stage-strip-nav stage-strip-prev';
    next.className='stage-strip-nav stage-strip-next';
    prev.setAttribute('aria-label','Scroll stages left');
    next.setAttribute('aria-label','Scroll stages right');
    prev.textContent='‹';
    next.textContent='›';
    parent.append(prev,next);

    const amount=()=>Math.max(320,Math.round(list.clientWidth*0.6));
    prev.addEventListener('click',()=>list.scrollBy({left:-amount(),behavior:'smooth'}));
    next.addEventListener('click',()=>list.scrollBy({left:amount(),behavior:'smooth'}));

    const centreActive=()=>{
      const active=list.querySelector('.stage-btn.active');
      if(!active)return;
      const left=active.offsetLeft-(list.clientWidth-active.offsetWidth)/2;
      list.scrollTo({left:Math.max(0,left),behavior:'smooth'});
    };

    // Centre once after the normal Workbench paint has populated the stages.
    setTimeout(centreActive,250);

    // Re-centre only after an explicit stage change. No observers or polling.
    list.addEventListener('click',event=>{
      if(!event.target.closest('.stage-btn'))return;
      setTimeout(centreActive,160);
    });
    document.getElementById('prevStage')?.addEventListener('click',()=>setTimeout(centreActive,160));
    document.getElementById('nextStage')?.addEventListener('click',()=>setTimeout(centreActive,160));
  }
}
