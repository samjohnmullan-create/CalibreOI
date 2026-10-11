const clean=v=>String(v??'').replace(/\s+/g,' ').trim();

export function ocrPageLimit({mobile=false,requested,total}={}){
  const hard=mobile?6:12;
  const req=Math.max(1,Math.floor(Number(requested)||hard));
  const available=Math.max(1,Math.floor(Number(total)||hard));
  return Math.min(hard,req,available);
}

export function ocrConfidence(value){
  const n=Number(value);
  if(!Number.isFinite(n))return 0;
  return Math.max(0,Math.min(100,Math.round(n)));
}

export async function renderPdfPagesForOcr(file,{pdfjs,maxPages=12,scale=1.8,onProgress}={}){
  if(!file)throw new Error('Choose a PDF first.');
  if(!pdfjs?.getDocument)throw new Error('PDF reader unavailable.');
  const data=new Uint8Array(await file.arrayBuffer());
  const doc=await pdfjs.getDocument({data}).promise;
  const limit=Math.min(doc.numPages,Math.max(1,Math.floor(Number(maxPages)||12)));
  const pages=[];
  for(let pageNo=1;pageNo<=limit;pageNo++){
    const page=await doc.getPage(pageNo),viewport=page.getViewport({scale});
    const canvas=document.createElement('canvas');
    canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);
    const ctx=canvas.getContext('2d',{alpha:false});
    if(!ctx)throw new Error('Canvas unavailable for OCR.');
    await page.render({canvasContext:ctx,viewport}).promise;
    pages.push({page:pageNo,canvas});
    onProgress?.({phase:'render',page:pageNo,total:limit});
  }
  return {pages,totalPages:doc.numPages,rendered:limit};
}

export async function ocrRenderedPages(rendered=[],{createWorker,onProgress}={}){
  if(typeof createWorker!=='function')throw new Error('OCR engine unavailable.');
  const worker=await createWorker('eng');
  const pages=[];
  try{
    for(let i=0;i<rendered.length;i++){
      const row=rendered[i];
      onProgress?.({phase:'ocr',page:row.page,index:i+1,total:rendered.length});
      const result=await worker.recognize(row.canvas);
      const data=result?.data||{};
      pages.push({page:row.page,text:clean(data.text||''),confidence:ocrConfidence(data.confidence)});
    }
  }finally{
    await worker.terminate?.();
  }
  return pages;
}

export function summariseOcrPages(pages=[]){
  const usable=pages.filter(p=>clean(p.text));
  const average=usable.length?Math.round(usable.reduce((sum,p)=>sum+ocrConfidence(p.confidence),0)/usable.length):0;
  return {pages:pages.length,usable:usable.length,averageConfidence:average,characters:usable.reduce((sum,p)=>sum+clean(p.text).length,0)};
}
