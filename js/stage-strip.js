const list=document.getElementById("stageList");
if(list){
  const style=document.createElement("style");
  style.textContent=`
  .stage-strip-shell{position:relative;margin-bottom:12px}
  .stage-strip-shell .stage-list{margin-bottom:0;scroll-behavior:smooth;scroll-snap-type:x proximity;scrollbar-width:thin;scrollbar-color:var(--line) transparent}
  .stage-strip-shell .stage-list::-webkit-scrollbar{height:7px}
  .stage-strip-shell .stage-list::-webkit-scrollbar-thumb{background:var(--line);border-radius:999px}
  .stage-strip-shell .stage-btn{scroll-snap-align:center;flex:0 0 156px}
  .stage-strip-nav{position:absolute;top:50%;translate:0 -50%;z-index:4;width:34px;height:48px;border:1px solid var(--line);border-radius:8px;background:color-mix(in srgb,var(--surface) 94%,transparent);color:var(--ink);display:grid;place-items:center;font-size:1.25rem;font-weight:800;cursor:pointer;box-shadow:0 3px 12px rgba(0,0,0,.12)}
  .stage-strip-nav:hover{border-color:var(--accent);background:var(--surface)}
  .stage-strip-prev{left:6px}.stage-strip-next{right:6px}
  .stage-strip-shell:before,.stage-strip-shell:after{content:"";position:absolute;top:0;bottom:8px;width:54px;z-index:2;pointer-events:none}
  .stage-strip-shell:before{left:0;background:linear-gradient(90deg,var(--bg),transparent)}
  .stage-strip-shell:after{right:0;background:linear-gradient(270deg,var(--bg),transparent)}
  @media(max-width:760px){.stage-strip-nav,.stage-strip-shell:before,.stage-strip-shell:after{display:none}.stage-strip-shell .stage-list{scrollbar-width:none}.stage-strip-shell .stage-list::-webkit-scrollbar{display:none}}
  `;
  document.head.appendChild(style);

  if(!list.closest('.stage-strip-shell')){
    const shell=document.createElement('div');
    shell.className='stage-strip-shell';
    list.parentNode.insertBefore(shell,list);
    shell.appendChild(list);

    const prev=document.createElement('button');
    const next=document.createElement('button');
    prev.type=next.type='button';
    prev.className='stage-strip-nav stage-strip-prev';
    next.className='stage-strip-nav stage-strip-next';
    prev.setAttribute('aria-label','Scroll stages left');
    next.setAttribute('aria-label','Scroll stages right');
    prev.textContent='‹';
    next.textContent='›';
    shell.append(prev,next);

    const step=()=>Math.max(360,Math.round(list.clientWidth*.62));
    prev.onclick=()=>list.scrollBy({left:-step(),behavior:'smooth'});
    next.onclick=()=>list.scrollBy({left:step(),behavior:'smooth'});

    const centreActive=()=>{
      const active=list.querySelector('.stage-btn.active');
      if(active)active.scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'});
    };

    list.addEventListener('click',e=>{
      if(!e.target.closest('.stage-btn'))return;
      setTimeout(centreActive,120);
    },{passive:true});

    document.getElementById('prevStage')?.addEventListener('click',()=>setTimeout(centreActive,120),{passive:true});
    document.getElementById('nextStage')?.addEventListener('click',()=>setTimeout(centreActive,120),{passive:true});
  }
}
