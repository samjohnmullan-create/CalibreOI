import {loadState,escapeHtml} from './store.js';
import {currentWork} from './work-model.js';

const here=(location.pathname.split('/').pop()||'index.html').split('?')[0]||'index.html';
const enc=v=>encodeURIComponent(String(v||''));
function toolRow(href,title,copy,label='OPEN →'){return `<a class="system-row" href="${href}"><div><strong>${escapeHtml(title)}</strong><span>${escapeHtml(copy)}</span></div><div class="system-state">${escapeHtml(label)}</div></a>`;}
function deepLinks(state={}){
  const work=currentWork(state),item=work?(state.items||[]).find(x=>String(x.id)===String(work.itemId)):(state.items||[]).find(x=>String(x.id)===String(state.currentItemId));
  const itemId=item?.id?enc(item.id):'',workId=work?.id?enc(work.id):'';
  return {work:workId?`work.html?id=${workId}`:'workbench.html',timing:workId?`bench-timegrapher.html?work=${workId}`:'bench-timegrapher.html',parts:workId?`suppliers.html?work=${workId}`:'suppliers.html',capture:itemId?`capture.html?item=${itemId}${workId?`&work=${workId}`:''}`:'capture.html',item:itemId?`item.html?id=${itemId}`:'inventory.html',finder:itemId?`movement-finder.html?item=${itemId}`:'movement-finder.html',library:'reference-library.html',archive:'archive.html'};
}
async function enhanceHome(){
  const aside=document.querySelector('.home-grid aside.stack');if(!aside||aside.querySelector('[data-workshop-tools]'))return;
  const state=await loadState(),links=deepLinks(state),work=currentWork(state),section=document.createElement('section');section.className='card';section.dataset.workshopTools='1';
  section.innerHTML=`<div class="section-title"><h3>Workshop tools</h3><a href="calibre.html" class="textbtn">Calibre</a></div><div class="system-list home-tool-list">${toolRow(links.work,work?'Resume work':'Open Workbench',work?.nextAction||'Diagnosis, service steps and QC in one place.',work?'RESUME →':'OPEN →')}${toolRow(links.timing,'Timegrapher','Live microphone timing, calibration, beat trace and saved Work runs.')}${toolRow(links.parts,'Parts intelligence','Stock, donor matching and sourced compatibility evidence.')}${toolRow(links.finder,'Movement Finder','Rank movement candidates from markings, measurements and timing clues.')}${toolRow(links.capture,'Capture station','Attach microscope and camera evidence to the current Item or Work.')}${toolRow(links.library,'Reference Library','Technical PDFs, catalogues and imported source evidence.')}</div>`;
  const recent=aside.querySelector('#recentList')?.closest('section.card');if(recent)aside.insertBefore(section,recent);else aside.appendChild(section);
  const style=document.createElement('style');style.textContent=`.home-tool-list{border-top:1px solid var(--line)}.home-tool-list .system-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:9px;align-items:center;padding:9px 0;border-bottom:1px solid var(--line);text-decoration:none}.home-tool-list .system-row strong{font-size:.76rem}.home-tool-list .system-row span{display:block;margin-top:2px;font-size:.64rem;color:var(--muted)}.home-tool-list .system-state{font-size:.62rem;color:var(--muted);white-space:nowrap}`;document.head.appendChild(style);
}
async function enhanceCalibre(){
  const list=document.querySelector('.side-block .system-list');if(!list||list.querySelector('[data-reference-library-tool]'))return;
  const state=await loadState(),links=deepLinks(state);
  const timing=document.createElement('a');timing.className='system-row';timing.href=links.timing;timing.dataset.timegrapherTool='1';timing.innerHTML=`<div><strong>Timegrapher</strong><span>Live microphone timing, beat trace, lock diagnostics and calibration. Standalone testing works without an open Work record.</span></div><div class="system-state">OPEN →</div>`;
  const parts=document.createElement('a');parts.className='system-row';parts.href=links.parts;parts.dataset.partsIntelligenceTool='1';parts.innerHTML=`<div><strong>Parts intelligence</strong><span>Requirements, donor matching, reference evidence and technical PDF import.</span></div><div class="system-state">OPEN →</div>`;
  const finder=document.createElement('a');finder.className='system-row';finder.href=links.finder;finder.dataset.movementFinderTool='1';finder.innerHTML=`<div><strong>Movement Finder</strong><span>Rank calibre candidates from maker marks, size, BPH, jewels and winding type.</span></div><div class="system-state">OPEN →</div>`;
  const library=document.createElement('a');library.className='system-row';library.href=links.library;library.dataset.referenceLibraryTool='1';library.innerHTML=`<div><strong>Reference Library</strong><span>Search the technical documents and catalogues that feed compatibility intelligence.</span></div><div class="system-state">OPEN →</div>`;
  const archive=document.createElement('a');archive.className='system-row';archive.href=links.archive;archive.dataset.archiveTool='1';archive.innerHTML=`<div><strong>Archive & Restore</strong><span>Hide Items and workshop inventory safely without deleting Work, costs or provenance.</span></div><div class="system-state">OPEN →</div>`;
  const capture=list.querySelector('a[href^="capture.html"]');if(capture){capture.insertAdjacentElement('afterend',timing);timing.insertAdjacentElement('afterend',parts);parts.insertAdjacentElement('afterend',finder);finder.insertAdjacentElement('afterend',library);library.insertAdjacentElement('afterend',archive);}else{list.prepend(archive);list.prepend(library);list.prepend(finder);list.prepend(parts);list.prepend(timing);}
}
if(here==='index.html')enhanceHome().catch(err=>console.warn('Home workshop tools unavailable',err));
if(here==='calibre.html')enhanceCalibre().catch(err=>console.warn('Calibre tool visibility unavailable',err));
