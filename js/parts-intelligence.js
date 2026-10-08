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

export function inventoryMatches(job,partsStock=[]){
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
    const level=classify(score);return {part,score:Math.min(100,score),level,why:why.length?why:["No strong compatibility evidence recorded yet. Add calibre, reference or dimensions before relying on this part."]};
  }).sort((a,b)=>b.score-a.score);
}

export function donorMatches(job,jobs=[]){
  if(!job)return [];
  const needCal=compact(job.passport?.calibre),needPlate=num(job.passport?.movementMm),needMaker=fold(job.passport?.movementMaker||job.passport?.maker),needText=neededText(job);
  return (jobs||[]).filter(d=>d&&d.id!==job.id&&d.status==="Spares").map(donor=>{let score=0;const why=[],cal=compact(donor.passport?.calibre),plate=num(donor.passport?.movementMm),maker=fold(donor.passport?.movementMaker||donor.passport?.maker),txt=[donor.watchName,donor.passport?.model,donor.passport?.calibre,donor.passport?.calibreFamily,donor.fitsNote].filter(Boolean).join(" ");
    if(needCal&&cal&&needCal===cal)score+=addReason(why,"Same recorded calibre.",68);else if(needCal&&cal&&(needCal.includes(cal)||cal.includes(needCal)))score+=addReason(why,"Calibre text overlaps but is not exact.",34);
    if(needMaker&&maker&&needMaker===maker)score+=addReason(why,"Same movement/maker name.",10);
    if(needPlate&&plate){const delta=Math.abs(needPlate-plate);if(delta<=.2)score+=addReason(why,"Movement size is within 0.2 mm.",16);else if(delta<=.5)score+=addReason(why,"Movement size is within 0.5 mm; measure first.",8);else if(needCal&&cal&&needCal===cal){score-=25;why.push("Warning: calibre matches but recorded movement sizes disagree.");}}
    if(fold(donor.fitsNote).includes(fold(job.watchName))||fold(donor.fitsNote).includes(fold(job.passport?.calibre)))score+=addReason(why,"You previously recorded that this donor fits this watch/calibre.",30);
    const ov=overlap(needText,txt);if(ov>=.3)score+=addReason(why,"Identity/parts wording overlaps with the open watch.",12);
    const kept=(donor.sparesParts||[]).filter(x=>x.keep);if(!kept.length){score-=20;why.push("No donor parts are currently marked as available.");}
    return {donor,score:Math.max(0,Math.min(100,score)),level:classify(score),why,kept};
  }).sort((a,b)=>b.score-a.score);
}

export function compatibilitySummary(job,state){return {inventory:inventoryMatches(job,state?.partsStock||[]),donors:donorMatches(job,state?.jobs||[])};}
