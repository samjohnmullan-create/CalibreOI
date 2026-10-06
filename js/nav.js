(function(){
  if(!document.querySelector('script[data-calibre-store-map]')){
    var cloud=new URL("js/store-cloud.js?v=4",document.baseURI).href;
    var imports={};
    ["js/store.js","js/store.js?v=23","js/store.js?v=24","js/store.js?v=25","js/store.js?v=26"].forEach(function(p){imports[new URL(p,document.baseURI).href]=cloud;});
    var map=document.createElement("script");
    map.type="importmap";
    map.dataset.calibreStoreMap="1";
    map.textContent=JSON.stringify({imports:imports});
    document.head.appendChild(map);
  }
  if(!document.querySelector('script[data-calibre-cloud-auto]')){
    var sync=document.createElement("script");
    sync.type="module";
    sync.src="js/cloud-auto.js?v=3";
    sync.dataset.calibreCloudAuto="1";
    document.head.appendChild(sync);
  }
})();

var savedTheme=localStorage.getItem("calibre-theme");
if(savedTheme!=="light")document.documentElement.dataset.theme="dark";

document.querySelectorAll(".brandbar").forEach(function(bar){
  if(bar.querySelector(".themebtn"))return;
  var b=document.createElement("button");
  b.className="themebtn";
  b.type="button";
  b.textContent=document.documentElement.dataset.theme==="dark"?"Light":"Dark";
  b.onclick=function(){
    var dark=document.documentElement.dataset.theme!=="dark";
    document.documentElement.dataset.theme=dark?"dark":"";
    localStorage.setItem("calibre-theme",dark?"dark":"light");
    b.textContent=dark?"Light":"Dark";
  };
  bar.appendChild(b);
});

(function(){
  var here=(location.pathname.split("/").pop()||"index.html").split("?")[0];
  if(!here||here.indexOf(".")===-1)here="index.html";

  var primary=[
    {id:"home",href:"index.html",label:"Home",icon:"M4 10.5 12 4l8 6.5V20h-5v-6H9v6H4z"},
    {id:"workshop",href:"workbench.html?v=22",label:"Workshop",icon:"M4 18h16M6 18V8h4v10M14 18V5h4v13"},
    {id:"collection",href:"inventory.html",label:"Collection",icon:"M5 7h14v13H5zM8 7V4h8v3M8 11h8"},
    {id:"business",href:"finance.html",label:"Business",icon:"M5 7h14v11H5zM5 11h14M8 15h3"},
    {id:"calibre",href:"calibre.html",label:"Calibre",icon:"M12 3a4 4 0 0 1 4 4v1a4 4 0 1 1 0 8v1a4 4 0 1 1-8 0v-1a4 4 0 1 1 0-8V7a4 4 0 0 1 4-4z"}
  ];

  var pageGroup={
    "index.html":"home",
    "workbench.html":"workshop",
    "passport.html":"workshop",
    "timegrapher.html":"workshop",
    "business.html":"workshop",
    "summary.html":"workshop",
    "suppliers.html":"workshop",
    "documents.html":"workshop",
    "inventory.html":"collection",
    "finance.html":"business",
    "calibre.html":"calibre",
    "assistant.html":"calibre",
    "news.html":"calibre",
    "settings.html":"calibre"
  };

  var activeGroup=pageGroup[here]||"home";
  document.querySelectorAll("nav.mainnav").forEach(function(nav){
    nav.innerHTML=primary.map(function(item){
      var on=item.id===activeGroup;
      var extra=item.id==="calibre"?"<span class=\"newsdot\" data-news-dot hidden></span>":"";
      return "<a class=\"navbtn"+(on?" active":"")+"\" href=\""+item.href+"\""+(on?" aria-current=\"page\"":"")+"><svg viewBox=\"0 0 24 24\"><path d=\""+item.icon+"\"/></svg><span>"+item.label+"</span>"+extra+"</a>";
    }).join("");
  });

  var watchPages=["workbench.html","passport.html","timegrapher.html","business.html","summary.html","suppliers.html","documents.html"];
  if(watchPages.indexOf(here)>=0){
    document.body.classList.add("watch-page");
    var main=document.querySelector("nav.mainnav");
    var strip=document.createElement("section");
    strip.className="watch-strip";
    strip.setAttribute("aria-label","Current watch");
    strip.innerHTML='<div class="watch-strip-photo" data-watch-photo></div><div class="watch-strip-main"><div class="watch-strip-name" data-watch-name>Loading watch…</div><div class="watch-strip-meta" data-watch-meta></div></div><div class="watch-strip-state"><span class="badge" data-watch-status>—</span><span class="watch-strip-job" data-watch-job></span></div>';
    if(main)main.insertAdjacentElement("afterend",strip);

    var watchTabs=[
      ["workbench.html?v=22","Repair"],
      ["passport.html","Identity"],
      ["timegrapher.html?v=5","Timing"],
      ["suppliers.html","Parts"],
      ["business.html","Money"],
      ["summary.html","Summary"],
      ["documents.html","Documents"]
    ];
    var sub=document.createElement("nav");
    sub.className="contextnav watch-contextnav";
    sub.setAttribute("aria-label","Current watch sections");
    sub.innerHTML=watchTabs.map(function(item){
      var on=here===item[0].split("?")[0];
      return "<a class=\"contextnav-btn"+(on?" active":"")+"\" href=\""+item[0]+"\""+(on?" aria-current=\"page\"":"")+">"+item[1]+"</a>";
    }).join("");
    strip.insertAdjacentElement("afterend",sub);

    (async function(){
      try{
        var mod=await import("./store.js?v=26");
        var state=await mod.loadState();
        var job=mod.current(state);
        if(!job){
          strip.querySelector("[data-watch-name]").textContent="No watch open";
          strip.querySelector("[data-watch-meta]").textContent="Choose a watch from Collection or Home.";
          strip.querySelector("[data-watch-status]").textContent="—";
          return;
        }
        var p=job.passport||{};
        var meta=[];
        if(p.maker)meta.push(p.maker);
        if(p.model)meta.push(p.model);
        if(p.calibre)meta.push("Cal. "+p.calibre);
        if(p.jewels)meta.push(p.jewels+" jewels");
        if(p.year)meta.push(p.year);
        strip.querySelector("[data-watch-name]").textContent=job.watchName||[p.maker,p.model].filter(Boolean).join(" ")||"Untitled watch";
        strip.querySelector("[data-watch-meta]").textContent=meta.join(" · ")||"Identity not completed yet";
        strip.querySelector("[data-watch-status]").textContent=job.status||"On bench";
        var stageTotal=Array.isArray(job.stages)?job.stages.length:0;
        var stageNow=stageTotal?Math.min(stageTotal,Math.max(1,(Number(job.stage)||0)+1)):0;
        var jobBits=[];
        if(job.jobId)jobBits.push(job.jobId);
        if(stageTotal)jobBits.push("Stage "+stageNow+"/"+stageTotal);
        strip.querySelector("[data-watch-job]").textContent=jobBits.join(" · ");
        var src=typeof mod.coverPhoto==="function"?mod.coverPhoto(job):"";
        var photo=strip.querySelector("[data-watch-photo]");
        if(src){var img=document.createElement("img");img.src=src;img.alt="";photo.appendChild(img);}else{photo.textContent=(job.watchName||p.maker||"W").trim().charAt(0).toUpperCase();}
      }catch(e){
        console.warn("Watch header unavailable",e);
        strip.querySelector("[data-watch-name]").textContent="Current watch";
      }
    })();
  }

  if(["calibre.html","assistant.html","news.html","settings.html"].indexOf(here)>=0){
    var calibreTabs=[["calibre.html","Overview"],["assistant.html","Job brief"],["news.html","Updates"],["settings.html","Settings"]];
    var csub=document.createElement("nav");
    csub.className="contextnav calibre-contextnav";
    csub.setAttribute("aria-label","Calibre");
    csub.innerHTML=calibreTabs.map(function(item){
      var on=here===item[0];
      return "<a class=\"contextnav-btn"+(on?" active":"")+"\" href=\""+item[0]+"\""+(on?" aria-current=\"page\"":"")+">"+item[1]+"</a>";
    }).join("");
    var main2=document.querySelector("nav.mainnav");
    if(main2)main2.insertAdjacentElement("afterend",csub);
  }

  if(here==="workbench.html"&&!document.querySelector('script[data-calibre-workbench-runtime]')){
    var r=document.createElement("script");
    r.type="module";
    r.src="js/workbench-runtime.js?v=3";
    r.dataset.calibreWorkbenchRuntime="1";
    document.head.appendChild(r);
  }
})();

var markStyle=document.createElement("style");
markStyle.textContent=`
.brandmark{padding:0;overflow:hidden;background:transparent}
.brandmark img{width:42px;height:42px;object-fit:cover;display:block;border-radius:50%}
.navbtn{position:relative}
.newsdot{position:absolute;top:7px;right:calc(50% - 17px);width:7px;height:7px;border-radius:50%;background:#ef4444;box-shadow:0 0 0 2px var(--nav,#111)}
.newsdot[hidden]{display:none}
.contextnav{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;margin:-4px 0 14px;padding:2px 0 4px}
.contextnav::-webkit-scrollbar{display:none}
.contextnav-btn{flex:0 0 auto;min-height:34px;display:inline-flex;align-items:center;justify-content:center;padding:6px 11px;border:1px solid var(--line);border-radius:7px;background:transparent;color:var(--muted);text-decoration:none;font-size:.74rem;font-weight:700;white-space:nowrap}
.contextnav-btn:hover{color:var(--ink);border-color:var(--muted)}
.contextnav-btn.active{background:var(--surface-2);color:var(--ink);border-color:var(--brass)}
.watch-strip{display:grid;grid-template-columns:54px minmax(0,1fr) auto;gap:12px;align-items:center;padding:11px 12px;margin:0 0 10px;background:var(--surface);border:1px solid var(--line);border-radius:9px}
.watch-strip-photo{width:54px;height:54px;border-radius:8px;overflow:hidden;background:var(--surface-2);display:grid;place-items:center;color:var(--muted);font-weight:800;font-size:1.1rem}
.watch-strip-photo img{width:100%;height:100%;object-fit:cover;display:block}
.watch-strip-name{font-size:1.05rem;font-weight:800;letter-spacing:-.015em;color:var(--ink)}
.watch-strip-meta{margin-top:3px;color:var(--muted);font-size:.76rem;line-height:1.35}
.watch-strip-state{display:flex;align-items:flex-end;flex-direction:column;gap:5px;text-align:right}
.watch-strip-job{font-size:.68rem;color:var(--muted);font-variant-numeric:tabular-nums;white-space:nowrap}
@media(max-width:640px){
  .watch-strip{grid-template-columns:44px minmax(0,1fr);padding:9px 10px;gap:9px}
  .watch-strip-photo{width:44px;height:44px}
  .watch-strip-state{grid-column:2;align-items:flex-start;flex-direction:row;flex-wrap:wrap;text-align:left;margin-top:-2px}
  .contextnav{margin:8px 0 12px;padding-bottom:2px}
  .contextnav-btn{min-height:32px;padding:5px 10px;border-radius:999px}
}
`;
document.head.appendChild(markStyle);

document.querySelectorAll(".brandmark").forEach(function(el){
  el.innerHTML="<img src=\"assets/mark.png?v=5\" alt=\"\">";
});
if(!document.querySelector("link[rel=icon]")){
  var icon=document.createElement("link");
  icon.rel="icon";
  icon.href="assets/mark.png?v=5";
  document.head.appendChild(icon);
}

(async function(){
  try{
    var mod=await import("./cloud.js?v=3");
    var s=await mod.session();
    if(!s?.user)return;
    var q=await mod.supabaseClient().from("calibre_news").select("id",{count:"exact",head:true}).eq("user_id",s.user.id).is("read_at",null);
    var unread=q.count||0;
    document.querySelectorAll("[data-news-dot]").forEach(function(dot){
      dot.hidden=!unread;
      dot.title=unread?unread+" unread Calibre update"+(unread===1?"":"s"):"";
    });
  }catch(e){console.warn("News badge unavailable",e);}
})();
