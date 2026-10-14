import {inventoryMatches,donorMatches,recordFitEvidence,fitHistory} from './parts-intelligence.js';

function donorSources(state={}){
  return (state.items||[]).filter(item=>item&&item.purpose==='donor'&&item.status!=='Archived').map(item=>{
    const watch=item.watch||{},passport=watch.passport||{},movement=watch.movement||{},candidate=passport.knowledgeCandidate||{};
    return {
      id:String(item.id),
      title:item.title||'Donor Item',
      knowledgeId:Number(movement.knowledgeId||candidate.knowledgeId)||null,
      maker:movement.maker||passport.movementMaker||passport.maker||item.identity?.maker||'',
      calibre:movement.calibre||passport.calibre||'',
      passport:{
        ...passport,
        maker:passport.maker||item.identity?.maker||'',
        model:passport.model||item.identity?.model||'',
        calibre:passport.calibre||movement.calibre||'',
        calibreFamily:passport.calibreFamily||movement.calibreFamily||'',
        movementMm:passport.movementMm||movement.movementMm||'',
        movementMaker:passport.movementMaker||movement.maker||item.identity?.maker||'',
        knowledgeId:Number(movement.knowledgeId||candidate.knowledgeId)||null
      },
      sparesParts:Array.isArray(watch.sparesParts)?watch.sparesParts:[],
      fitsNote:watch.fitsNote||'',
      storageLocation:watch.storageLocation||'',
      sourceType:'donorItem'
    };
  });
}

export function canonicalPartInventory(state={}){
  return Array.isArray(state?.inventory?.parts)?state.inventory.parts:[];
}

export function partMatchSummary(work,state={}){
  if(!work)return {inventory:[],donors:[],history:[]};
  const stock=canonicalPartInventory(state).filter(part=>!part.workId&&!['used','fitted'].includes(part.status)&&Number(part.quantity)!==0);
  return {
    inventory:inventoryMatches(work,stock,state),
    donors:donorMatches(work,donorSources(state),state),
    history:fitHistory(state,work)
  };
}

export function recordPartMatchEvidence(state,work,source,{result,note=''}){
  if(!source)throw new Error('Choose a source first.');
  return recordFitEvidence(state,work,{
    sourceType:source.sourceType,
    sourceId:source.sourceId,
    partId:source.partId||'',
    partName:source.partName||'',
    result,
    note
  });
}
