import {loadState,saveState,escapeHtml} from './store.js?v=26';
import {currentWork} from './work-model.js';
import {extractTechnicalReferenceCandidates,readPdfText} from './reference-pdf-import.js';
import {validateReferenceImport,importReferenceFacts} from './reference-import.js';

const PDFJS_URL='https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.mjs';
const PDFJS_WORKER='https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.mjs';

if((location.pathname.split('/').pop()||'')==='suppliers.html')enhancePdfImport();

async function loadPdfJs(){
  const mod=await import(PDFJS_URL);
  if(mod.GlobalWorkerOptions)mod.GlobalWorkerOptions.workerSrc=PDFJS_WORKER;
  return mod;
}

async function enhancePdfImport(){
  const card=document.querySelector('.ref-intel');
  if(!card)return;
  let state=await loadState(),work=currentWork(state),rows=[],report=null;
  if(!work)return;
  const item=(state.items||[]).find(x=>String(x.id)===String(work.itemId))||{};
  const defaultCalibre=item.watch?.passport?.calibre||item.watch?.movement?.calibre||'';
  const details=document.createElement('details');
  details.className='ref-pdf-import';
  details.innerHTML=`<summary>Technical PDF import</summary><div class="ref-pdf-body"><p class="muted small">Text-based PDFs only in this pass. Calibre extracts page text, proposes candidate relationships, and waits for your approval.</p><div class="ref-pdf-meta"><label>Source<select id="pdfSource"><option value="manual">Service manual</option><option value="factory">Factory / manufacturer</option><option value="catalogue">Parts catalogue</option><option value="cousins">Cousins UK document</option><option value="other">Other reference</option></select></label><label>Default calibre<input id="pdfCalibre" value="${escapeHtml(defaultCalibre)}"></label><label>Source URL<input id="pdfUrl" inputmode="url" placeholder="Optional"></label></div><div class="ref-import-actions"><label class="btn secondary filebtn">Choose PDF<input id="pdfFile" type="file" accept="application/pdf,.pdf"></label><button id="pdfAnalyseText" class="btn secondary" type="button">Analyse pasted text</button></div><textarea id="pdfPaste" rows="5" placeholder="Or paste text extracted from a technical sheet here. Separate pages with a line containing --- PAGE ---"></textarea><div id="pdfStatus" class="ref-import-preview muted small">No PDF selected.</div><div id="pdfCandidates"></div><button id="pdfCommit" class="btn" type="button" disabled>Import selected candidates</button></div>`;
  const results=card.querySelector('#refResults');
  card.insertBefore(details,results);
  const $=id=>details.querySelector('#'+id),esc=v=>escapeHtml(String(v??''));

  function sourceName(file){return file?.name||'Pasted technical reference';}
  function sourceMeta(file){return {source:$('pdfSource').value,sourceName:sourceName(file),fileName:sourceName(file),sourceUrl:$('pdfUrl').value.trim(),defaultCalibre:$('pdfCalibre').value.trim()};}
  function makePagesFromPaste(text=''){
    return String(text).split(/\n\s*---\s*PAGE\s*---\s*\n/i).map((part,i)=>({page:i+1,text:part.trim()})).filter(p=>p.text);
  }
  function renderCandidates(){
    if(!report){$('pdfCandidates').innerHTML='';$('pdfCommit').disabled=true;return;}
    const valid=report.valid||[];
    $('pdfStatus').innerHTML=`<div class="ref-import-stats"><span>${report.total} candidates</span><span>${valid.length} valid</span><span>${report.duplicates.length} duplicates</span><span>${report.rejected.length} rejected</span></div><div class="small muted">PDF candidates start selected, but review them before import. Confidence is deliberately conservative.</div>`;
    $('pdfCandidates').innerHTML=valid.slice(0,120).map(({fact},i)=>`<label class="pdf-candidate"><input type="checkbox" data-pdf-row="${i}" checked><span><strong>${esc(fact.calibre||'Unknown calibre')} · ${esc(fact.partName||fact.partReference||'Reference')}</strong><small>${esc(fact.partReference||'No part number')} · ${esc(fact.sourceRef)} · ${fact.confidence}%</small><em>${esc(fact.notes)}</em></span></label>`).join('')||'<p class="muted small">No importable candidates found.</p>';
    $('pdfCommit').disabled=!valid.length;
  }
  function setRows(candidateRows){rows=candidateRows;report=validateReferenceImport(rows,state.referenceFacts||[],{confidence:60});renderCandidates();}

  $('pdfFile').onchange=async event=>{
    const file=event.target.files?.[0];if(!file)return;
    $('pdfStatus').textContent='Reading PDF…';$('pdfCommit').disabled=true;
    try{
      const pdfjs=await loadPdfJs(),pages=await readPdfText(file,{pdfjs});
      const textChars=pages.reduce((sum,p)=>sum+String(p.text||'').replace(/\s/g,'').length,0);
      if(textChars<80)throw new Error('Very little selectable text was found. This looks like a scanned/image PDF; OCR support comes in the next pass.');
      setRows(extractTechnicalReferenceCandidates(pages,sourceMeta(file)));
    }catch(error){report=null;rows=[];$('pdfCandidates').innerHTML='';$('pdfCommit').disabled=true;$('pdfStatus').textContent=`Could not analyse PDF: ${error.message}`;}
  };

  $('pdfAnalyseText').onclick=()=>{
    const pages=makePagesFromPaste($('pdfPaste').value);
    if(!pages.length){$('pdfStatus').textContent='Paste some technical reference text first.';return;}
    setRows(extractTechnicalReferenceCandidates(pages,sourceMeta(null)));
  };

  $('pdfCommit').onclick=async()=>{
    if(!report?.valid?.length)return;
    const selected=new Set([...details.querySelectorAll('[data-pdf-row]:checked')].map(el=>Number(el.dataset.pdfRow)));
    const selectedReport={...report,valid:report.valid.filter((_,i)=>selected.has(i))};
    if(!selectedReport.valid.length){$('pdfStatus').textContent='Select at least one candidate to import.';return;}
    const result=importReferenceFacts(state,selectedReport);await saveState(state);state=await loadState();work=currentWork(state)||work;
    $('pdfStatus').textContent=`Imported ${result.imported} reviewed candidates. ${report.duplicates.length} duplicates and ${report.rejected.length} rejected rows were not imported.`;
    $('pdfCommit').disabled=true;report=null;rows=[];
  };

  const style=document.createElement('style');style.textContent=`.ref-pdf-body{margin-top:9px}.ref-pdf-meta{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px}.ref-pdf-meta label:last-child{grid-column:1/-1}.ref-pdf-body textarea{width:100%;margin:8px 0;min-height:110px}.pdf-candidate{display:grid;grid-template-columns:20px 1fr;gap:8px;padding:8px 0;border-top:1px solid var(--line);align-items:start;cursor:pointer}.pdf-candidate input{margin-top:4px}.pdf-candidate span{display:grid;gap:2px}.pdf-candidate small,.pdf-candidate em{font-size:.62rem;color:var(--muted);font-style:normal}.pdf-candidate em{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}@media(max-width:760px){.ref-pdf-meta{grid-template-columns:1fr}.ref-pdf-meta label:last-child{grid-column:auto}.pdf-candidate em{white-space:normal}}`;document.head.appendChild(style);
}
