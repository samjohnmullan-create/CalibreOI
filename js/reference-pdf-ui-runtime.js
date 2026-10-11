import {loadState,saveState,escapeHtml} from './store.js?v=26';
import {currentWork} from './work-model.js';
import {extractTechnicalReferenceCandidates,readPdfText} from './reference-pdf-import.js';
import {validateReferenceImport,importReferenceFacts} from './reference-import.js';
import {ocrPageLimit,renderPdfPagesForOcr,ocrRenderedPages,summariseOcrPages} from './reference-ocr.js';

const PDFJS_URL='https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.mjs';
const PDFJS_WORKER='https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.mjs';
const TESSERACT_URL='https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.esm.min.js';

if((location.pathname.split('/').pop()||'')==='suppliers.html')enhancePdfImport();

async function loadPdfJs(){
  const mod=await import(PDFJS_URL);
  if(mod.GlobalWorkerOptions)mod.GlobalWorkerOptions.workerSrc=PDFJS_WORKER;
  return mod;
}
async function loadTesseract(){
  const mod=await import(TESSERACT_URL);
  if(typeof mod.createWorker!=='function')throw new Error('OCR engine unavailable.');
  return mod;
}

async function waitForReferenceCard(timeoutMs=5000){
  const existing=document.querySelector('.ref-intel');
  if(existing)return existing;
  return new Promise(resolve=>{
    const observer=new MutationObserver(()=>{const card=document.querySelector('.ref-intel');if(card){observer.disconnect();resolve(card);}});
    observer.observe(document.documentElement,{childList:true,subtree:true});
    setTimeout(()=>{observer.disconnect();resolve(document.querySelector('.ref-intel'));},timeoutMs);
  });
}

async function enhancePdfImport(){
  const card=await waitForReferenceCard();
  if(!card||card.querySelector('.ref-pdf-import'))return;
  let state=await loadState(),work=currentWork(state),rows=[],report=null,currentFile=null,pdfjsCache=null,ocrPages=[];
  if(!work)return;
  const item=(state.items||[]).find(x=>String(x.id)===String(work.itemId))||{};
  const defaultCalibre=item.watch?.passport?.calibre||item.watch?.movement?.calibre||'';
  const details=document.createElement('details');
  details.className='ref-pdf-import';
  details.innerHTML=`<summary>Technical PDF import</summary><div class="ref-pdf-body"><p class="muted small">Calibre reads selectable PDF text first. If the document is scanned, OCR is an explicit review step before candidate extraction.</p><div class="ref-pdf-meta"><label>Source<select id="pdfSource"><option value="manual">Service manual</option><option value="factory">Factory / manufacturer</option><option value="catalogue">Parts catalogue</option><option value="cousins">Cousins UK document</option><option value="other">Other reference</option></select></label><label>Default calibre<input id="pdfCalibre" value="${escapeHtml(defaultCalibre)}"></label><label>Source URL<input id="pdfUrl" inputmode="url" placeholder="Optional"></label></div><div class="ref-import-actions"><label class="btn secondary filebtn">Choose PDF<input id="pdfFile" type="file" accept="application/pdf,.pdf"></label><button id="pdfAnalyseText" class="btn secondary" type="button">Analyse pasted text</button></div><div id="pdfOcrControls" class="pdf-ocr-controls" hidden><label>OCR pages<input id="pdfOcrPages" type="number" min="1" max="12" value="12"></label><button id="pdfRunOcr" class="btn secondary" type="button">Run OCR</button><span class="muted small">OCR stays local in your browser. Review everything it proposes.</span></div><textarea id="pdfPaste" rows="5" placeholder="Or paste text extracted from a technical sheet here. Separate pages with a line containing --- PAGE ---"></textarea><div id="pdfStatus" class="ref-import-preview muted small">No PDF selected.</div><div id="pdfOcrReview" class="pdf-ocr-review"></div><div id="pdfCandidates"></div><button id="pdfCommit" class="btn" type="button" disabled>Import selected candidates</button></div>`;
  const results=card.querySelector('#refResults');
  card.insertBefore(details,results);
  const $=id=>details.querySelector('#'+id),esc=v=>escapeHtml(String(v??''));

  function sourceName(file){return file?.name||'Pasted technical reference';}
  function sourceMeta(file){return {source:$('pdfSource').value,sourceName:sourceName(file),fileName:sourceName(file),sourceUrl:$('pdfUrl').value.trim(),defaultCalibre:$('pdfCalibre').value.trim()};}
  function makePagesFromPaste(text=''){
    return String(text).split(/\n\s*---\s*PAGE\s*---\s*\n/i).map((part,i)=>({page:i+1,text:part.trim()})).filter(p=>p.text);
  }
  function isMobile(){return matchMedia('(max-width:760px)').matches;}
  function showOcrControls(totalPages){
    const limit=ocrPageLimit({mobile:isMobile(),total:totalPages});
    $('pdfOcrPages').max=String(isMobile()?6:12);$('pdfOcrPages').value=String(limit);
    $('pdfOcrControls').hidden=false;
  }
  function hideOcr(){
    $('pdfOcrControls').hidden=true;$('pdfOcrReview').innerHTML='';ocrPages=[];
  }
  function renderOcrReview(){
    if(!ocrPages.length){$('pdfOcrReview').innerHTML='';return;}
    const summary=summariseOcrPages(ocrPages);
    $('pdfOcrReview').innerHTML=`<div class="ocr-summary"><strong>${summary.usable}/${summary.pages} OCR pages produced text</strong><span>${summary.averageConfidence}% average OCR confidence · ${summary.characters.toLocaleString()} characters</span></div>${ocrPages.map(page=>`<details class="ocr-page"><summary>Page ${page.page} · ${page.confidence}% OCR</summary><pre>${esc(page.text||'No text recognised')}</pre></details>`).join('')}`;
  }
  function renderCandidates(){
    if(!report){$('pdfCandidates').innerHTML='';$('pdfCommit').disabled=true;return;}
    const valid=report.valid||[];
    $('pdfStatus').innerHTML=`<div class="ref-import-stats"><span>${report.total} candidates</span><span>${valid.length} valid</span><span>${report.duplicates.length} duplicates</span><span>${report.rejected.length} rejected</span></div><div class="small muted">Candidates start selected. Review them before import; OCR-derived facts are intentionally low-confidence until you verify them.</div>`;
    $('pdfCandidates').innerHTML=valid.slice(0,120).map(({fact},i)=>`<label class="pdf-candidate"><input type="checkbox" data-pdf-row="${i}" checked><span><strong>${esc(fact.calibre||'Unknown calibre')} · ${esc(fact.partName||fact.partReference||'Reference')}</strong><small>${esc(fact.partReference||'No part number')} · ${esc(fact.sourceRef)} · ${fact.confidence}%</small><em>${esc(fact.notes)}</em></span></label>`).join('')||'<p class="muted small">No importable candidates found.</p>';
    $('pdfCommit').disabled=!valid.length;
  }
  function setRows(candidateRows,{ocr=false}={}){
    rows=ocr?candidateRows.map(row=>({...row,confidence:Math.min(Number(row.confidence)||0,55),notes:`OCR: ${row.notes||''}`})):candidateRows;
    report=validateReferenceImport(rows,state.referenceFacts||[],{confidence:ocr?50:60});renderCandidates();
  }

  $('pdfFile').onchange=async event=>{
    const file=event.target.files?.[0];if(!file)return;
    currentFile=file;report=null;rows=[];hideOcr();$('pdfCandidates').innerHTML='';$('pdfCommit').disabled=true;$('pdfStatus').textContent='Reading PDF…';
    try{
      pdfjsCache=pdfjsCache||await loadPdfJs();
      const pages=await readPdfText(file,{pdfjs:pdfjsCache});
      const textChars=pages.reduce((sum,p)=>sum+String(p.text||'').replace(/\s/g,'').length,0);
      if(textChars<80){
        const data=new Uint8Array(await file.arrayBuffer()),doc=await pdfjsCache.getDocument({data}).promise;
        showOcrControls(doc.numPages);
        $('pdfStatus').textContent=`Scanned/image PDF detected. Select how many of the first ${doc.numPages} pages to OCR, then run OCR. Desktop is capped at 12 pages per pass; mobile at 6.`;
        return;
      }
      setRows(extractTechnicalReferenceCandidates(pages,sourceMeta(file)));
    }catch(error){report=null;rows=[];$('pdfCandidates').innerHTML='';$('pdfCommit').disabled=true;$('pdfStatus').textContent=`Could not analyse PDF: ${error.message}`;}
  };

  $('pdfRunOcr').onclick=async()=>{
    if(!currentFile){$('pdfStatus').textContent='Choose a scanned PDF first.';return;}
    $('pdfRunOcr').disabled=true;$('pdfCommit').disabled=true;$('pdfOcrReview').innerHTML='';
    try{
      pdfjsCache=pdfjsCache||await loadPdfJs();
      const data=new Uint8Array(await currentFile.arrayBuffer()),doc=await pdfjsCache.getDocument({data}).promise;
      const limit=ocrPageLimit({mobile:isMobile(),requested:$('pdfOcrPages').value,total:doc.numPages});
      $('pdfStatus').textContent=`Rendering ${limit} page${limit===1?'':'s'} for OCR…`;
      const rendered=await renderPdfPagesForOcr(currentFile,{pdfjs:pdfjsCache,maxPages:limit,onProgress:p=>{$('pdfStatus').textContent=`Rendering page ${p.page} of ${p.total}…`;}});
      const tess=await loadTesseract();
      ocrPages=await ocrRenderedPages(rendered.pages,{createWorker:tess.createWorker,onProgress:p=>{$('pdfStatus').textContent=`OCR page ${p.index} of ${p.total}…`;}});
      renderOcrReview();
      const usable=ocrPages.filter(p=>String(p.text||'').trim());
      if(!usable.length)throw new Error('OCR did not recognise usable text. Try fewer pages or a clearer scan.');
      setRows(extractTechnicalReferenceCandidates(usable,sourceMeta(currentFile)),{ocr:true});
    }catch(error){report=null;rows=[];$('pdfCandidates').innerHTML='';$('pdfCommit').disabled=true;$('pdfStatus').textContent=`OCR failed: ${error.message}`;}
    finally{$('pdfRunOcr').disabled=false;}
  };

  $('pdfAnalyseText').onclick=()=>{
    const pages=makePagesFromPaste($('pdfPaste').value);
    if(!pages.length){$('pdfStatus').textContent='Paste some technical reference text first.';return;}
    hideOcr();setRows(extractTechnicalReferenceCandidates(pages,sourceMeta(null)));
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

  const style=document.createElement('style');style.textContent=`.ref-pdf-body{margin-top:9px}.ref-pdf-meta{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px}.ref-pdf-meta label:last-child{grid-column:1/-1}.ref-pdf-body textarea{width:100%;margin:8px 0;min-height:110px}.pdf-ocr-controls{display:grid;grid-template-columns:130px auto 1fr;gap:8px;align-items:end;margin:9px 0;padding:9px;border:1px solid var(--line);border-radius:8px;background:var(--surface-2)}.pdf-ocr-controls[hidden]{display:none}.pdf-candidate{display:grid;grid-template-columns:20px 1fr;gap:8px;padding:8px 0;border-top:1px solid var(--line);align-items:start;cursor:pointer}.pdf-candidate input{margin-top:4px}.pdf-candidate span{display:grid;gap:2px}.pdf-candidate small,.pdf-candidate em{font-size:.62rem;color:var(--muted);font-style:normal}.pdf-candidate em{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ocr-summary{display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;padding:8px 0;font-size:.66rem}.ocr-summary span{color:var(--muted)}.ocr-page{border-top:1px solid var(--line);padding:6px 0}.ocr-page summary{font-size:.65rem}.ocr-page pre{white-space:pre-wrap;max-height:180px;overflow:auto;font:500 .62rem/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;background:var(--surface-2);padding:8px;border-radius:6px}@media(max-width:760px){.ref-pdf-meta{grid-template-columns:1fr}.ref-pdf-meta label:last-child{grid-column:auto}.pdf-ocr-controls{grid-template-columns:1fr}.pdf-candidate em{white-space:normal}}`;document.head.appendChild(style);
}
