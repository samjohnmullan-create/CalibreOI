import {normaliseReferenceFact} from './reference-intelligence.js';

const fields=['documentId','source','sourceName','sourceUrl','sourceRef','relation','calibre','relatedCalibre','partName','partReference','confidence','notes'];
const sourceSet=new Set(['factory','ranfft','cousins','catalogue','manual','other']);
const relationSet=new Set(['fits','equivalent','donor','family','dimension','note']);
const cleanKey=v=>String(v??'').trim();
const signature=f=>[f.source,f.relation,f.calibre,f.relatedCalibre,f.partName,f.partReference,f.sourceRef].map(v=>cleanKey(v).toLowerCase()).join('|');

function parseCsvLine(line){
  const out=[];let cur='',quoted=false;
  for(let i=0;i<line.length;i++){
    const ch=line[i];
    if(ch==='"'){
      if(quoted&&line[i+1]==='"'){cur+='"';i++;}
      else quoted=!quoted;
    }else if(ch===','&&!quoted){out.push(cur);cur='';}
    else cur+=ch;
  }
  out.push(cur);return out;
}

export function parseReferenceCsv(text=''){
  const lines=String(text).replace(/^\uFEFF/,'').split(/\r?\n/).filter(line=>line.trim());
  if(!lines.length)return [];
  const headers=parseCsvLine(lines[0]).map(h=>h.trim());
  return lines.slice(1).map(line=>{
    const cells=parseCsvLine(line),row={};
    headers.forEach((h,i)=>row[h]=cells[i]??'');
    return row;
  });
}

export function parseReferenceJson(text=''){
  const parsed=JSON.parse(String(text));
  if(Array.isArray(parsed))return parsed;
  if(Array.isArray(parsed?.referenceFacts))return parsed.referenceFacts;
  if(Array.isArray(parsed?.rows))return parsed.rows;
  throw new Error('JSON must be an array, or contain referenceFacts/rows.');
}

export function normaliseImportRow(raw={},defaults={}){
  const row={};
  for(const key of fields)row[key]=raw[key]??defaults[key]??'';
  row.source=sourceSet.has(String(row.source).toLowerCase())?String(row.source).toLowerCase():(defaults.source||'other');
  row.relation=relationSet.has(String(row.relation).toLowerCase())?String(row.relation).toLowerCase():(defaults.relation||'note');
  row.confidence=row.confidence===''?(defaults.confidence??70):row.confidence;
  return normaliseReferenceFact(row);
}

export function validateReferenceImport(rows=[],existing=[],defaults={}){
  const existingKeys=new Set(existing.map(signature));
  const seen=new Set();
  const valid=[],duplicates=[],rejected=[];
  rows.forEach((raw,index)=>{
    let fact;
    try{fact=normaliseImportRow(raw,defaults);}catch(error){rejected.push({index,raw,reason:error.message});return;}
    const meaningful=!!(cleanKey(fact.calibre)||cleanKey(fact.relatedCalibre)||cleanKey(fact.partName)||cleanKey(fact.partReference));
    if(!meaningful){rejected.push({index,raw,reason:'No calibre or part information.'});return;}
    const key=signature(fact);
    if(existingKeys.has(key)||seen.has(key)){duplicates.push({index,fact});return;}
    seen.add(key);valid.push({index,fact});
  });
  return {total:rows.length,valid,duplicates,rejected};
}

export function importReferenceFacts(state={},report={}){
  state.referenceFacts=Array.isArray(state.referenceFacts)?state.referenceFacts:[];
  const facts=(report.valid||[]).map(x=>x.fact);
  state.referenceFacts.unshift(...facts);
  return {imported:facts.length,duplicates:(report.duplicates||[]).length,rejected:(report.rejected||[]).length};
}

export function referenceCsvTemplate(){return 'documentId,source,sourceName,sourceUrl,sourceRef,relation,calibre,relatedCalibre,partName,partReference,confidence,notes\n,factory,,,,fits,AS 1130,,Balance staff,1234,95,Factory parts sheet\n';}
