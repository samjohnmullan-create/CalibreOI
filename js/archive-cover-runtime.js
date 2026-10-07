import { loadState,current } from './store.js?v=26';
import { privateMediaThumbnailObjectUrl } from './media.js?v=3';

const pages=new Set(['index.html','inventory.html','calibre.html','sales.html','workbench.html','passport.html','timegrapher.html','business.html','summary.html','suppliers.html','documents.html','media.html']);
const here=(location.pathname.split('/').pop()||'index.html').split('?')[0]||'index.html';
if(pages.has(here)){
  let state=null,busy=false;
  const cache=new Map(),urls=[];
  function choose(job){
    const list=(job?.mediaAssets||[]).filter(a=>a?.storageKey&&!a?.deletedAt&&String(a.mimeType||'').startsWith('image/'));
    if(!list.length)return null;
    return list.find(a=>a.isCover)||list.sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||'')))[0];
  }
  async function getUrl(job){
    if(cache.has(job.id))return cache.get(job.id);
    const asset=choose(job);if(!asset){cache.set(job.id,'');return '';}
    try{const url=await privateMediaThumbnailObjectUrl(asset);cache.set(job.id,url);urls.push(url);return url;}catch{return '';}
  }
  function replacePlaceholder(ph,url,className){
    if(!ph||!url)return;
    if(ph.tagName==='IMG'){ph.src=url;return;}
    const img=document.createElement('img');img.alt='';img.src=url;if(className)img.className=className;ph.replaceWith(img);
  }
  async function paint(){
    if(busy)return;busy=true;
    try{
      state=state||await loadState();
      for(const card of document.querySelectorAll('.job-card[data-id]')){
        const job=state.jobs.find(j=>j.id===card.dataset.id);if(!job)continue;
        const url=await getUrl(job);if(url)replacePlaceholder(card.querySelector('.thumb'),url,'thumb');
      }
      const job=current(state);if(!job)return;const url=await getUrl(job);if(!url)return;
      const strip=document.querySelector('[data-watch-photo]');
      if(strip){const old=strip.querySelector('img');if(old)old.src=url;else{strip.textContent='';const img=document.createElement('img');img.alt='';img.src=url;strip.appendChild(img);}}
      const home=document.querySelector('#currentCard .current-body');if(home)replacePlaceholder(home.querySelector('img,.current-ph'),url,'');
      const calibre=document.querySelector('#watchCard .watch-top');if(calibre)replacePlaceholder(calibre.querySelector('.watch-photo,.watch-ph'),url,'watch-photo');
      if(here==='sales.html'){
        const head=document.querySelector('.sales-hero .price-card .price-main');
        if(head&&!head.querySelector('.archive-sale-photo')){const box=document.createElement('div');box.className='archive-sale-photo';const img=document.createElement('img');img.alt='';img.src=url;box.appendChild(img);head.prepend(box);}
      }
    }finally{busy=false;}
  }
  const style=document.createElement('style');style.textContent='.archive-sale-photo{width:78px;height:78px;border-radius:9px;overflow:hidden;background:var(--surface-2);flex:0 0 78px}.archive-sale-photo img{width:100%;height:100%;object-fit:cover;display:block}@media(max-width:640px){.sales-hero .price-main{flex-wrap:wrap}.archive-sale-photo{width:64px;height:64px;flex-basis:64px}}';document.head.appendChild(style);
  const start=()=>{paint();const o=new MutationObserver(()=>setTimeout(paint,60));o.observe(document.body,{childList:true,subtree:true});window.addEventListener('beforeunload',()=>{o.disconnect();urls.forEach(url=>URL.revokeObjectURL(url));});};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
}
