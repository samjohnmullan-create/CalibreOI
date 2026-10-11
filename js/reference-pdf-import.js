const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
const calibreRe=/\b(?:AS|ETA|FHF|FE|PUW|UNITAS|Peseux|Lemania|Valjoux|Venus|Landeron|ESA|A Schild|A\.S\.|Felsa|Certina|Omega|Rolex|Tudor|Longines|Seiko|Citizen)?\s*\d{2,4}(?:[-./]\d{1,3})?[A-Z]?\b/ig;
const partNoRe=/\b(?:[A-Z]{0,3}[-/]?)?\d{2,6}(?:[-/.][A-Z0-9]{1,5})?\b/i;
const partWords=['balance staff','balance complete','balance wheel','mainspring','barrel arbor','barrel complete','escape wheel','pallet fork','pallet','centre wheel','center wheel','third wheel','fourth wheel','cannon pinion','hour wheel','minute wheel','setting wheel','winding pinion','sliding pinion','stem','click','ratchet wheel','crown wheel','jewel','shock spring','incabloc','cap jewel','train wheel','bridge','cock','screw'];

function unique(arr=[]){return [...new Set(arr.map(clean).filter(Boolean))];}
function linePartName(line=''){
  const lower=line.toLowerCase();
  const hit=partWords.find(word=>lower.includes(word));
  if(hit)return hit.replace(/\b\w/g,m=>m.toUpperCase());
  return '';
}
function linePartReference(line=''){
  const matches=line.match(new RegExp(partNoRe.source,'ig'))||[];
  return matches.map(clean).find(v=>/\d/.test(v))||'';
}
function calibreCandidates(text=''){
  const raw=text.match(calibreRe)||[];
  return unique(raw).filter(v=>{const digits=v.replace(/\D/g,'');return digits.length>=2&&digits.length<=7;});
}

export function extractTechnicalReferenceCandidates(pages=[],meta={}){
  const candidates=[];
  let activeCalibre=clean(meta.defaultCalibre||'');
  for(const page of pages){
    const pageNo=Number(page.page)||1;
    const lines=String(page.text||'').split(/\r?\n/).map(clean).filter(Boolean);
    const pageCals=calibreCandidates(lines.slice(0,12).join(' '));
    if(pageCals.length)activeCalibre=pageCals[0];
    for(const line of lines){
      const lineCals=calibreCandidates(line);
      if(lineCals.length===1&&line.length<80&&!linePartName(line)){activeCalibre=lineCals[0];continue;}
      const partName=linePartName(line);
      const partReference=linePartReference(line);
      if(!partName&&!partReference)continue;
      const calibre=lineCals[0]||activeCalibre||clean(meta.defaultCalibre||'');
      if(!calibre&&!partName)continue;
      const relation=partName||partReference?'fits':'note';
      const confidence=partName&&partReference&&calibre?68:partName&&calibre?58:48;
      candidates.push({
        source:clean(meta.source||'manual')||'manual',
        sourceName:clean(meta.sourceName||meta.fileName||''),
        sourceUrl:clean(meta.sourceUrl||''),
        sourceRef:`${clean(meta.fileName||meta.sourceName||'Technical PDF')} · p. ${pageNo}`,
        relation,
        calibre,
        relatedCalibre:'',
        partName,
        partReference,
        confidence,
        notes:line
      });
    }
  }
  const seen=new Set();
  return candidates.filter(row=>{
    const key=[row.calibre,row.partName,row.partReference,row.sourceRef].map(v=>String(v).toLowerCase()).join('|');
    if(seen.has(key))return false;seen.add(key);return true;
  });
}

export async function readPdfText(file,{pdfjs}={}){
  if(!file)throw new Error('Choose a PDF first.');
  if(!pdfjs?.getDocument)throw new Error('PDF reader unavailable.');
  const data=new Uint8Array(await file.arrayBuffer());
  const doc=await pdfjs.getDocument({data}).promise;
  const pages=[];
  for(let pageNo=1;pageNo<=doc.numPages;pageNo++){
    const page=await doc.getPage(pageNo),content=await page.getTextContent();
    let text='',lastY=null;
    for(const item of content.items||[]){
      const y=item.transform?.[5];
      if(lastY!==null&&y!==undefined&&Math.abs(y-lastY)>4)text+='\n';
      text+=`${item.str||''} `;lastY=y;
    }
    pages.push({page:pageNo,text:text.trim()});
  }
  return pages;
}
