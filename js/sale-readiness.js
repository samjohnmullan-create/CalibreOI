const raw=v=>v==null?"":String(v).trim();
const present=v=>raw(v)!=="";
const num=v=>Number(v);
const finite=v=>Number.isFinite(num(v));

function latestTiming(job){
  const runs=(job?.timingRuns||[]).filter(r=>finite(r?.rateSecondsPerDay??r?.rate));
  return runs.length?runs[runs.length-1]:null;
}
function finalStage(job){return (job?.stages||[]).find(s=>s?.name==="Final QC")||null;}
function countPhotos(job){
  const p=job?.photos||{};
  const passport=Object.values(p).reduce((n,v)=>n+(Array.isArray(v)?v.length:0),0);
  const stage=(job?.stages||[]).reduce((n,s)=>n+(Array.isArray(s?.photos)?s.photos.length:0),0);
  return passport+stage;
}
function hasSalePhoto(job){
  const p=job?.photos||{};
  return Array.isArray(p.sale)&&p.sale.length>0;
}
function condition(job){return raw(job?.stages?.[0]?.condition||job?.condition);}
function dimensions(p){
  const bits=[];
  if(present(p.width))bits.push(`${p.width} mm wide`);
  if(present(p.diameter))bits.push(`${p.diameter} mm diameter`);
  if(present(p.lugWidth))bits.push(`${p.lugWidth} mm lugs`);
  if(present(p.thickness))bits.push(`${p.thickness} mm thick`);
  return bits;
}
function check(id,label,ok,detail,required=true){return {id,label,ok:Boolean(ok),detail:detail||"",required};}
export function saleReadiness(job){
  const p=job?.passport||{},b=job?.business||{},final=finalStage(job),timing=latestTiming(job),photos=countPhotos(job),cond=condition(job),dims=dimensions(p);
  const items=[
    check("identity","Identity",present(p.maker)||present(p.model)||present(job?.watchName),present(p.calibre)?`Cal. ${p.calibre}`:"Maker/model recorded"),
    check("condition","Condition",present(cond),present(cond)?cond:"Record the watch condition"),
    check("calibre","Movement / calibre",present(p.calibre)||present(p.movementMaker),present(p.calibre)?`Cal. ${p.calibre}`:"Movement identified",false),
    check("dimensions","Dimensions",dims.length>0,dims.length?dims.join(" · "):"Add case dimensions",false),
    check("repair","Repair record",present(job?.repairPerformed)||present(job?.diagnosis),present(job?.repairPerformed)?"Work performed recorded":"Diagnosis recorded"),
    check("finalqc","Final QC",!!final?.complete,final?.complete?"Final QC complete":"Complete the Final QC stage"),
    check("timing","Timing",!!timing,timing?`${num(timing.rateSecondsPerDay??timing.rate)>=0?"+":""}${num(timing.rateSecondsPerDay??timing.rate).toFixed(1)} s/day${timing.position?` · ${timing.position}`:""}`:"Save at least one timing run",false),
    check("photos","Photos",photos>=3,photos?`${photos} recorded photo${photos===1?"":"s"}`:"Add sale/identity photos"),
    check("salephoto","Sale photo",hasSalePhoto(job),hasSalePhoto(job)?"Sale photo present":"Add at least one sale photo",false),
    check("price","Sale target",finite(b.targetSale)&&num(b.targetSale)>0,finite(b.targetSale)&&num(b.targetSale)>0?`Target ${b.targetSale}`:"Set a target sale price"),
  ];
  const required=items.filter(x=>x.required),requiredDone=required.filter(x=>x.ok).length,allDone=items.filter(x=>x.ok).length;
  return {items,requiredDone,requiredTotal:required.length,allDone,allTotal:items.length,ready:requiredDone===required.length};
}
