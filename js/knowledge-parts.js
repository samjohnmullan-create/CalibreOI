import {session,supabaseClient} from './cloud.js?v=4';

const text=v=>String(v??'').trim();
const norm=v=>text(v).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'');
const serialNumber=v=>{const n=Number(String(v??'').replace(/[^0-9]/g,''));return Number.isSafeInteger(n)&&n>0?n:null;};
function itemFor(work,state={}){return (state.items||[]).find(item=>String(item.id)===String(work?.itemId))||null;}
function movementContext(work,state={}){
 const item=itemFor(work,state),watch=item?.watch||{},p=watch.passport||{},m=watch.movement||{},id=item?.identity||{},candidate=p.knowledgeCandidate||{};
 return {item,knowledgeId:Number(m.knowledgeId||candidate.knowledgeId)||null,maker:text(m.maker||p.movementMaker||p.maker||id.maker),calibre:text(m.calibre||p.calibre),serial:serialNumber(p.serial||id.serial)};
}
export async function queryKnowledgePartIntelligence(work,state={},requirement={},limit=80){
 const ctx=movementContext(work,state),partType=text(requirement?.name||requirement?.part||requirement?.partName||'');
 if(!work||(!ctx.knowledgeId&&!ctx.calibre))return {source:'none',rows:[],context:ctx,error:'Movement identity is not set.'};
 try{
   const s=await session();if(!s?.user||s.localOnly)return {source:'offline',rows:[],context:ctx,error:'Sign in to search the full Knowledge database.'};
   const sb=supabaseClient();const {data,error}=await sb.rpc('calibre_find_part_intelligence',{p_calibre_id:ctx.knowledgeId,p_maker:ctx.maker||null,p_calibre:ctx.calibre||null,p_serial:ctx.serial,p_part_type:partType||null,p_limit:Math.max(1,Math.min(Number(limit)||80,150))});
   if(error)throw error;
   return {source:'supabase',rows:Array.isArray(data)?data:[],context:ctx,error:''};
 }catch(error){return {source:'error',rows:[],context:ctx,error:error?.message||String(error)};}
}
function candidateMatchesDonor(row,donor={}){
 const p=donor.passport||{},knowledgeId=Number(donor.knowledgeId||p.knowledgeId)||null;
 if(row.candidate_calibre_id&&knowledgeId&&Number(row.candidate_calibre_id)===knowledgeId)return true;
 const maker=norm(p.movementMaker||p.maker||donor.maker),calibre=norm(p.calibre||donor.calibre);
 return !!(row.candidate_calibre&&calibre&&norm(row.candidate_calibre)===calibre&&(!row.candidate_maker||!maker||norm(row.candidate_maker)===maker));
}
function stockRefs(part={}){return new Set([part.reference,part.partNumber,part.factoryReference,part.materialRef].map(norm).filter(Boolean));}
function best(rows=[]){return rows.slice().sort((a,b)=>(Number(b.evidence_rank)||0)-(Number(a.evidence_rank)||0)||(Number(b.confidence)||0)-(Number(a.confidence)||0))[0]||null;}
function level(score){if(score>=95)return 'Documented';if(score>=75)return 'Strong';if(score>=45)return 'Candidate';return 'Lead only';}
export function enrichLocalPartMatches(summary={inventory:[],donors:[],history:[]},kbRows=[],requirement={}){
 const referenceRows=kbRows.filter(r=>r?.part_reference),donorRows=kbRows.filter(r=>r?.candidate_calibre||r?.candidate_calibre_id);
 const inventory=(summary.inventory||[]).map(row=>{const refs=stockRefs(row.part||{}),evidence=best(referenceRows.filter(r=>refs.has(norm(r.part_reference))));if(!evidence)return row;const score=Math.max(Number(row.score)||0,Math.min(100,Number(evidence.evidence_rank)||0));return {...row,score,level:level(score),knowledgeEvidence:evidence,why:[`${evidence.status||'Knowledge'}: ${evidence.part_type||requirement?.name||'part'} ${evidence.part_reference}.`,...(row.why||[])]};});
 const donors=(summary.donors||[]).map(row=>{const donor=row.donor||{},evidence=best(donorRows.filter(r=>candidateMatchesDonor(r,donor)));if(!evidence)return row;const score=Math.max(Number(row.score)||0,Math.min(100,Number(evidence.evidence_rank)||0));return {...row,score,level:evidence.family_only?'Lead only':level(score),knowledgeEvidence:evidence,why:[evidence.family_only?'Knowledge: same family only — not proof of part fit.':`Knowledge: ${evidence.status||evidence.evidence_type}${evidence.part_reference?` · ref ${evidence.part_reference}`:''}.`,...(row.why||[])]};});
 inventory.sort((a,b)=>b.score-a.score);donors.sort((a,b)=>b.score-a.score);
 return {...summary,inventory,donors,knowledgeRows:kbRows,requirement};
}
export function knowledgeEvidenceGroups(rows=[]){
 return {factory:rows.filter(r=>['serial_application','exact_part_reference'].includes(r.evidence_type)),interchange:rows.filter(r=>['factory_interchange','documented_compatibility'].includes(r.evidence_type)),dimensional:rows.filter(r=>r.evidence_type==='dimensional_candidate'),family:rows.filter(r=>r.family_only)};
}
