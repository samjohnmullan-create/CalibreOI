const here=(location.pathname.split('/').pop()||'index.html').split('?')[0]||'index.html';
const params=new URLSearchParams(location.search);
const requestedJobId=params.get('id')||'';
if(here==='workbench.html'&&params.get('view')==='service'){
  const target=requestedJobId?`service.html?id=${encodeURIComponent(requestedJobId)}`:'service.html';
  location.replace(target);
}

if(here!=='settings.html'){
  let hasCachedSession=false;
  try{for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i)||'';if(key.startsWith('sb-')&&key.includes('-auth-token')&&localStorage.getItem(key)){hasCachedSession=true;break;}}}catch{}
  let gateStyle=null;
  const reveal=()=>{document.documentElement.classList.remove('calibre-auth-pending');gateStyle?.remove();};
  const authPage=()=>location.replace(`settings.html?auth=required&next=${encodeURIComponent(here+location.search+location.hash)}`);
  if(!hasCachedSession){document.documentElement.classList.add('calibre-auth-pending');gateStyle=document.createElement('style');gateStyle.textContent="html.calibre-auth-pending body{visibility:hidden!important;pointer-events:none!important}html.calibre-auth-pending:before{content:'Calibre & Co.';position:fixed;inset:0;display:grid;place-items:center;background:#17191a;color:#f7f7f5;font:600 15px/1.2 Georgia,'Times New Roman',serif;letter-spacing:.16em;z-index:2147483647}";document.head.appendChild(gateStyle);}
  Promise.race([import('./cloud.js?v=4').then(mod=>mod.session()),new Promise((_,reject)=>setTimeout(()=>reject(new Error('Session check timed out')),4000))]).then(session=>session?.user?reveal():authPage()).catch(err=>{if(hasCachedSession){console.warn('Cloud session check deferred',err);reveal();}else authPage();});
}

if(!document.querySelector('script[data-calibre-cloud-auto]')){const sync=document.createElement('script');sync.type='module';sync.src='js/cloud-auto.js?v=8';sync.dataset.calibreCloudAuto='1';document.head.appendChild(sync);}

// Legacy watch rows inside Items used to navigate to plain summary.html while an async
// currentId save was still in flight. That could open whatever job was current before
// the click. Intercept those rows globally and carry the job id in the URL instead.
document.addEventListener('click',event=>{
  if(here!=='inventory.html')return;
  const link=event.target.closest?.('.item-link[data-legacy]');
  const id=link?.dataset?.legacy||'';
  if(!link||!id)return;
  event.preventDefault();
  event.stopImmediatePropagation();
  location.href=`summary.html?id=${encodeURIComponent(id)}`;
},true);

const savedTheme=localStorage.getItem('calibre-theme');
if(savedTheme==='dark')document.documentElement.dataset.theme='dark';else document.documentElement.removeAttribute('data-theme');
document.querySelectorAll('.brandbar').forEach(bar=>{if(bar.querySelector('.themebtn'))return;const button=document.createElement('button');button.className='themebtn';button.type='button';const label=()=>button.textContent=document.documentElement.dataset.theme==='dark'?'Light':'Dark';label();button.onclick=()=>{const dark=document.documentElement.dataset.theme!=='dark';document.documentElement.dataset.theme=dark?'dark':'';localStorage.setItem('calibre-theme',dark?'dark':'light');label();};bar.appendChild(button);});

const primary=[['home','index.html','Home','M4 10.5 12 4l8 6.5V20h-5v-6H9v6H4z'],['workshop','workbench.html','Workbench','M4 18h16M6 18V8h4v10M14 18V5h4v13'],['collection','inventory.html','Items','M5 7h14v13H5zM8 7V4h8v3M8 11h8'],['business','finance.html','Business','M5 7h14v11H5zM5 11h14M8 15h3'],['calibre','calibre.html','Calibre','M12 3a4 4 0 0 1 4 4v1a4 4 0 1 1 0 8v1a4 4 0 1 1-8 0v-1a4 4 0 1 1 0-8V7a4 4 0 0 1 4-4z']];
const pageGroup={'index.html':'home','workbench.html':'workshop','service.html':'workshop','passport.html':'workshop','timegrapher.html':'workshop','business.html':'workshop','sales.html':'workshop','summary.html':'workshop','suppliers.html':'workshop','documents.html':'workshop','inventory.html':'collection','item.html':'collection','work.html':'collection','finance.html':'business','calibre.html':'calibre','assistant.html':'calibre','news.html':'calibre','settings.html':'calibre'};
const activeGroup=pageGroup[here]||'home';
document.querySelectorAll('nav.mainnav').forEach(nav=>{nav.innerHTML=primary.map(([id,href,label,icon])=>`<a class="navbtn${id===activeGroup?' active':''}" href="${href}"${id===activeGroup?' aria-current="page"':''}><svg viewBox="0 0 24 24"><path d="${icon}"/></svg><span>${label}</span>${id==='calibre'?'<span class="newsdot" data-news-dot hidden></span>':''}</a>`).join('');});

const watchPages=new Set(['service.html','passport.html','timegrapher.html','business.html','sales.html','summary.html','suppliers.html','documents.html']);
if(watchPages.has(here)){
  document.body.classList.add('watch-page');
  const main=document.querySelector('nav.mainnav'),strip=document.createElement('section');strip.className='watch-strip';strip.setAttribute('aria-label','Current watch');strip.innerHTML='<div class="watch-strip-photo" data-watch-photo></div><div class="watch-strip-main"><div class="watch-strip-name" data-watch-name>Loading watch…</div><div class="watch-strip-meta" data-watch-meta></div></div><div class="watch-strip-state"><span class="badge" data-watch-status>—</span><span class="watch-strip-job" data-watch-job></span></div>';main?.insertAdjacentElement('afterend',strip);
  const suffix=requestedJobId?`?id=${encodeURIComponent(requestedJobId)}`:'',tabs=[['service.html','Service'],['passport.html','Passport'],['timegrapher.html','Timing'],['suppliers.html','Parts'],['business.html','Costs'],['sales.html','Sale'],['summary.html','Record'],['documents.html','Files']];
  const sub=document.createElement('nav');sub.className='contextnav watch-contextnav';sub.setAttribute('aria-label','Current watch');sub.innerHTML=tabs.map(([href,label])=>`<a class="contextnav-btn${here===href?' active':''}" href="${href}${suffix}"${here===href?' aria-current="page"':''}>${label}</a>`).join('');strip.insertAdjacentElement('afterend',sub);
  (async()=>{try{const mod=await import('./store.js?v=8'),state=await mod.loadState();let job=requestedJobId?state.jobs?.find(j=>String(j.id)===String(requestedJobId)):null;if(job&&state.currentId!==job.id){state.currentId=job.id;await mod.saveState(state);}else if(!job)job=mod.current(state);if(!job){strip.querySelector('[data-watch-name]').textContent='No watch open';strip.querySelector('[data-watch-meta]').textContent='Choose a watch from Workbench or Items.';return;}const p=job.passport||{},meta=[];if(p.maker)meta.push(p.maker);if(p.model)meta.push(p.model);if(p.calibre)meta.push(`Cal. ${p.calibre}`);if(p.jewels)meta.push(`${p.jewels} jewels`);if(p.year)meta.push(p.year);strip.querySelector('[data-watch-name]').textContent=job.watchName||[p.maker,p.model].filter(Boolean).join(' ')||'Untitled watch';strip.querySelector('[data-watch-meta]').textContent=meta.join(' · ')||'Passport not completed yet';strip.querySelector('[data-watch-status]').textContent=job.status||'Purchased';strip.querySelector('[data-watch-job]').textContent=job.jobId||'';const photo=strip.querySelector('[data-watch-photo]'),src=typeof mod.coverPhoto==='function'?mod.coverPhoto(job):'';if(src){const img=new Image();img.alt='';img.src=src;photo.appendChild(img);}else photo.textContent=(job.watchName||p.maker||'W').trim().charAt(0).toUpperCase();}catch(err){console.warn('Watch header unavailable',err);strip.querySelector('[data-watch-name]').textContent='Current watch';}})();
}

if(['calibre.html','assistant.html','news.html','settings.html'].includes(here)){const tabs=[['calibre.html','Assistant'],['assistant.html','Inbox'],['news.html','Activity'],['settings.html','Settings']],sub=document.createElement('nav');sub.className='contextnav calibre-contextnav';sub.setAttribute('aria-label','Calibre');sub.innerHTML=tabs.map(([href,label])=>`<a class="contextnav-btn${here===href?' active':''}" href="${href}"${here===href?' aria-current="page"':''}>${label}</a>`).join('');document.querySelector('nav.mainnav')?.insertAdjacentElement('afterend',sub);}

const style=document.createElement('style');style.textContent=`:root{--bg:#f5f6f6;--surface:#fff;--surface-2:#eceeef;--ink:#17191a;--muted:#666c70;--line:#d7dadd;--nav:#17191a;--accent:#123f4c;--accent-soft:#2f6674;--brass:#123f4c;--brass-soft:#2f6674;--ok:#477261;--danger:#e83d32}html[data-theme="dark"]{--bg:#121617;--surface:#1a2022;--surface-2:#232b2e;--ink:#f5f6f6;--muted:#9ba5a8;--line:#354044;--nav:#0d1112;--accent:#4d91a2;--accent-soft:#78adba;--brass:#4d91a2;--brass-soft:#78adba;--ok:#6e9886;--danger:#f05b50}.brandmark{display:block!important;width:216px!important;height:50px!important;min-width:216px!important;border-radius:0!important;background:url('assets/brand/calibre-horizontal-black.svg') left center/contain no-repeat!important;color:transparent!important;font-size:0!important}.brand{gap:0!important}.brand>div:last-child{display:none!important}html[data-theme="dark"] .brandmark{background-image:url('assets/brand/calibre-horizontal-white.svg')!important}.doc-logo img{content:url('assets/brand/calibre-mark-black.svg')!important}.pass-brand img{content:url('assets/brand/calibre-mark-white.svg')!important}.navbtn{position:relative}.navbtn.active{border-bottom-color:var(--accent)!important}.btn:not(.secondary){background:var(--accent);border-color:var(--accent);color:#fff}.textbtn,.kicker,.stage-num,.timeline-item span,.star{color:var(--accent)}.newsdot{position:absolute;top:6px;right:5px;width:6px;height:6px;border-radius:50%;background:var(--danger)}.contextnav{display:flex;gap:2px;overflow-x:auto;scrollbar-width:none;margin:0 0 8px;padding:0;border-bottom:1px solid var(--line)}.contextnav::-webkit-scrollbar{display:none}.contextnav-btn{flex:0 0 auto;min-height:30px;display:inline-flex;align-items:center;padding:5px 8px 7px;border-bottom:2px solid transparent;color:var(--muted);text-decoration:none;font-size:.68rem;font-weight:700;white-space:nowrap;margin-bottom:-1px}.contextnav-btn.active{color:var(--accent);border-bottom-color:var(--accent)}.watch-strip{display:grid;grid-template-columns:42px minmax(0,1fr) auto;gap:9px;align-items:center;padding:7px 0 8px;border-bottom:1px solid var(--line)}.watch-strip-photo{width:42px;height:42px;border-radius:6px;overflow:hidden;background:var(--surface-2);display:grid;place-items:center;color:var(--muted);font-weight:800}.watch-strip-photo img{width:100%;height:100%;object-fit:cover}.watch-strip-name{font-size:.93rem;font-weight:800;color:var(--ink)}.watch-strip-meta{margin-top:2px;color:var(--muted);font-size:.68rem}.watch-strip-state{display:flex;align-items:flex-end;flex-direction:column;gap:3px}.watch-strip-job{font-size:.62rem;color:var(--muted)}@media(max-width:640px){.brandmark{width:184px!important;height:44px!important;min-width:184px!important}.watch-strip{grid-template-columns:44px minmax(0,1fr)}.watch-strip-state{grid-column:2;align-items:flex-start}}`;document.head.appendChild(style);

// Second-pass mobile refinement for the most data-dense screens.
const mobileRefine=document.createElement('style');
mobileRefine.textContent=`
@media(max-width:640px){
  /* Workbench: turn each job into a true mobile card. */
  .wb-grid{display:grid!important;grid-template-columns:minmax(0,1fr)!important;gap:10px!important}
  .hub-card{grid-template-columns:72px minmax(0,1fr)!important;gap:11px!important;padding:11px!important;border-radius:14px!important;overflow:hidden!important}
  .hub-thumb{width:72px!important;height:72px!important;border-radius:12px!important}
  .hub-main,.hub-top,.hub-top>div{min-width:0!important}
  .hub-top{display:block!important}
  .hub-title{white-space:normal!important;overflow:visible!important;text-overflow:clip!important;font-size:1rem!important;line-height:1.18!important;overflow-wrap:anywhere!important}
  .hub-sub{font-size:.72rem!important;line-height:1.3!important;margin-top:4px!important;overflow-wrap:anywhere!important}
  .hub-top>.pill{display:inline-flex!important;margin-top:6px!important}
  .hub-line{font-size:.78rem!important;line-height:1.35!important;margin-top:8px!important;overflow-wrap:anywhere!important}
  .hub-line strong{display:block!important;margin:0 0 2px!important;font-size:.63rem!important}
  .hub-meta{grid-column:1/-1!important;display:flex!important;gap:5px!important;margin-top:9px!important}
  .hub-meta .pill{font-size:.68rem!important;padding:4px 7px!important}
  .hub-actions{grid-column:1/-1!important;display:grid!important;grid-template-columns:1fr 1fr!important;gap:7px!important;margin-top:11px!important}
  .hub-actions button{min-height:42px!important;width:100%!important;padding:7px 8px!important;font-size:.72rem!important;white-space:normal!important;line-height:1.15!important}
  .hub-actions .primary{grid-column:1/-1!important}
  .wb-summary{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:7px!important}
  .wb-summary .card{padding:10px!important}
  .wb-toolbar{overflow-x:auto!important;flex-wrap:nowrap!important;padding-bottom:2px!important;scrollbar-width:none!important}
  .wb-toolbar::-webkit-scrollbar{display:none!important}
  .wb-toolbar button{flex:0 0 auto!important;min-height:40px!important;white-space:nowrap!important}

  /* Business: stop figures colliding with item names. */
  .business-tabs{display:flex!important;overflow-x:auto!important;gap:6px!important;padding:0 0 4px!important;scroll-snap-type:x proximity!important}
  .business-tabs button{scroll-snap-align:start!important;min-height:40px!important;padding:7px 13px!important;font-size:.72rem!important}
  .panel-heading{display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;gap:8px!important;align-items:start!important}
  .panel-heading h3{font-size:1.12rem!important;line-height:1.15!important}
  .panel-heading .btn{min-height:40px!important;padding:6px 10px!important;white-space:normal!important;line-height:1.1!important;max-width:104px!important}
  #overviewStock .line,#overviewPerformance .line,#attentionRows .line,#portfolioRows .line,#agedRows .line,#soldRows .line,#performanceRows .line,#leaderRows .line{display:grid!important;grid-template-columns:minmax(0,1fr)!important;gap:5px!important;align-items:start!important;padding:11px 0!important}
  #overviewStock .line>span,#overviewPerformance .line>span,#attentionRows .line>span,#portfolioRows .line>span,#agedRows .line>span,#soldRows .line>span,#performanceRows .line>span,#leaderRows .line>span{min-width:0!important;width:100%!important;text-align:left!important;overflow-wrap:anywhere!important}
  #overviewStock .line>span:last-child,#overviewPerformance .line>span:last-child,#attentionRows .line>span:last-child,#portfolioRows .line>span:last-child,#agedRows .line>span:last-child,#soldRows .line>span:last-child,#performanceRows .line>span:last-child,#leaderRows .line>span:last-child{text-align:left!important}
  #overviewStock .line strong,#portfolioRows .line strong,#agedRows .line strong,#soldRows .line strong,#performanceRows .line strong,#leaderRows .line strong{line-height:1.2!important}
  #portfolioRows .line>a,#portfolioRows .line a{overflow-wrap:anywhere!important}
  .type-badge{margin-top:4px!important;vertical-align:middle!important}
  .business-metrics{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:1px!important}
  .business-metrics>div{min-width:0!important;padding:10px!important}
  .business-metrics strong{overflow-wrap:anywhere!important}
  .category-row{grid-template-columns:1fr 1fr!important;gap:9px!important;padding:12px 0!important}
  .category-row>span:first-child{grid-column:1/-1!important}
  .category-row span{min-width:0!important}
  .category-row strong{overflow-wrap:anywhere!important}
  .hero>label{width:min(180px,100%)!important}
  .hero>label select{width:100%!important}
}
@media(max-width:390px){
  .hub-card{grid-template-columns:62px minmax(0,1fr)!important}
  .hub-thumb{width:62px!important;height:62px!important}
  .hub-actions{grid-template-columns:1fr!important}
  .hub-actions .primary{grid-column:auto!important}
  .business-metrics{grid-template-columns:1fr!important}
  .panel-heading{grid-template-columns:1fr!important}
  .panel-heading .btn{max-width:none!important;width:100%!important}
}
`;
document.head.appendChild(mobileRefine);
