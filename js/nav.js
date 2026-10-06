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

  var watchPages=["workbench.html","passport.html","timegrapher.html","business.html","summary.html","suppliers.html"];
  if(watchPages.indexOf(here)>=0){
    var watchTabs=[
      ["workbench.html?v=22","Repair"],
      ["passport.html","Identity"],
      ["timegrapher.html?v=5","Timing"],
      ["suppliers.html","Parts"],
      ["business.html","Money"],
      ["summary.html","Summary"]
    ];
    var sub=document.createElement("nav");
    sub.className="contextnav watch-contextnav";
    sub.setAttribute("aria-label","Current watch");
    sub.innerHTML=watchTabs.map(function(item){
      var on=here===item[0].split("?")[0];
      return "<a class=\"contextnav-btn"+(on?" active":"")+"\" href=\""+item[0]+"\""+(on?" aria-current=\"page\"":"")+">"+item[1]+"</a>";
    }).join("");
    var main=document.querySelector("nav.mainnav");
    if(main)main.insertAdjacentElement("afterend",sub);
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
.brandmark img{width:34px;height:34px;object-fit:cover;display:block;border-radius:50%}
.navbtn{position:relative}
.newsdot{position:absolute;top:7px;right:calc(50% - 17px);width:7px;height:7px;border-radius:50%;background:#ef4444;box-shadow:0 0 0 2px var(--nav,#111)}
.newsdot[hidden]{display:none}
.contextnav{display:flex;gap:5px;overflow-x:auto;scrollbar-width:none;margin:-4px 0 12px;padding:1px 0 3px}
.contextnav::-webkit-scrollbar{display:none}
.contextnav-btn{flex:0 0 auto;min-height:31px;display:inline-flex;align-items:center;justify-content:center;padding:5px 10px;border:1px solid var(--line);border-radius:7px;background:transparent;color:var(--muted);text-decoration:none;font-size:.72rem;font-weight:700;white-space:nowrap}
.contextnav-btn:hover{color:var(--ink);border-color:var(--muted)}
.contextnav-btn.active{background:var(--surface-2);color:var(--ink);border-color:var(--brass)}

/* Anything wider than a true phone gets the compact workshop layout. */
@media (min-width:481px){
  html{font-size:14px!important}
  body{padding-bottom:0!important}
  .shell{max-width:1280px!important;padding-left:16px!important;padding-right:16px!important}
  .brandbar{min-height:48px!important;margin-left:-16px!important;margin-right:-16px!important;padding:0 16px!important}
  .brand{gap:8px!important}
  .brand h1{font-size:.9rem!important;margin:0!important}
  .kicker{font-size:.56rem!important;letter-spacing:.11em!important}
  .themebtn{min-height:28px!important;padding:3px 8px!important;font-size:.68rem!important}
  .mainnav{position:static!important;left:auto!important;right:auto!important;bottom:auto!important;margin:7px 0 8px!important;padding:2px!important;display:flex!important;flex-wrap:nowrap!important;overflow:visible!important;border-radius:7px!important;gap:2px!important}
  .mainnav .navbtn{flex:1 1 0!important;min-width:0!important;min-height:33px!important;padding:4px 7px!important;flex-direction:row!important;gap:5px!important;border-radius:5px!important;font-size:.68rem!important}
  .mainnav .navbtn svg{width:14px!important;height:14px!important}
  .newsdot{top:7px!important;right:12px!important}
  .contextnav{margin:-1px 0 7px!important;gap:3px!important;padding-bottom:1px!important}
  .contextnav-btn{min-height:27px!important;padding:3px 8px!important;border-radius:5px!important;font-size:.65rem!important}
  .hero{gap:10px!important;margin-bottom:7px!important;padding-bottom:7px!important}
  .hero h2{font-size:1.28rem!important;line-height:1.08!important;margin:1px 0 2px!important}
  .hero p{font-size:.75rem!important;line-height:1.34!important;max-width:700px!important;margin:.25rem 0!important}
  .hero-stats{gap:9px!important}
  .hero-stats strong{font-size:.84rem!important}
  .hero-stats span{font-size:.58rem!important}
  .card{padding:11px!important;border-radius:7px!important}
  .section-block{margin-top:10px!important;padding-top:10px!important}
  .section-head h2,.section-head h3,.section-block h3{font-size:.98rem!important;margin-bottom:5px!important}
  .btn{min-height:32px!important;padding:5px 9px!important;font-size:.72rem!important;border-radius:6px!important}
  input,select,textarea{padding:6px 8px!important;font-size:.78rem!important;border-radius:6px!important}
  label{font-size:.7rem!important;gap:4px!important}
  .row,.footer-actions{gap:7px!important;margin-top:9px!important}
  .badge{font-size:.62rem!important;padding:3px 6px!important}
  .small{font-size:.72rem!important}
  .stage-list{min-height:58px!important;margin-bottom:8px!important;gap:5px!important}
  .stage-list .stage-btn{min-width:118px!important;min-height:56px!important;padding:18px 9px 7px!important;border-radius:6px!important}
  .stage-list .stage-check{top:6px!important;right:6px!important;width:14px!important;height:14px!important;font-size:.58rem!important}
  .stage-list .stage-num{font-size:.62rem!important}
  .stage-list .stage-name{font-size:.72rem!important;line-height:1.05!important}
  .yn{padding:7px 0!important;font-size:.76rem!important}
  .yn-btns button{min-height:30px!important;min-width:44px!important;padding:4px 7px!important;font-size:.7rem!important}
  textarea{min-height:82px!important}
}

/* Actual phone layout only. */
@media (max-width:480px){
  .brandmark img{width:38px;height:38px}
  .contextnav{margin:10px 0 12px;padding:1px 2px 3px}
  .contextnav-btn{min-height:34px;padding:6px 10px;border-radius:999px;font-size:.72rem}
  .watch-contextnav,.calibre-contextnav{position:static}
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
