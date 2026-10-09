function fold(s){return String(s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9.]+/g," ").trim();}
function compact(s){return fold(s).replace(/\s/g,"");}
function words(s){return new Set(fold(s).split(/\s+/).filter(x=>x.length>1));}
function overlap(a,b){const A=words(a),B=words(b);if(!A.size||!B.size)return 0;let n=0;for(const x of A)if(B.has(x))n++;return n/Math.max(A.size,B.size);}
function num(v){const n=parseFloat(String(v||"").replace(",",".").replace(/[^\d.]/g,""));return Number.isFinite(n)?n:0;}
function classify(score){if(score>=85)return "Likely";if(score>=60)return "Possible";if(score>=35)return "Measure first";return "Not enough evidence";}
function addReason(arr,text,points){if(text)arr.push(text);return points;}
function partText(p){return [p.name,p.category,p.calibre,p.reference,p.condition,p.donor,p.notes].filter(Boolean).join(" ");}
function leadText(l){return [l.part,l.reference,l.compatibility,l.notes].filter(Boolean).join(" ");}
function neededText(job){const p=job?.passport||{},r=job?.researchBrief||{};return [job?.watchName,p.maker,p.model,p.calibre,p.calibreFamily,p.reference,...(r.partsLeads||[]).map(leadText),...(job?.parts||[]).map(x=>[x.part,x.partNumber].filter(Boolean).join(" "))].filter(Boolean).join(" ");}
function targetKey(job){return compact(job?.passport?.calibre)||String(job?.id||"");}
function evidenceList(state){return Array.isArray(state?.partFitEvidence)?state.partFitEvidence:[];}
function sourceKey(type,id,partId=""){return `${type}:${id}:${partId||""}`;}
function latestEvidence(state,job,type,id,partId=""){
  const key=sourceKey(type,id,partId),target=targetKey(job);
  return evidenceList(state).filter(e=>e&&e.sourceKey===key&&(e.targetJobId===job?.id||e.targetKey===target)).sort((a,b)=>String(b.at||"").localeCompare(String(a.at||"")))[0]||null;
}
function applyEvidence(score,why,e){
  if(!e)return score;
  if(e.result==="used"){why.unshift("Bench history: this exact source was used successfully for this watch/calibre.");return Math.max(score,100);}
  if(e.result==="verified"){why.unshift("Bench history: you verified this source fits this watch/calibre.");return Math.max(score,95);}
  if(e.result==="ruledout"){why.unshift("Bench history: you ruled this source out for this watch/calibre."+(e.note?" "+e.note:""));return 0;}
  return score;
}
export function recordFitEvidence(state,job,{sourceType,sourceId,partId="",partName="",result,note=""}){
  if(!state||!job||!sourceType||!sourceId||!["verified","ruledout","used"].includes(result))throw new Error("Invalid parts-fit evidence");
  state.partFitEvidence=Array.isArray(state.partFitEvidence)?state.partFitEvidence:[];
  const entry={id:"fit-"+Date.now().toString(36)+Math.random().toString(36).slice(2,7),sourceType,sourceId:String(sourceId),sourceKey:sourceKey(sourceType,String(sourceId),partId),partId:String(partId||""),partName:String(partName||""),targetJobId:String(job.id||""),targetKey:targetKey(job),targetWatch:String(job.watchName||""),targetCalibre:String(job.passport?.calibre||""),targetMaker:String(job.passport?.movementMaker||job.passport?.maker||""),targetModel:String(job.passport?.model||""),result,note:String(note||""),at:new Date().toISOString()};
  state.partFitEvidence.unshift(entry);
  return entry;
}
export function fitHistory(state,job){const target=targetKey(job);return evidenceList(state).filter(e=>e&&(e.targetJobId===job?.id||e.targetKey===target)).sort((a,b)=>String(b.at||"").localeCompare(String(a.at||"")));}

function sourceLabel(state,e){
  if(e.sourceType==="stock"){
    const p=(state?.partsStock||[]).find(x=>String(x.id)===String(e.sourceId));
    return p?.name||p?.reference||e.partName||"Loose stock part";
  }
  if(e.sourceType==="donorItem"){
    const d=(state?.items||[]).find(x=>String(x.id)===String(e.sourceId));
    return d?.title||"Donor item";
  }
  const d=(state?.jobs||[]).find(x=>String(x.id)===String(e.sourceId));
  return d?.watchName||"Donor watch";
}
function evidenceSearchText(state,e){return [e.partName,e.partId,e.targetWatch,e.targetCalibre,e.targetMaker,e.targetModel,e.note,e.result,e.sourceType,sourceLabel(state,e)].filter(Boolean).join(" ");}
export function compatibilityReference(state,{query="",result="all",source="all"}={}){
  const q=fold(query),all=evidenceList(state).slice().sort((a,b)=>String(b.at||"").localeCompare(String(a.at||"")));
  const rows=all.filter(e=>{
    if(result!=="all"&&e.result!==result)return false;
    if(source!=="all"){
      if(source==="donor"&&!['donor','donorItem'].includes(e.sourceType))return false;
      if(source!=="donor"&&e.sourceType!==source)return false;
    }
    if(q&&!fold(evidenceSearchText(state,e)).includes(q))return false;
    return true;
  }).map(e=>({...e,sourceLabel:sourceLabel(state,e)}));
  const byCalibre=new Map();
  for(const e of all){const key=compact(e.targetCalibre)||"unknown";const g=byCalibre.get(key)||{key,label:e.targetCalibre||"Unknown calibre",verified:0,used:0,ruledout:0,total:0,parts:new Set(),sources:new Set()};g.total++;g[e.result]=(g[e.result]||0)+1;if(e.partName)g.parts.add(e.partName);g.sources.add(e.sourceKey);byCalibre.set(key,g);}
  const calibres=[...byCalibre.values()].map(g=>({...g,parts:[...g.parts],sources:[...g.sources]})).sort((a,b)=>b.total-a.total||a.label.localeCompare(b.label));
  const byPair=new Map();
  for(const e of all){const key=[compact(e.targetCalibre)||e.targetKey||"unknown",fold(e.partName||e.partId||"part")].join("|");const g=byPair.get(key)||{key,calibre:e.targetCalibre||"Unknown calibre",part:e.partName||e.partId||"Part",verified:0,used:0,ruledout:0,total:0};g.total++;g[e.result]=(g[e.result]||0)+1;byPair.set(key,g);}
  const conflicts=[...byPair.values()].filter(g=>(g.verified+g.used)>0&&g.ruledout>0).sort((a,b)=>b.total-a.total);
  return {rows,calibres,conflicts,stats:{total:all.length,verified:all.filter(e=>e.result==="verified").length,used:all.filter(e=>e.result==="used").length,ruledout:all.filter(e=>e.result==="ruledout").length,calibres:calibres.length}};
}

export function inventoryMatches(job,partsStock=[],state={}){
  if(!job)return [];
  const p=job.passport||{},r=job.researchBrief||{},needCal=compact(p.calibre),family=fold(p.calibreFamily),maker=fold(p.movementMaker||p.maker),plate=num(p.movementMm),needAll=neededText(job);
  const leads=Array.isArray(r.partsLeads)?r.partsLeads:[];
  return (partsStock||[]).filter(x=>x&&Number(x.quantity)!==0).map(part=>{
    let score=0;const why=[];const stockCal=compact(part.calibre),txt=partText(part);
    if(needCal&&stockCal&&needCal===stockCal)score+=addReason(why,"Exact recorded calibre match.",62);
    else if(needCal&&stockCal&&(needCal.includes(stockCal)||stockCal.includes(needCal)))score+=addReason(why,"Calibre text overlaps, but is not an exact match.",34);
    if(family&&fold(txt).includes(family))score+=addReason(why,"Movement family appears in the stock record.",20);
    if(maker&&fold(txt).includes(maker))score+=addReason(why,"Movement/maker name matches the open watch.",10);
    const ov=overlap(needAll,txt);if(ov>=.35)score+=addReason(why,"Strong wording overlap with this watch's recorded parts/research.",22);else if(ov>=.18)score+=addReason(why,"Some wording overlap with the required part/research notes.",10);
    for(const lead of leads){const l=leadText(lead);if(!l)continue;const lev=overlap(l,txt);if(lev>=.45){score+=addReason(why,"Matches a researched parts lead: "+(lead.part||lead.reference||"candidate")+".",28);break;}if(lead.reference&&fold(txt).includes(fold(lead.reference))){score+=addReason(why,"Reference matches researched lead "+lead.reference+".",36);break;}}
    const refNums=[...String(part.reference||"").matchAll(/\d+(?:\.\d+)?/g)].map(m=>Number(m[0])).filter(Number.isFinite);if(plate&&refNums.some(n=>Math.abs(n-plate)<=.5))score+=addReason(why,"Recorded dimension is within 0.5 mm of the movement size; measure the actual part before use.",12);
    const evidence=latestEvidence(state,job,"stock",part.id);score=applyEvidence(score,why,evidence);
    const level=classify(score);return {part,score:Math.min(100,score),level,why:why.length?why:["No strong compatibility evidence recorded yet. Add calibre, reference or dimensions before relying on this part."],evidence};
  }).sort((a,b)=>b.score-a.score);
}

export function donorMatches(job,jobs=[],state={}){
  if(!job)return [];
  const needCal=compact(job.passport?.calibre),needPlate=num(job.passport?.movementMm),needMaker=fold(job.passport?.movementMaker||job.passport?.maker),needText=neededText(job);
  return (jobs||[]).filter(d=>d&&d.id!==job.id&&d.status==="Spares").map(donor=>{let score=0;const why=[],cal=compact(donor.passport?.calibre),plate=num(donor.passport?.movementMm),maker=fold(donor.passport?.movementMaker||donor.passport?.maker),txt=[donor.watchName,donor.passport?.model,donor.passport?.calibre,donor.passport?.calibreFamily,donor.fitsNote,donor.storageLocation].filter(Boolean).join(" ");
    if(needCal&&cal&&needCal===cal)score+=addReason(why,"Same recorded calibre.",68);else if(needCal&&cal&&(needCal.includes(cal)||cal.includes(needCal)))score+=addReason(why,"Calibre text overlaps but is not exact.",34);
    if(needMaker&&maker&&needMaker===maker)score+=addReason(why,"Same movement/maker name.",10);
    if(needPlate&&plate){const delta=Math.abs(needPlate-plate);if(delta<=.2)score+=addReason(why,"Movement size is within 0.2 mm.",16);else if(delta<=.5)score+=addReason(why,"Movement size is within 0.5 mm; measure first.",8);else if(needCal&&cal&&needCal===cal){score-=25;why.push("Warning: calibre matches but recorded movement sizes disagree.");}}
    if(fold(donor.fitsNote).includes(fold(job.watchName))||fold(donor.fitsNote).includes(fold(job.passport?.calibre)))score+=addReason(why,"You previously recorded that this donor fits this watch/calibre.",30);
    const ov=overlap(needText,txt);if(ov>=.3)score+=addReason(why,"Identity/parts wording overlaps with the open watch.",12);
    const kept=(donor.sparesParts||[]).filter(x=>x.keep);if(!kept.length){score-=20;why.push("No donor parts are currently marked as available.");}
    const evidenceType=donor._sourceType||"donor",evidenceId=donor._sourceId||donor.id;
    const partEvidence=kept.map(k=>latestEvidence(state,job,evidenceType,evidenceId,k.id)).filter(Boolean).sort((a,b)=>String(b.at||"").localeCompare(String(a.at||"")))[0]||latestEvidence(state,job,evidenceType,evidenceId,"");score=applyEvidence(score,why,partEvidence);
    return {donor,score:Math.max(0,Math.min(100,score)),level:classify(score),why,kept,evidence:partEvidence,sourceType:evidenceType,sourceId:evidenceId};
  }).sort((a,b)=>b.score-a.score);
}

function donorSources(state={}){
  const legacy=(state.jobs||[]).filter(j=>j?.status==="Spares");
  const linkedItemIds=new Set(legacy.map(j=>String(j.itemId||"")).filter(Boolean));
  const items=(state.items||[]).filter(item=>item&&item.purpose==="donor"&&item.status!=="Archived"&&!linkedItemIds.has(String(item.id||""))).map(item=>{
    const w=item.watch||{},p=w.passport||{},m=w.movement||{};
    return {id:`item:${item.id}`,status:"Spares",watchName:item.title||"Donor item",passport:{...p,maker:p.maker||item.identity?.maker||"",model:p.model||item.identity?.model||"",calibre:p.calibre||m.calibre||"",calibreFamily:p.calibreFamily||m.calibreFamily||"",movementMm:p.movementMm||m.movementMm||"",movementMaker:p.movementMaker||m.maker||item.identity?.maker||""},sparesParts:Array.isArray(w.sparesParts)?w.sparesParts:[],fitsNote:w.fitsNote||"",storageLocation:w.storageLocation||"",_sourceType:"donorItem",_sourceId:String(item.id),_itemId:String(item.id)};
  });
  return [...legacy,...items];
}

export function compatibilitySummary(job,state){return {inventory:inventoryMatches(job,state?.partsStock||[],state),donors:donorMatches(job,donorSources(state),state),history:fitHistory(state,job)};}
