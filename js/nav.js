(function(){
  var here=(location.pathname.split("/").pop()||"index.html").split("?")[0];
  if(!here||here.indexOf(".")===-1)here="index.html";
  if(here==="settings.html")return;

  var hasCachedSession=false;
  try{
    for(var i=0;i<localStorage.length;i++){
      var k=localStorage.key(i)||"";
      if(k.indexOf("sb-")===0&&k.indexOf("-auth-token")>0&&localStorage.getItem(k)){hasCachedSession=true;break;}
    }
  }catch(e){}

  var gateStyle=null;
  function reveal(){
    document.documentElement.classList.remove("calibre-auth-pending");
    if(gateStyle&&gateStyle.parentNode)gateStyle.remove();
  }
  function authPage(){
    var next=encodeURIComponent(here+location.search+location.hash);
    location.replace("settings.html?auth=required&next="+next);
  }

  // Do not blank an already signed-in browser while an external cloud module
  // is loading. This keeps normal page navigation responsive even if the CDN
  // or session refresh is slow.
  if(!hasCachedSession){
    document.documentElement.classList.add("calibre-auth-pending");
    gateStyle=document.createElement("style");
    gateStyle.id="calibre-auth-gate-style";
    gateStyle.textContent="html.calibre-auth-pending body{visibility:hidden!important;pointer-events:none!important}html.calibre-auth-pending:before{content:'Calibre & Co.';position:fixed;inset:0;display:grid;place-items:center;background:#111111;color:#f7f7f5;font:600 15px/1.2 Georgia,'Times New Roman',serif;letter-spacing:.16em;z-index:2147483647}";
    document.head.appendChild(gateStyle);
  }

  Promise.race([
    import("./cloud.js?v=4").then(function(mod){return mod.session();}),
    new Promise(function(_,reject){setTimeout(function(){reject(new Error("Session check timed out"));},4000);})
  ]).then(function(s){
    if(!s?.user){authPage();return;}
    reveal();
  }).catch(function(err){
    if(hasCachedSession){console.warn("Cloud session check deferred",err);reveal();return;}
    authPage();
  });
})();

(function(){
  if(!document.querySelector('script[data-calibre-store-map]')){
    var cloud=new URL("js/store-cloud.js?v=5",document.baseURI).href;
    var imports={};
    ["js/store.js","js/store.js?v=23","js/store.js?v=24","js/store.js?v=25","js/store.js?v=26"].forEach(function(p){imports[new URL(p,document.baseURI).href]=cloud;});
    var map=document.createElement("script");map.type="importmap";map.dataset.calibreStoreMap="1";map.textContent=JSON.stringify({imports:imports});document.head.appendChild(map);
  }
  if(!document.querySelector('script[data-calibre-cloud-auto]')){
    var sync=document.createElement("script");sync.type="module";sync.src="js/cloud-auto.js?v=6";sync.dataset.calibreCloudAuto="1";document.head.appendChild(sync);
  }
})();

var savedTheme=localStorage.getItem("calibre-theme");
if(savedTheme==="dark")document.documentElement.dataset.theme="dark";
else document.documentElement.removeAttribute("data-theme");

document.querySelectorAll(".brandbar").forEach(function(bar){
  if(bar.querySelector(".themebtn"))return;
  var b=document.createElement("button");b.className="themebtn";b.type="button";b.textContent=document.documentElement.dataset.theme==="dark"?"Light":"Dark";
  b.onclick=function(){var dark=document.documentElement.dataset.theme!=="dark";document.documentElement.dataset.theme=dark?"dark":"";localStorage.setItem("calibre-theme",dark?"dark":"light");b.textContent=dark?"Light":"Dark";};
  bar.appendChild(b);
});

(function(){
  var here=(location.pathname.split("/").pop()||"index.html").split("?")[0];if(!here||here.indexOf(".")===-1)here="index.html";
  var primary=[
    {id:"home",href:"index.html",label:"Home",icon:"M4 10.5 12 4l8 6.5V20h-5v-6H9v6H4z"},
    {id:"workshop",href:"workbench.html?v=29",label:"Workshop",icon:"M4 18h16M6 18V8h4v10M14 18V5h4v13"},
    {id:"collection",href:"inventory.html",label:"Collection",icon:"M5 7h14v13H5zM8 7V4h8v3M8 11h8"},
    {id:"business",href:"finance.html",label:"Business",icon:"M5 7h14v11H5zM5 11h14M8 15h3"},
    {id:"calibre",href:"calibre.html",label:"Calibre",icon:"M12 3a4 4 0 0 1 4 4v1a4 4 0 1 1 0 8v1a4 4 0 1 1-8 0v-1a4 4 0 1 1 0-8V7a4 4 0 0 1 4-4z"}
  ];
  var pageGroup={"index.html":"home","workbench.html":"workshop","passport.html":"workshop","timegrapher.html":"workshop","business.html":"workshop","sales.html":"workshop","summary.html":"workshop","suppliers.html":"workshop","documents.html":"workshop","inventory.html":"collection","finance.html":"business","calibre.html":"calibre","assistant.html":"calibre","news.html":"calibre","settings.html":"calibre"};
  var activeGroup=pageGroup[here]||"home";
  document.querySelectorAll("nav.mainnav").forEach(function(nav){
    nav.innerHTML=primary.map(function(item){var on=item.id===activeGroup;var extra=item.id==="calibre"?"<span class=\"newsdot\" data-news-dot hidden></span>":"";return "<a class=\"navbtn"+(on?" active":"")+"\" href=\""+item.href+"\""+(on?" aria-current=\"page\"":"")+"><svg viewBox=\"0 0 24 24\"><path d=\""+item.icon+"\"/></svg><span>"+item.label+"</span>"+extra+"</a>";}).join("");
  });

  var watchPages=["workbench.html","passport.html","timegrapher.html","business.html","sales.html","summary.html","suppliers.html","documents.html"];
  if(watchPages.indexOf(here)>=0){
    document.body.classList.add("watch-page");
    var main=document.querySelector("nav.mainnav");var strip=document.createElement("section");strip.className="watch-strip";strip.setAttribute("aria-label","Current watch");
    strip.innerHTML='<div class="watch-strip-photo" data-watch-photo></div><div class="watch-strip-main"><div class="watch-strip-name" data-watch-name>Loading watch…</div><div class="watch-strip-meta" data-watch-meta></div></div><div class="watch-strip-state"><span class="badge" data-watch-status>—</span><span class="watch-strip-job" data-watch-job></span></div>';
    if(main)main.insertAdjacentElement("afterend",strip);
    var watchTabs=[["workbench.html?v=29","Repair"],["passport.html","Identity"],["timegrapher.html?v=5","Timing"],["suppliers.html","Parts"],["business.html","Money"],["sales.html","Sale"],["summary.html","Summary"],["documents.html","Documents"]];
    var sub=document.createElement("nav");sub.className="contextnav watch-contextnav";sub.setAttribute("aria-label","Current watch sections");sub.innerHTML=watchTabs.map(function(item){var on=here===item[0].split("?")[0];return "<a class=\"contextnav-btn"+(on?" active":"")+"\" href=\""+item[0]+"\""+(on?" aria-current=\"page\"":"")+">"+item[1]+"</a>";}).join("");strip.insertAdjacentElement("afterend",sub);
    (async function(){
      try{
        var mod=await import("./store.js?v=26"),state=await mod.loadState(),job=mod.current(state);
        if(!job){strip.querySelector("[data-watch-name]").textContent="No watch open";strip.querySelector("[data-watch-meta]").textContent="Choose a watch from Collection or Home.";strip.querySelector("[data-watch-status]").textContent="—";return;}
        var p=job.passport||{},meta=[];if(p.maker)meta.push(p.maker);if(p.model)meta.push(p.model);if(p.calibre)meta.push("Cal. "+p.calibre);if(p.jewels)meta.push(p.jewels+" jewels");if(p.year)meta.push(p.year);
        strip.querySelector("[data-watch-name]").textContent=job.watchName||[p.maker,p.model].filter(Boolean).join(" ")||"Untitled watch";
        strip.querySelector("[data-watch-meta]").textContent=meta.join(" · ")||"Identity not completed yet";
        strip.querySelector("[data-watch-status]").textContent=job.status||"On bench";
        var stageTotal=Array.isArray(job.stages)?job.stages.length:0,stageNow=stageTotal?Math.min(stageTotal,Math.max(1,(Number(job.stage)||0)+1)):0,jobBits=[];if(job.jobId)jobBits.push(job.jobId);if(stageTotal)jobBits.push("Stage "+stageNow+"/"+stageTotal);strip.querySelector("[data-watch-job]").textContent=jobBits.join(" · ");
        var src=typeof mod.coverPhoto==="function"?mod.coverPhoto(job):"",photo=strip.querySelector("[data-watch-photo]");if(src){var img=document.createElement("img");img.src=src;img.alt="";photo.appendChild(img);}else{photo.textContent=(job.watchName||p.maker||"W").trim().charAt(0).toUpperCase();}
      }catch(e){console.warn("Watch header unavailable",e);strip.querySelector("[data-watch-name]").textContent="Current watch";}
    })();
  }

  if(["calibre.html","assistant.html","news.html","settings.html"].indexOf(here)>=0){
    var calibreTabs=[["calibre.html","Overview"],["assistant.html","Job brief"],["news.html","Updates"],["settings.html","Settings"]],csub=document.createElement("nav");csub.className="contextnav calibre-contextnav";csub.setAttribute("aria-label","Calibre");csub.innerHTML=calibreTabs.map(function(item){var on=here===item[0];return "<a class=\"contextnav-btn"+(on?" active":"")+"\" href=\""+item[0]+"\""+(on?" aria-current=\"page\"":"")+">"+item[1]+"</a>";}).join("");var main2=document.querySelector("nav.mainnav");if(main2)main2.insertAdjacentElement("afterend",csub);
  }

  function injectWorkbenchRuntime(src,marker){var r=document.createElement("script");r.type="module";r.src=src;r.dataset.calibreWorkbenchRuntime=marker||"1";document.head.appendChild(r);}
  if(here==="workbench.html"&&!document.querySelector('script[data-calibre-workbench-runtime]'))injectWorkbenchRuntime("js/workbench-runtime.js?v=11","primary");
  if(here==="workbench.html")setTimeout(function(){var faults=document.getElementById("faults");if(!faults||!faults.textContent.includes("Reading diagnostic state"))return;if(document.querySelector('script[data-calibre-workbench-runtime="fallback"]'))return;injectWorkbenchRuntime("js/workbench-runtime.js?v=11-fallback","fallback");},1800);
})();

var markStyle=document.createElement("style");
markStyle.textContent=`
:root{
  --bg:#f7f7f5;
  --surface:#ffffff;
  --surface-2:#f1f1ee;
  --ink:#111111;
  --muted:#6d6d68;
  --line:#ddddda;
  --nav:#111111;
  --accent:#b08a4a;
  --accent-soft:#c5a66e;
  --brass:#b08a4a;
  --brass-soft:#c5a66e;
  --ok:#687b66;
}
html[data-theme="dark"]{
  --bg:#111111;
  --surface:#1b1b1a;
  --surface-2:#262624;
  --ink:#f7f7f5;
  --muted:#a2a29d;
  --line:#3a3a36;
  --nav:#0d0d0c;
  --accent:#c19b56;
  --accent-soft:#d0b47d;
  --brass:#c19b56;
  --brass-soft:#d0b47d;
  --ok:#82917f;
}
.brandmark{display:none!important}
.brand{gap:0!important}
.brand>div:last-child{display:flex;align-items:center;min-height:44px}
.brand .kicker{font-family:Georgia,"Times New Roman",serif!important;font-size:.98rem!important;font-weight:600!important;letter-spacing:.16em!important;color:var(--ink)!important;line-height:1;white-space:nowrap}
.brand h1{display:none!important}
html[data-theme="dark"] .brand .kicker{color:#f7f7f5!important}
.brandbar{border-bottom:1px solid color-mix(in srgb,var(--line) 72%,transparent)!important}
html:not([data-theme="dark"]) .brandbar{background:#ffffff!important}
.navbtn{position:relative}
.navbtn.active{border-bottom-color:var(--accent)!important}
html:not([data-theme="dark"]) .navbtn.active{background:color-mix(in srgb,var(--accent) 8%,var(--surface))!important}
.btn:not(.secondary){background:var(--accent);border-color:var(--accent);color:#fff}
.textbtn,.kicker,.stage-num,.timeline-item span,.star{color:var(--accent)}
.newsdot{position:absolute;top:6px;right:5px;width:6px;height:6px;border-radius:50%;background:#ef4444;box-shadow:0 0 0 2px var(--bg,#111)}
.contextnav{display:flex;gap:2px;overflow-x:auto;scrollbar-width:none;margin:0 0 8px;padding:0;border-bottom:1px solid var(--line)}
.contextnav::-webkit-scrollbar{display:none}
.contextnav-btn{flex:0 0 auto;min-height:30px;display:inline-flex;align-items:center;justify-content:center;padding:5px 8px 7px;border:0;border-bottom:2px solid transparent;background:transparent;color:var(--muted);text-decoration:none;font-size:.68rem;font-weight:700;white-space:nowrap;margin-bottom:-1px}
.contextnav-btn:hover{color:var(--ink)}
.contextnav-btn.active{background:transparent;color:var(--ink);border-bottom-color:var(--accent,var(--brass))}
.watch-strip{display:grid;grid-template-columns:42px minmax(0,1fr) auto;gap:9px;align-items:center;padding:7px 0 8px;margin:0;background:transparent;border:0;border-bottom:1px solid var(--line);border-radius:0}
.watch-strip-photo{width:42px;height:42px;border-radius:6px;overflow:hidden;background:var(--surface-2);display:grid;place-items:center;color:var(--muted);font-weight:800;font-size:.92rem}
.watch-strip-photo img{width:100%;height:100%;object-fit:cover;display:block}
.watch-strip-name{font-size:.93rem;font-weight:800;letter-spacing:-.012em;color:var(--ink)}
.watch-strip-meta{margin-top:2px;color:var(--muted);font-size:.68rem;line-height:1.3}
.watch-strip-state{display:flex;align-items:flex-end;flex-direction:column;gap:3px;text-align:right}
.watch-strip-job{font-size:.62rem;color:var(--muted);font-variant-numeric:tabular-nums;white-space:nowrap}
@media(max-width:640px){.brand .kicker{font-size:.88rem!important;letter-spacing:.13em!important}.watch-strip{grid-template-columns:44px minmax(0,1fr);padding:8px 0;gap:9px}.watch-strip-photo{width:44px;height:44px}.watch-strip-state{grid-column:2;align-items:flex-start;flex-direction:row;flex-wrap:wrap;text-align:left;margin-top:-2px}.contextnav{margin:6px 0 10px;border-bottom:0;gap:5px}.contextnav-btn{min-height:32px;padding:5px 10px;border:1px solid var(--line);border-radius:999px;margin:0}.contextnav-btn.active{background:var(--surface-2);border-color:var(--accent,var(--brass))}}
`;
document.head.appendChild(markStyle);

document.querySelectorAll(".brandmark").forEach(function(el){el.setAttribute("aria-hidden","true");});
var oldIcon=document.querySelector("link[rel=icon]");if(oldIcon)oldIcon.remove();var icon=document.createElement("link");icon.rel="icon";icon.type="image/svg+xml";icon.href="assets/brand/calibre-mark-black.svg?v=1";document.head.appendChild(icon);

(async function(){
  try{var mod=await import("./cloud.js?v=4"),s=await mod.session();if(!s?.user)return;var q=await mod.supabaseClient().from("calibre_news").select("id",{count:"exact",head:true}).eq("user_id",s.user.id).is("read_at",null),unread=q.count||0;document.querySelectorAll("[data-news-dot]").forEach(function(dot){dot.hidden=!unread;dot.title=unread?unread+" unread Calibre update"+(unread===1?"":"s"):"";});}catch(e){console.warn("News badge unavailable",e);}
})();