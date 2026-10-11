import {loadState} from './store.js?v=26';
import {itemDisplayName} from './item-model.js?v=4';
import {workshopAssets} from './workshop-assets.js?v=2';

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s??'').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,' ').trim();
const words=s=>norm(s).split(/\s+/).filter(Boolean);
const page=(location.pathname.split('/').pop()||'index.html').split('?')[0];
let state=null,rows=[],active=0,open=false;

const actions=[
  ['Workbench','Open the bench command centre','workbench.html','Action'],
  ['Items','Browse all Items','inventory.html','Action'],
  ['New / intake','Open Items and create or receive stock','inventory.html','Action'],
  ['Movement Finder','Identify a movement from markings and measurements','movement-finder.html','Action'],
  ['Parts','Open Parts for the current Work record','suppliers.html','Action'],
  ['Timegrapher','Open the mechanical timing tool','timegrapher.html','Action'],
  ['Workshop IDs','Tools, loose parts and storage locations','workshop-assets.html','Action'],
  ['QR labels','Print or export workshop labels','qr-labels.html','Action'],
  ['QR scanner','Scan a Calibre workshop code','qr-scan.html','Action'],
  ['Business','Open business overview','business.html','Action'],
  ['Finance','Open finance and profitability','finance.html','Action'],
  ['Knowledge','Open Knowledge research inbox','knowledge-admin.html','Action'],
  ['Reference Library','Open workshop reference material','reference-library.html','Action'],
  ['Settings','Open Calibre settings','settings.html','Action'],
  ['Australian Watch & Clock Supplies','Supplier · Australia','https://www.australianwatchclocksupplies.com.au/','Supplier'],
  ['Australian Jewellers Supplies','Supplier · Australia','https://www.jewellerssupplies.com.au/','Supplier'],
  ['All Time Co.','Supplier · Australia','https://alltimeco.com.au/','Supplier'],
  ['Cousins UK','Supplier · overseas','https://www.cousinsuk.com/','Supplier']
];

function itemRows(){return (state?.items||[]).map(item=>{const i=item.identity||{},p=item.watch?.passport||{},m=item.watch?.movement||{};const title=itemDisplayName(item);const meta=[item.type,item.status,i.maker,i.model,p.calibre||m.calibre,i.reference,i.serial].filter(Boolean).join(' · ');return {kind:'Item',title,meta,href:`item.html?id=${encodeURIComponent(item.id)}`,search:[title,meta,item.id,(item.tags||[]).join(' ')].join(' ')};});}
function workRows(){const items=new Map((state?.items||[]).map(i=>[String(i.id),i]));return (state?.work||[]).map(work=>{const item=items.get(String(work.itemId)),itemName=item?itemDisplayName(item):'Unknown Item',title=work.title||'Work';const meta=[itemName,work.status,work.nextAction,work.blocker].filter(Boolean).join(' · ');return {kind:'Work',title:`${itemName} — ${title}`,meta,href:`work.html?id=${encodeURIComponent(work.id)}`,search:[title,meta,work.id,work.diagnosis,work.outcome,work.notes].join(' ')};});}
function assetRows(){return workshopAssets(state||{}).map(a=>({kind:a.type==='tool'?'Tool':a.type==='part'?'Part':'Location',title:a.name,meta:[a.location,a.calibre,a.partName,a.quantity?`Qty ${a.quantity}`:''].filter(Boolean).join(' · '),href:`workshop-assets.html?id=${encodeURIComponent(a.id)}`,search:[a.name,a.location,a.calibre,a.partName,a.notes,a.id].join(' ')}));}
function actionRows(){return actions.map(([title,meta,href,kind])=>({kind,title,meta,href,search:`${title} ${meta}`}));}
function movementRows(){const seen=new Set(),out=[];for(const item of state?.items||[]){const p=item.watch?.passport||{},m=item.watch?.movement||{},maker=p.movementMaker||m.maker||item.identity?.maker||'',calibre=p.calibre||m.calibre||'';if(!maker&&!calibre)continue;const key=norm(`${maker} ${calibre}`);if(!key||seen.has(key))continue;seen.add(key);out.push({kind:'Movement',title:[maker,calibre].filter(Boolean).join(' '),meta:`Recorded on ${itemDisplayName(item)}`,href:`movement-finder.html?item=${encodeURIComponent(item.id)}`,search:`${maker} ${calibre} ${itemDisplayName(item)}`});}return out;}
function allRows(){return [...itemRows(),...workRows(),...assetRows(),...movementRows(),...actionRows()];}
function score(row,q){if(!q)return row.kind==='Action'?10:4;const text=norm(`${row.title} ${row.meta} ${row.search}`),parts=words(q);if(!parts.every(w=>text.includes(w)))return -1;let s=parts.length*8,title=norm(row.title),meta=norm(row.meta);if(title===norm(q))s+=80;if(title.startsWith(norm(q)))s+=35;for(const w of parts){if(title.split(' ').includes(w))s+=15;if(meta.includes(w))s+=3;}if(row.kind==='Item')s+=7;else if(row.kind==='Work')s+=6;else if(row.kind==='Movement')s+=5;return s;}
function results(q){const base=allRows(),ranked=base.map(row=>({...row,score:score(row,q)})).filter(r=>r.score>=0).sort((a,b)=>b.score-a.score||a.title.localeCompare(b.title));if(q.trim())ranked.unshift({kind:'Movement',title:`Search Movement Finder for “${q.trim()}”`,meta:'Use the full 3,458-calibre Knowledge catalogue',href:`movement-finder.html?q=${encodeURIComponent(q.trim())}`,search:q,score:999});return ranked.slice(0,30);}

function mount(){if(document.querySelector('[data-global-command]'))return;const link=document.createElement('link');link.rel='stylesheet';link.href='css/global-command.css?v=1';link.dataset.globalCommandCss='1';document.head.appendChild(link);
  const trigger=document.createElement('button');trigger.type='button';trigger.className='global-command-trigger';trigger.setAttribute('aria-label','Search Calibre');trigger.innerHTML='<span aria-hidden="true">⌕</span><span class="global-command-trigger-label">Search</span><kbd>⌘K</kbd>';document.querySelector('.brandbar')?.appendChild(trigger);
  const root=document.createElement('div');root.className='global-command';root.dataset.globalCommand='1';root.hidden=true;root.innerHTML=`<div class="global-command-backdrop" data-close></div><section class="global-command-panel" role="dialog" aria-modal="true" aria-label="Search Calibre"><div class="global-command-input-row"><span aria-hidden="true">⌕</span><input id="globalCommandInput" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Search Items, Work, parts, movements, tools…"><button type="button" class="global-command-close" data-close aria-label="Close">×</button></div><div class="global-command-results" id="globalCommandResults"></div><footer><span><kbd>↑</kbd><kbd>↓</kbd> move</span><span><kbd>Enter</kbd> open</span><span><kbd>Esc</kbd> close</span></footer></section>`;document.body.appendChild(root);
  trigger.onclick=show;root.querySelectorAll('[data-close]').forEach(el=>el.onclick=hide);const input=root.querySelector('#globalCommandInput');input.oninput=()=>paint(input.value);input.onkeydown=e=>{if(e.key==='ArrowDown'){e.preventDefault();move(1);}else if(e.key==='ArrowUp'){e.preventDefault();move(-1);}else if(e.key==='Enter'){e.preventDefault();go(rows[active]);}else if(e.key==='Escape'){e.preventDefault();hide();}};
}
function paint(q=''){const host=document.getElementById('globalCommandResults');if(!host)return;rows=results(q);active=Math.min(active,Math.max(0,rows.length-1));host.innerHTML=rows.length?rows.map((r,i)=>`<button type="button" class="global-command-result${i===active?' active':''}" data-index="${i}"><span class="global-command-kind">${esc(r.kind)}</span><span class="global-command-copy"><strong>${esc(r.title)}</strong><small>${esc(r.meta||'')}</small></span><span class="global-command-open">↵</span></button>`).join(''):'<div class="global-command-empty">Nothing matched that search.</div>';host.querySelectorAll('[data-index]').forEach(btn=>{btn.onmouseenter=()=>{active=Number(btn.dataset.index);mark();};btn.onclick=()=>go(rows[Number(btn.dataset.index)]);});}
function mark(){document.querySelectorAll('.global-command-result').forEach((el,i)=>el.classList.toggle('active',i===active));document.querySelector(`.global-command-result[data-index="${active}"]`)?.scrollIntoView({block:'nearest'});}
function move(delta){if(!rows.length)return;active=(active+delta+rows.length)%rows.length;mark();}
function go(row){if(!row)return;hide();if(/^https?:/i.test(row.href))window.open(row.href,'_blank','noopener');else location.href=row.href;}
async function show(){const root=document.querySelector('[data-global-command]');if(!root)return;open=true;root.hidden=false;document.documentElement.classList.add('global-command-open');if(!state){try{state=await loadState();}catch{state={items:[],work:[],inventory:{}};}}active=0;const input=document.getElementById('globalCommandInput');input.value='';paint('');requestAnimationFrame(()=>input.focus());}
function hide(){const root=document.querySelector('[data-global-command]');if(!root)return;open=false;root.hidden=true;document.documentElement.classList.remove('global-command-open');}

document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();open?hide():show();}else if(e.key==='Escape'&&open)hide();});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
window.CalibreCommand={open:show,close:hide};
