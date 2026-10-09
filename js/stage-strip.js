const list=document.getElementById("stageList");
if(list&&!list.dataset.safeStageNav){
  list.dataset.safeStageNav="1";
  const parent=list.parentElement;
  if(parent){
    const wrap=document.createElement("div");
    wrap.className="stage-strip-wrap";
    parent.insertBefore(wrap,list);
    wrap.appendChild(list);

    const style=document.createElement("style");
    style.textContent=`
      .stage-strip-wrap{position:relative;margin-bottom:12px}
      .stage-strip-wrap .stage-list{margin-bottom:0;scroll-behavior:smooth;scroll-padding-inline:48px}
      .stage-strip-nav{position:absolute;top:50%;transform:translateY(-50%);z-index:5;width:34px;height:48px;border:1px solid var(--line);border-radius:8px;background:var(--surface);color:var(--ink);display:grid;place-items:center;font-size:1.25rem;font-weight:800;cursor:pointer;box-shadow:0 3px 12px rgba(0,0,0,.12)}
      .stage-strip-nav:hover{border-color:var(--accent)}
      .stage-strip-prev{left:6px}.stage-strip-next{right:6px}
      @media(max-width:760px){.stage-strip-nav{display:none}}
    `;
    document.head.appendChild(style);

    const prev=document.createElement("button");
    const next=document.createElement("button");
    prev.type=next.type="button";
    prev.className="stage-strip-nav stage-strip-prev";
    next.className="stage-strip-nav stage-strip-next";
    prev.setAttribute("aria-label","Scroll stages left");
    next.setAttribute("aria-label","Scroll stages right");
    prev.textContent="‹";
    next.textContent="›";
    wrap.append(prev,next);

    const amount=()=>Math.max(320,Math.round(list.clientWidth*.6));
    prev.onclick=()=>list.scrollBy({left:-amount(),behavior:"smooth"});
    next.onclick=()=>list.scrollBy({left:amount(),behavior:"smooth"});

    const centreActive=()=>{
      const active=list.querySelector(".stage-btn.active");
      if(!active)return;
      const target=active.offsetLeft-(list.clientWidth-active.offsetWidth)/2;
      list.scrollTo({left:Math.max(0,target),behavior:"smooth"});
    };

    requestAnimationFrame(()=>requestAnimationFrame(centreActive));
    list.addEventListener("click",e=>{
      if(!e.target.closest(".stage-btn"))return;
      setTimeout(centreActive,0);
    });
    document.getElementById("prevStage")?.addEventListener("click",()=>setTimeout(centreActive,0));
    document.getElementById("nextStage")?.addEventListener("click",()=>setTimeout(centreActive,0));
  }
}
