import {hydrateKnowledgeFromCloud,findMovementSpec,getTechnicalDocuments,getPartReferences} from './knowledge-engine.js?v=3';
import {supabaseClient,session} from './cloud.js?v=5';

const text=v=>String(v??'').trim();
const norm=v=>text(v).toLowerCase().replace(/[\s._/]+/g,'-');
const uniq=rows=>{const seen=new Set();return rows.filter(row=>{const key=[row.kind,row.title,row.source||'',row.reference||''].join('|');if(seen.has(key))return false;seen.add(key);return true;});};

export function benchKnowledgeTriggers(detail={}){
  const work=detail.work||{},passport=detail.passport||{},identity=detail.identity||{},timing=detail.timing||[],needs=detail.partNeeds||[];
  const maker=text(passport.movement_maker||passport.movementMaker||identity.maker),calibre=text(passport.calibre),triggers=[];
  if(calibre)triggers.push({kind:'movement',label:`${maker?maker+' ':''}${calibre}`});
  if(work.blocker||work.diagnosis)triggers.push({kind:'finding',label:text(work.blocker||work.diagnosis)});
  if(needs.length)triggers.push({kind:'parts',label:needs.map(n=>n.part_type||n.description||'part').filter(Boolean).join(', ')});
  const before=timing.find(r=>String(r.phase)==='before_service'),after=timing.find(r=>['after_service','final_test'].includes(String(r.phase)));
  if(before&&after&&Number.isFinite(Number(before.rate_seconds_per_day))&&Number.isFinite(Number(after.rate_seconds_per_day))&&Math.abs(Number(after.rate_seconds_per_day))>Math.abs(Number(before.rate_seconds_per_day))+9)triggers.push({kind:'timing',label:'post-service timing regression'});
  return {maker,calibre,triggers};
}

function movementCard(movement,triggered=false){if(!movement)return null;const specs=[movement.bph&&`${movement.bph} BPH`,movement.jewels!=null&&`${movement.jewels} jewels`,movement.liftAngle!=null&&`${movement.liftAngle}° lift`,movement.powerReserve!=null&&`${movement.powerReserve} h reserve`].filter(Boolean).join(' · ');return {kind:'movement',level:'Verified movement',title:`${movement.maker} ${movement.calibre}`,detail:[specs,movement.notes].filter(Boolean).join(' — '),source:movement.source||'',relation:triggered?'Relevant movement reference; not a diagnosis.':'Exact movement Knowledge match.'};}
function documentCard(doc,trigger=''){return {kind:'document',level:'Documented source',title:doc.title||`${doc.maker||''} technical document`,detail:[doc.provider,doc.type,doc.notes].filter(Boolean).join(' · '),source:doc.url||'',relation:trigger?`Surfaced because of ${trigger}; source relevance does not prove cause.`:'Exact calibre document.'};}
function partCard(part,need=''){return {kind:'part',level:part.exact?'Confirmed reference':'Knowledge reference',title:`${part.partType||need||'Part'} · ${part.reference||'reference'}`,detail:part.notes||`Reference recorded for ${part.maker||''} ${part.calibre||''}`.trim(),source:part.source||'',reference:part.reference||'',relation:need?`Matches current Part Need: ${need}`:'Calibre part reference.'};}

async function cloudPartRows(ctx,needs=[]){
  if(!needs.length||!ctx.calibre)return [];
  try{const s=await session();if(!s?.user||s.localOnly)return [];const rows=[];for(const need of needs.slice(0,3)){const partType=text(need.part_type||need.description);const {data,error}=await supabaseClient().rpc('calibre_find_part_intelligence',{p_calibre_id:null,p_maker:ctx.maker||null,p_calibre:ctx.calibre||null,p_serial:null,p_part_type:partType||null,p_limit:12});if(error)continue;for(const row of data||[]){if(!row.part_reference)continue;rows.push({kind:'part',level:Number(row.evidence_rank)>=90?'Documented part evidence':Number(row.evidence_rank)>=70?'Strong part evidence':'Candidate part evidence',title:`${row.part_type||partType||'Part'} · ${row.part_reference}`,detail:[row.status,row.notes,row.candidate_calibre&&`Candidate ${row.candidate_maker||''} ${row.candidate_calibre}`].filter(Boolean).join(' · '),source:row.source_url||'',reference:row.part_reference,relation:`Matched current Part Need: ${partType||'part'}.`,score:Number(row.evidence_rank)||0});}}
    return rows.sort((a,b)=>(b.score||0)-(a.score||0));
  }catch{return [];}
}

export async function loadBenchKnowledgeSuggestions(detail={}){
  const ctx=benchKnowledgeTriggers(detail);if(!ctx.calibre)return {context:ctx,rows:[],message:'Record a movement calibre to unlock sourced Knowledge suggestions.'};
  try{await hydrateKnowledgeFromCloud();}catch{}
  const movement=findMovementSpec(ctx.maker,ctx.calibre),docs=getTechnicalDocuments(ctx.maker,ctx.calibre),parts=getPartReferences(ctx.maker,ctx.calibre),rows=[];
  const contextualTrigger=ctx.triggers.find(t=>['finding','timing'].includes(t.kind));const mcard=movementCard(movement,!!contextualTrigger);if(mcard)rows.push(mcard);
  for(const doc of docs.slice(0,4))rows.push(documentCard(doc,contextualTrigger?.label||''));
  for(const need of (detail.partNeeds||[]).slice(0,3)){const needle=norm(need.part_type||need.description),matches=parts.filter(p=>!needle||norm(p.partType).includes(needle)||needle.includes(norm(p.partType)));for(const p of matches.slice(0,3))rows.push(partCard(p,need.part_type||need.description||''));}
  rows.push(...await cloudPartRows(ctx,detail.partNeeds||[]));
  return {context:ctx,rows:uniq(rows).slice(0,8),message:rows.length?'':'No sourced Knowledge record matched the current bench context.'};
}
