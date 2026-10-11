import {contextualKnowledge,movementIdentityForItem} from './knowledge-engine.js?v=2';

const text=v=>String(v??'').trim();
const doneStage=stage=>!!(stage?.complete||stage?.completedAt);
const isWatch=item=>['watch','clock'].includes(String(item?.type||'').toLowerCase())||!!item?.watch;
const needsPartsLanguage=value=>/part|staff|stem|spring|wheel|jewel|crystal|crown|hand|donor|source|order|await/i.test(text(value));

function itemFor(work,state){return (state.items||[]).find(item=>String(item.id)===String(work?.itemId))||null;}
function route(path,work,item){const w=work?.id?`work=${encodeURIComponent(work.id)}`:'',i=item?.id?`item=${encodeURIComponent(item.id)}`:'';const join=[w,i].filter(Boolean).join('&');return join?`${path}?${join}`:path;}
function suggestion(id,title,why,{priority=50,confidence='context',href='',type='action'}={}){return {id,title,why,priority,confidence,href,type};}

export function workbenchSuggestions(work={},state={},limit=3){
  const item=itemFor(work,state);if(!item)return [];
  const rows=[],watch=isWatch(item),status=text(work.status),blocker=text(work.blocker),next=text(work.nextAction),stages=Array.isArray(work.stages)?work.stages:[],completed=stages.filter(doneStage).length,progress=stages.length?completed/stages.length:0,k=contextualKnowledge(item,state),{calibre}=movementIdentityForItem(item);

  if(blocker){
    rows.push(suggestion('blocker',`Resolve blocker: ${blocker}`,next?`The Work record says the next action is “${next}”. Clear the blocker before the queue stalls.`:'This Work has an explicit blocker and should not silently sit in the queue.',{priority:100,confidence:'recorded',href:route('work.html',work,item),type:'blocker'}));
  }

  if(watch&&!text(calibre)){
    rows.push(suggestion('identify-movement','Identify the movement','Calibre cannot safely apply timing defaults, part references or technical documents until the movement is identified.',{priority:94,confidence:'high',href:route('movement-finder.html',work,item),type:'identity'}));
  }

  const partsRelevant=needsPartsLanguage(blocker)||needsPartsLanguage(next)||status==='Waiting'||(Array.isArray(work.partIds)&&work.partIds.length>0);
  if(partsRelevant&&k.parts.length){
    const exact=k.parts.filter(p=>p.exact),source=exact.length?exact:k.parts,first=source[0];
    rows.push(suggestion('parts-reference',exact.length?'Check exact documented part references':'Check calibre-family part references',`${source.length} sourced reference${source.length===1?'':'s'} available${first?.reference?`; first: ${first.partType?.replaceAll('_',' ')} ${first.reference}`:''}. ${exact.length?'Documented references are candidates until bench fit is verified.':'Family references require measurement/physical verification.'}`,{priority:90,confidence:exact.length?'documented':'family',href:route('suppliers.html',work,item),type:'parts'}));
  } else if(partsRelevant){
    rows.push(suggestion('parts-search','Search owned stock and donors','This Work appears to be waiting on a part, but the Knowledge pack has no linked reference. Search owned stock/donors and record the fit result.',{priority:86,confidence:'context',href:route('suppliers.html',work,item),type:'parts'}));
  }

  if(k.documents.length){
    const doc=k.documents[0],title=doc.title||doc.fileName||'technical reference';
    rows.push(suggestion('technical-document','Open relevant technical reference',`${title}${k.documents.length>1?` plus ${k.documents.length-1} more linked document${k.documents.length===2?'':'s'}`:''}. Use source material before guessing disassembly, parts or specifications.`,{priority:partsRelevant?82:72,confidence:'sourced',href:route('suppliers.html',work,item),type:'reference'}));
  }

  const timingRuns=Array.isArray(work.timingRuns)?work.timingRuns:[];
  if(watch&&calibre&&!timingRuns.length&&!['Complete','Cancelled'].includes(status)){
    rows.push(suggestion('baseline-timing','Record a baseline timing run',`No saved timing run is attached to this Work.${k.movement?.bph?` Knowledge expects ${k.movement.bph} BPH.`:''} A baseline gives you evidence to compare after service/regulation.`,{priority:progress<.75?70:78,confidence:k.movement?'movement-aware':'context',href:route('timegrapher.html',work,item),type:'timing'}));
  }

  if(stages.length&&progress>=.75&&!['Complete','Cancelled'].includes(status)){
    const qc=work.finalQC&&typeof work.finalQC==='object'?work.finalQC:{},hasQc=Object.values(qc).some(v=>v===true||text(v));
    if(!hasQc)rows.push(suggestion('final-qc','Prepare final QC',`${completed} of ${stages.length} stages are complete. Before marking Work complete, confirm function, timing, presentation and outstanding faults.`,{priority:88,confidence:'workflow',href:route('work.html',work,item),type:'qc'}));
  }

  if(!blocker&&next){rows.push(suggestion('next-action',next,'This is the explicit next action recorded on the Work. Calibre is keeping it visible so it does not get buried by supporting suggestions.',{priority:68,confidence:'recorded',href:route('work.html',work,item),type:'next'}));}

  const unique=[...new Map(rows.map(row=>[row.id,row])).values()];
  return unique.sort((a,b)=>b.priority-a.priority).slice(0,Math.max(0,limit));
}

export function workbenchSuggestionMap(state={},limitPerWork=2){
  const out=new Map();for(const work of Array.isArray(state.work)?state.work:[]){const rows=workbenchSuggestions(work,state,limitPerWork);if(rows.length)out.set(String(work.id),rows);}return out;
}
