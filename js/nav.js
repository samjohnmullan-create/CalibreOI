const here=(location.pathname.split('/').pop()||'index.html').split('?')[0]||'index.html';

if(here!=='settings.html'){
  let hasCachedSession=false;
  try{
    for(let i=0;i<localStorage.length;i++){
      const key=localStorage.key(i)||'';
      if(key.startsWith('sb-')&&key.includes('-auth-token')&&localStorage.getItem(key)){hasCachedSession=true;break;}
    }
  }catch{}
  let gateStyle=null;
  const reveal=()=>{document.documentElement.classList.remove('calibre-auth-pending');gateStyle?.remove();};
  const authPage=()=>location.replace(`settings.html?auth=required&next=${encodeURIComponent(here+location.search+location.hash)}`);
  if(!hasCachedSession){
    document.documentElement.classList.add('calibre-auth-pending');
    gateStyle=document.createElement('style');
    gateStyle.textContent="html.calibre-auth-pending body{visibility:hidden!important;pointer-events:none!important}html.calibre-auth-pending:before{content:'Calibre & Co.';position:fixed;inset:0;display:grid;place-items:center;background:#17191a;color:#f7f7f5;font:600 15px/1.2 Georgia,'Times New Roman',serif;letter-spacing:.16em;z-index:2147483647}";
    document.head.appendChild(gateStyle);
  }
  Promise.race([
    import('./cloud.js?v=4').then(mod=>mod.session()),
    new Promise((_,reject)=>setTimeout(()=>reject(new Error('Session check timed out')),4000))
  ]).then(session=>session?.user?reveal():authPage()).catch(err=>{
    if(hasCachedSession){console.warn('Cloud session check deferred',err);reveal();}
    else authPage();
  });
}

if(!document.querySelector('script[data-calibre-cloud-auto]')){
  const sync=document.createElement('script');sync.type='module';sync.src='js/cloud-auto.js?v=9';sync.dataset.calibreCloudAuto='1';document.head.appendChild(sync);
}
if(here==='work.html'){
  if(!document.querySelector('link[data-calibre-work-workspace]')){const workCss=document.createElement('link');workCss.rel='stylesheet';workCss.href='css/work-workspace.css?v=1';workCss.dataset.calibreWorkWorkspace='1';document.head.appendChild(workCss);}
  if(!document.querySelector('script[data-calibre-work-workspace]')){const workUi=document.createElement('script');workUi.type='module';workUi.src='js/work-ui-runtime.js?v=2';workUi.dataset.calibreWorkWorkspace='1';document.head.appendChild(workUi);}
}
if(here==='item.html'){
  if(!document.querySelector('link[data-calibre-item-workspace]')){const itemCss=document.createElement('link');itemCss.rel='stylesheet';itemCss.href='css/item-workspace.css?v=1';itemCss.dataset.calibreItemWorkspace='1';document.head.appendChild(itemCss);}
  if(!document.querySelector('script[data-calibre-item-workspace]')){const itemUi=document.createElement('script');itemUi.type='module';itemUi.src='js/item-ui-runtime.js?v=3';itemUi.dataset.calibreItemWorkspace='1';document.head.appendChild(itemUi);}
  if(!document.querySelector('script[data-calibre-item-commerce]')){const commerceUi=document.createElement('script');commerceUi.type='module';commerceUi.src='js/item-commerce-runtime.js?v=1';commerceUi.dataset.calibreItemCommerce='1';document.head.appendChild(commerceUi);}
}
if(here==='suppliers.html'){
  if(!document.querySelector('script[data-calibre-parts-intelligence]')){const partsUi=document.createElement('script');partsUi.type='module';partsUi.src='js/parts-ui-runtime.js?v=2';partsUi.dataset.calibrePartsIntelligence='1';document.head.appendChild(partsUi);}
  if(!document.querySelector('script[data-calibre-reference-intelligence]')){const refUi=document.createElement('script');refUi.type='module';refUi.src='js/reference-ui-runtime.js?v=1';refUi.dataset.calibreReferenceIntelligence='1';document.head.appendChild(refUi);}
}
if(here==='timegrapher.html'&&!document.querySelector('script[data-calibre-timegrapher-audit]')){const timingUi=document.createElement('script');timingUi.type='module';timingUi.src='js/timegrapher-audit-runtime.js?v=1';timingUi.dataset.calibreTimegrapherAudit='1';document.head.appendChild(timingUi);}
if(['index.html','calibre.html'].includes(here)&&!document.querySelector('script[data-calibre-visibility-ui]')){const visibilityUi=document.createElement('script');visibilityUi.type='module';visibilityUi.src='js/visibility-ui-runtime.js?v=1';visibilityUi.dataset.calibreVisibilityUi='1';document.head.appendChild(visibilityUi);}
if(['work.html','passport.html','suppliers.html'].includes(here)&&!document.querySelector('script[data-calibre-knowledge-learning]')){const learning=document.createElement('script');learning.type='module';learning.src='js/knowledge-learning-ui.js?v=1';learning.dataset.calibreKnowledgeLearning='1';document.head.appendChild(learning);}
if(here==='knowledge-admin.html'&&!document.querySelector('script[data-calibre-knowledge-prefill]')){const prefill=document.createElement('script');prefill.type='module';prefill.src='js/knowledge-admin-prefill.js?v=1';prefill.dataset.calibreKnowledgePrefill='1';document.head.appendChild(prefill);}
if(here==='bench.html'&&!document.querySelector('script[data-calibre-bench-knowledge]')){const knowledge=document.createElement('script');knowledge.type='module';knowledge.src='js/bench-knowledge-runtime.js?v=1';knowledge.dataset.calibreBenchKnowledge='1';document.head.appendChild(knowledge);}

const savedTheme=localStorage.getItem('calibre-theme');if(savedTheme==='dark')document.documentElement.dataset.theme='dark';else document.documentElement.removeAttribute('data-theme');
document.querySelectorAll('.brandbar').forEach(bar=>{if(bar.querySelector('.themebtn'))return;const button=document.createElement('button');button.className='themebtn';button.type='button';const label=()=>button.textContent=document.documentElement.dataset.theme==='dark'?'Light':'Dark';label();button.onclick=()=>{const dark=document.documentElement.dataset.theme!=='dark';document.documentElement.dataset.theme=dark?'dark':'';localStorage.setItem('calibre-theme',dark?'dark':'light');label();};bar.appendChild(button);});
import('./navigation-shell.js?v=2').then(({renderPrimaryNavigation})=>renderPrimaryNavigation(document,here)).catch(err=>console.warn('Navigation unavailable',err));
if(['calibre.html','assistant.html','news.html','knowledge-admin.html','reference-library.html','settings.html'].includes(here)){const tabs=[['calibre.html','Assistant'],['assistant.html','Inbox'],['news.html','Activity'],['knowledge-admin.html','Knowledge'],['reference-library.html','Library'],['settings.html','Settings']];const sub=document.createElement('nav');sub.className='contextnav calibre-contextnav';sub.setAttribute('aria-label','Calibre');sub.innerHTML=tabs.map(([href,label])=>`<a class="contextnav-btn${here===href?' active':''}" href="${href}"${here===href?' aria-current="page"':''}>${label}</a>`).join('');document.querySelector('nav.mainnav')?.insertAdjacentElement('afterend',sub);}
const style=document.createElement('style');style.textContent=`
:root{--bg:#f5f6f6;--surface:#fff;--surface-2:#eceeef;--ink:#17191a;--muted:#666c70;--line:#d7dadd;--nav:#17191a;--accent:#123f4c;--accent-soft:#2f6674;--brass:#123f4c;--brass-soft:#2f6674;--ok:#477261;--danger:#e83d32}
html[data-theme="dark"]{--bg:#121617;--surface:#1a2022;--surface-2:#232b2e;--ink:#f5f6f6;--muted:#9ba5a8;--line:#354044;--nav:#0d1112;--accent:#4d91a2;--accent-soft:#78adba;--brass:#4d91a2;--brass-soft:#78adba;--ok:#6e9886;--danger:#f05b50}
.brandmark{display:block!important;width:216px!important;height:50px!important;min-width:216px!important;border-radius:0!important;background:url('assets/brand/calibre-horizontal-black.svg') left center/contain no-repeat!important;color:transparent!important;font-size:0!important}.brand{gap:0!important}.brand>div:last-child{display:none!important}html[data-theme="dark"] .brandmark{background-image:url('assets/brand/calibre-horizontal-white.svg')!important}.navbtn{position:relative}.navbtn.active{border-bottom-color:var(--accent)!important}.btn:not(.secondary){background:var(--accent);border-color:var(--accent);color:#fff}.textbtn,.kicker,.stage-num,.timeline-item span,.star{color:var(--accent)}
.contextnav{display:flex;gap:2px;overflow-x:auto;scrollbar-width:none;margin:0 0 8px;padding:0;border-bottom:1px solid var(--line)}.contextnav::-webkit-scrollbar{display:none}.contextnav-btn{flex:0 0 auto;min-height:30px;display:inline-flex;align-items:center;padding:5px 8px 7px;border-bottom:2px solid transparent;color:var(--muted);text-decoration:none;font-size:.68rem;font-weight:700;white-space:nowrap;margin-bottom:-1px}.contextnav-btn.active{color:var(--accent);border-bottom-color:var(--accent)}
@media(max-width:640px){.brandmark{width:184px!important;height:44px!important;min-width:184px!important}.wb-toolbar{overflow-x:auto!important;flex-wrap:nowrap!important;scrollbar-width:none!important}.wb-toolbar::-webkit-scrollbar{display:none!important}.wb-toolbar button{flex:0 0 auto!important;min-height:40px!important;white-space:nowrap!important}}
`;document.head.appendChild(style);
