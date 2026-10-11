const now=()=>new Date().toISOString();
const id=()=>`ref-${Date.now().toString(36)}${Math.random().toString(36).slice(2,7)}`;
const fold=v=>String(v||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'');
const sameCalibre=(a,b)=>!!(a&&b&&(a===b||((a.length>=3&&b.length>=3)&&(a.endsWith(b)||b.endsWith(a)))));
export const REFERENCE_SOURCES=[
  ['factory','Factory / manufacturer'],
  ['ranfft','Ranfft DB'],
  ['cousins','Cousins UK document'],
  ['catalogue','Parts catalogue'],
  ['manual','Service manual'],
  ['other','Other reference']
];
export const REFERENCE_RELATIONS=[
  ['fits','Part fits calibre'],
  ['equivalent','Factory equivalent part'],
  ['donor','Donor / shared part source'],
  ['family','Related calibre / family'],
  ['dimension','Dimension match'],
  ['note','Reference note']
];
export function normaliseReferenceFact(raw={}){
  return {
    id:String(raw.id||id()),
    documentId:String(raw.documentId||''),
    source:String(raw.source||'other'),
    sourceName:String(raw.sourceName||''),
    sourceUrl:String(raw.sourceUrl||''),
    sourceRef:String(raw.sourceRef||''),
    relation:String(raw.relation||'note'),
    calibre:String(raw.calibre||''),
    relatedCalibre:String(raw.relatedCalibre||''),
    partName:String(raw.partName||''),
    partReference:String(raw.partReference||''),
    confidence:Math.max(0,Math.min(100,Number(raw.confidence)||0)),
    notes:String(raw.notes||''),
    createdAt:raw.createdAt||now(),
    updatedAt:raw.updatedAt||now()
  };
}
export function referenceFacts(state={}){return (Array.isArray(state.referenceFacts)?state.referenceFacts:[]).map(normaliseReferenceFact);}
export function addReferenceFact(state={},raw={}){
  state.referenceFacts=Array.isArray(state.referenceFacts)?state.referenceFacts:[];
  const fact=normaliseReferenceFact(raw);
  state.referenceFacts.unshift(fact);
  return fact;
}
function workContext(work,state={}){
  const item=(state.items||[]).find(x=>String(x.id)===String(work?.itemId))||{},watch=item.watch||{},passport=watch.passport||{},movement=watch.movement||{};
  return {calibre:String(passport.calibre||movement.calibre||''),maker:String(passport.movementMaker||movement.maker||item.identity?.maker||''),text:[work?.title,work?.diagnosis,work?.notes,...((work?.partIds||[]).map(partId=>(state.inventory?.parts||[]).find(p=>String(p.id)===String(partId))?.name||''))].filter(Boolean).join(' ').toLowerCase()};
}
function sourceWeight(source){return source==='factory'?30:source==='manual'||source==='catalogue'?26:source==='ranfft'?22:source==='cousins'?20:12;}
export function relevantReferenceFacts(work,state={}){
  if(!work)return [];
  const ctx=workContext(work,state),needCal=fold(ctx.calibre);
  return referenceFacts(state).map(fact=>{
    let score=0;const why=[];const cal=fold(fact.calibre),related=fold(fact.relatedCalibre);
    if(needCal&&cal&&sameCalibre(cal,needCal)){score+=45;why.push('Matches this calibre.');}
    else if(needCal&&related&&sameCalibre(related,needCal)){score+=38;why.push('This calibre is the referenced related/donor calibre.');}
    else if(needCal&&((cal&&(cal.includes(needCal)||needCal.includes(cal)))||(related&&(related.includes(needCal)||needCal.includes(related))))){score+=22;why.push('Calibre family/text overlaps.');}
    const partText=[fact.partName,fact.partReference,fact.notes].join(' ').toLowerCase();
    if(partText&&ctx.text){const tokens=partText.split(/\W+/).filter(x=>x.length>3);if(tokens.some(t=>ctx.text.includes(t))){score+=15;why.push('Part wording overlaps the current Work.');}}
    score+=sourceWeight(fact.source);
    score+=Math.round((Number(fact.confidence)||0)*0.1);
    return {fact,score:Math.min(100,score),why};
  }).filter(row=>row.score>=20).sort((a,b)=>b.score-a.score||String(b.fact.updatedAt).localeCompare(String(a.fact.updatedAt)));
}
