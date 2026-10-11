import {loadState,saveState,escapeHtml} from './store.js?v=8';
import {currentWork} from './work-model.js?v=2';
import {contextualKnowledge,getTimegrapherDefaults,passportPatchForMovement,movementIdentityForItem} from './knowledge-engine.js?v=2';

const here=(location.pathname.split('/').pop()||'index.html').split('?')[0],esc=escapeHtml;
const has=v=>String(v??'').trim()!=='';
const params=new URLSearchParams(location.search);
function context(state){
  const requestedItem=params.get('id')||params.get('item')||'',requestedWork=params.get('work')||params.get('workId')||'';
  const work=(state.work||[]).find(w=>String(w.id)===String(requestedWork))||currentWork(state)||null;
  const itemId=requestedItem||work?.itemId||state.currentItemId||'';
  const item=(state.items||[]).find(i=>String(i.id)===String(itemId))||null;
  return {item,work};
}
function style(){if(document.getElementById('knowledgeRuntimeStyle'))return;const s=document.createElement('style');s.id='knowledgeRuntimeStyle';s.textContent=`.knowledge-strip{margin:10px 0;padding:12px 13px;border:1px solid color-mix(in srgb,var(--accent) 30%,var(--line));border-radius:10px;background:color-mix(in srgb,var(--accent) 3%,var(--surface))}.knowledge-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.knowledge-head h3{margin:2px 0 3px;font-size:.86rem}.knowledge-head p{margin:0;color:var(--muted);font-size:.66rem;line-height:1.4}.knowledge-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin-top:9px}.knowledge-fact{padding:8px;border:1px solid var(--line);border-radius:7px;background:var(--surface)}.knowledge-fact span{display:block;color:var(--muted);font-size:.55rem;text-transform:uppercase;letter-spacing:.06em}.knowledge-fact strong{display:block;margin-top:2px;font-size:.73rem}.knowledge-list{display:grid;gap:6px;margin-top:9px}.knowledge-row{display:flex;justify-content:space-between;gap:10px;padding-top:7px;border-top:1px solid var(--line);font-size:.65rem}.knowledge-row small{color:var(--muted)}.knowledge-tag{white-space:nowrap;color:var(--accent);font-weight:800}.knowledge-actions{display:flex;gap:6px;flex-wrap:wrap;margin-top:9px}.knowledge-source{margin-top:7px;font-size:.58rem;color:var(--muted);overflow-wrap:anywhere}@media(max-width:760px){.knowledge-grid{grid-template-columns:1fr 1fr}.knowledge-head{display:grid}}`;document.head.appendChild(s);}
function fact(label,value){return `<div class="knowledge-fact"><span>${esc(label)}</span><strong>${esc(value??'—')}</strong></div>`;}
function confidenceLabel(value){return value==='confirmed'?'Exact documented ref':value==='family-reported'?'Family reference — verify':'Candidate — verify';}

async function mountPassport(){
  const state=await loadState(),{item}=context(state);if(!item?.watch)return;const k=contextualKnowledge(item,state);if(!k.movement)return;
  style();const m=k.movement,box=document.createElement('section');box.className='knowledge-strip';box.id='passportKnowledge';
  box.innerHTML=`<div class="knowledge-head"><div><div class="kicker">CALIBRE KNOWLEDGE</div><h3>${esc(m.maker)} ${esc(m.calibre)} verified movement specification</h3><p>Suggestions fill empty movement fields only. Watch maker/model/year are never inferred from the movement record.</p></div><button class="btn secondary" id="applyKnowledgePassport" type="button">Fill missing movement fields</button></div><div class="knowledge-grid">${fact('Diameter',m.diameter!=null?`${m.diameter} mm`:'—')}${fact('Jewels',m.jewels)}${fact('Beat rate',m.bph?`${m.bph} BPH`:'—')}${fact('Power reserve',m.powerReserve?`${m.powerReserve} h`:'—')}</div><div class="knowledge-source">Source: ${m.source?`<a href="${esc(m.source)}" target="_blank" rel="noopener">${esc(m.source)}</a>`:'No source URL'}</div>`;
  (document.querySelector('.overview')||document.querySelector('.identity-head'))?.insertAdjacentElement('afterend',box);
  box.querySelector('#applyKnowledgePassport').onclick=async()=>{
    const patch=passportPatchForMovement(m.maker,m.calibre),passport=item.watch.passport=item.watch.passport||{},applied=[];
    const mapping={movementMaker:'movementMaker',calibre:'calibre',jewels:'jewels',movementMm:'movementMm',beatRate:'beatRate',powerReserve:'powerReserve',movementType:'movementType',settingType:'settingType'};
    for(const [field,inputId] of Object.entries(mapping)){if(!has(passport[field])&&has(patch?.[field])){passport[field]=patch[field];applied.push(field);const input=document.getElementById(inputId);if(input){input.value=String(patch[field]);input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));}}}
    passport.knowledgeSource=passport.knowledgeSource||patch?.knowledgeSource||'';passport.knowledgeMovementKey=`${m.maker}:${m.calibre}`;passport.knowledgeReviewedAt=new Date().toISOString();item.updatedAt=new Date().toISOString();await saveState(state);
    box.querySelector('#applyKnowledgePassport').textContent=applied.length?`Filled ${applied.length} field${applied.length===1?'':'s'}`:'Nothing missing';
  };
}

async function mountTimegrapher(){
  const state=await loadState(),{item}=context(state);if(!item?.watch)return;const {maker,calibre}=movementIdentityForItem(item),defaults=getTimegrapherDefaults(maker,calibre);if(!defaults)return;
  style();const bph=document.getElementById('bph'),lift=document.getElementById('lift');
  if(bph&&defaults.bph&&String(bph.value||'0')==='0'){if(![...bph.options].some(o=>o.value===String(defaults.bph))){const o=new Option(String(defaults.bph),String(defaults.bph));bph.add(o);}bph.value=String(defaults.bph);bph.dispatchEvent(new Event('change',{bubbles:true}));}
  if(lift&&defaults.liftAngle!=null){if(![...lift.options].some(o=>o.value===String(defaults.liftAngle))){const o=new Option(String(defaults.liftAngle),String(defaults.liftAngle));lift.add(o);}lift.value=String(defaults.liftAngle);lift.dispatchEvent(new Event('change',{bubbles:true}));}
  const panel=[...document.querySelectorAll('.panel')].find(el=>el.textContent.includes('Run setup'))||document.querySelector('.instrument-side');if(!panel)return;
  const note=document.createElement('div');note.className='knowledge-strip';note.innerHTML=`<div class="knowledge-head"><div><div class="kicker">MOVEMENT SPEC</div><h3>${esc(maker)} ${esc(calibre)}</h3><p>${defaults.bph?`${defaults.bph} BPH · ${defaults.frequency??'—'} Hz`: 'BPH not documented'}${defaults.liftAngle!=null?` · ${defaults.liftAngle}° lift angle`:' · lift angle not documented — left unchanged'}</p></div><span class="knowledge-tag">Verified calibre</span></div><div class="knowledge-source">${defaults.source?`Source: <a href="${esc(defaults.source)}" target="_blank" rel="noopener">${esc(defaults.source)}</a>`:''}</div>`;panel.appendChild(note);
}

function suggestionsHtml(k){
  const rows=[];
  if(k.parts.length){const exact=k.parts.filter(p=>p.exact),shown=(exact.length?exact:k.parts).slice(0,4);rows.push(...shown.map(p=>`<div class="knowledge-row"><div><strong>${esc(String(p.partType||'part').replaceAll('_',' '))}</strong><br><small>${esc(p.reference)}</small></div><span class="knowledge-tag">${esc(confidenceLabel(p.confidence))}</span></div>`));}
  for(const d of k.documents.slice(0,2)){const title=d.title||d.fileName||'Technical document',url=d.url||d.sourceUrl||'';rows.push(`<div class="knowledge-row"><div><strong>${esc(title)}</strong><br><small>${esc(d.provider||d.source||'Reference')}</small></div>${url?`<a class="knowledge-tag" href="${esc(url)}" target="_blank" rel="noopener">OPEN ↗</a>`:'<span class="knowledge-tag">REFERENCE</span>'}</div>`);}
  return rows.join('');
}
async function mountWorkshopSuggestions(){
  const state=await loadState(),{item,work}=context(state);if(!item?.watch)return;const k=contextualKnowledge(item,state);if(!k.movement&&!k.parts.length&&!k.documents.length)return;style();
  const box=document.createElement('section');box.className='knowledge-strip';box.id='workshopKnowledge';box.innerHTML=`<div class="knowledge-head"><div><div class="kicker">CALIBRE SUGGESTIONS</div><h3>${esc(k.maker||'Movement')} ${esc(k.calibre||'')}</h3><p>${work?.title?`${esc(work.title)} · `:''}Sourced movement facts, likely part references and technical material. Family references still require physical verification.</p></div><span class="knowledge-tag">${k.parts.length} part ref${k.parts.length===1?'':'s'} · ${k.documents.length} doc${k.documents.length===1?'':'s'}</span></div><div class="knowledge-list">${suggestionsHtml(k)||'<div class="knowledge-row"><small>No linked part/document suggestions yet.</small></div>'}</div>`;
  const anchor=document.querySelector('.work-context')||document.querySelector('.hero')||document.querySelector('main')||document.querySelector('.shell');anchor?.insertAdjacentElement('afterend',box);
}

try{if(here==='passport.html')mountPassport();else if(here==='timegrapher.html')mountTimegrapher();else if(['work.html','workbench.html','suppliers.html'].includes(here))mountWorkshopSuggestions();}catch(error){console.warn('Calibre knowledge suggestions unavailable',error);}
