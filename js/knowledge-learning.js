export function knowledgeDraftUrl({kind='calibre',action='create',targetId='',confidence='supported',title='',notes='',payload={}}={}){
  const params=new URLSearchParams();
  params.set('draft','1');
  params.set('kind',kind);
  params.set('action',action);
  if(targetId!==''&&targetId!=null)params.set('targetId',String(targetId));
  params.set('confidence',confidence);
  if(title)params.set('title',String(title));
  if(notes)params.set('notes',String(notes));
  for(const [key,value] of Object.entries(payload||{})){
    if(value==null||value==='')continue;
    params.set(`field.${key}`,Array.isArray(value)?value.join(', '):String(value));
  }
  return `knowledge-admin.html?${params.toString()}`;
}

function num(v){const n=Number(String(v??'').replace(',','.'));return Number.isFinite(n)?n:'';}

export function movementKnowledgeDraft(item={}){
  const identity=item.identity||{},watch=item.watch||{},passport=watch.passport||item.passport||{},movement=watch.movement||{};
  const maker=passport.movementMaker||movement.maker||passport.maker||identity.maker||'';
  const calibre=passport.calibre||movement.calibre||'';
  const knowledgeId=movement.knowledgeId||passport.knowledgeId||item.knowledgeCandidate?.knowledgeId||'';
  const fieldConfidence=passport.fieldConfidence||{};
  const confirmed=fieldConfidence.calibre==='Confirmed'||movement.confirmed===true;
  const payload={maker,calibre,winding:passport.winding||movement.winding||'',diameter_mm:num(passport.movementMm||movement.movementMm),height_mm:num(passport.movementHeightMm||movement.heightMm),beat_rate_bph:num(passport.beatRate||movement.beatRate),layout:passport.movementType||movement.layout||'',notes:passport.notes||''};
  return {kind:'calibre',action:knowledgeId?'update':'create',targetId:knowledgeId,confidence:confirmed?'confirmed':'supported',title:`${knowledgeId?'Bench update':'Bench movement'} · ${[maker,calibre].filter(Boolean).join(' ')||'unidentified movement'}`,notes:`Prefilled from the Item Passport. Review every field before applying to shared Knowledge.${confirmed?' Calibre identity is marked Confirmed in Passport.':''}`,payload};
}

export function workKnowledgeDraft(work={},item={}){
  const identity=item.identity||{},watch=item.watch||{},passport=watch.passport||{},movement=watch.movement||{};
  const maker=passport.movementMaker||movement.maker||passport.maker||identity.maker||'';
  const calibre=passport.calibre||movement.calibre||'';
  const stage=Array.isArray(work.stages)?work.stages[work.stageIndex||0]:null;
  const detail=[work.diagnosis,work.repairPerformed,work.outcome,stage?.measure,stage?.notes].filter(Boolean).join('\n');
  return {kind:'calibre',action:movement.knowledgeId?'update':'create',targetId:movement.knowledgeId||'',confidence:'supported',title:`Bench finding · ${[maker,calibre].filter(Boolean).join(' ')||item.title||work.title||'work item'}`,notes:`Workshop observation from Work ${work.id||''}.\n${detail}`.trim(),payload:{maker,calibre}};
}

export function fitKnowledgeDraft(evidence={},state={}){
  const targetItem=(state.items||[]).find(x=>String(x.id)===String(evidence.targetItemId))||{};
  const movement=targetItem.watch?.movement||{},passport=targetItem.watch?.passport||{};
  const targetKnowledgeId=movement.knowledgeId||'';
  if(evidence.sourceType==='donorItem'){
    const donor=(state.items||[]).find(x=>String(x.id)===String(evidence.sourceId))||{};
    const donorMovement=donor.watch?.movement||{};
    const donorKnowledgeId=donorMovement.knowledgeId||'';
    return {kind:'compatibility',action:'create',confidence:evidence.result==='used'?'confirmed':'supported',title:`Bench ${evidence.result==='used'?'used':'verified'} donor fit · ${evidence.targetCalibre||passport.calibre||'target'}`,notes:`Bench evidence ${evidence.result}: donor Item ${donor.title||evidence.sourceId} for ${evidence.targetTitle||'target Item'}.${evidence.note?` ${evidence.note}`:''} Review scope and IDs before applying.`,payload:{calibre_a_id:targetKnowledgeId,calibre_b_id:donorKnowledgeId,scope:evidence.partName||'bench fit',status:evidence.result==='used'?'bench_verified_used':'bench_verified',confidence:evidence.result==='used'?'1':'0.95',modification_required:false}};
  }
  const stock=(state.inventory?.parts||[]).find(x=>String(x.id)===String(evidence.sourceId))||{};
  return {kind:'part_link',action:'create',confidence:evidence.result==='used'?'confirmed':'supported',title:`Bench ${evidence.result==='used'?'used':'verified'} part · ${stock.name||stock.reference||evidence.partName||'part'}`,notes:`Bench evidence ${evidence.result}: ${stock.name||evidence.partName||'loose part'} fitted ${evidence.targetTitle||'target Item'}.${stock.reference?` Stock reference: ${stock.reference}.`:''}${evidence.note?` ${evidence.note}`:''} Select/create the canonical Part ID before applying.`,payload:{calibre_id:targetKnowledgeId,confidence:evidence.result==='used'?'bench_verified_used':'bench_verified',notes:evidence.note||''}};
}
