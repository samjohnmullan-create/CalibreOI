import { finalQcAssessment, finalTiming } from "./final-qc.js?v=2";

const raw=v=>v==null?"":String(v).trim();
const present=v=>raw(v)!=="";
const num=v=>Number(v);
const finite=v=>present(v)&&Number.isFinite(num(v));

function countPhotos(job){
  const p=job?.photos||{};
  const passport=Object.values(p).reduce((n,v)=>n+(Array.isArray(v)?v.length:0),0);
  const stage=(job?.stages||[]).reduce((n,s)=>n+(Array.isArray(s?.photos)?s.photos.length:0),0);
  return passport+stage;
}
function photoPack(job){
  const pack=job?.sale?.photoPack||{};
  const selected=Array.isArray(pack.selected)?pack.selected.filter(Boolean).length:0;
  const hero=present(pack.hero);
  return {selected,hero,ready:hero&&selected>=3};
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
  const p=job?.passport||{},b=job?.business||{},qc=finalQcAssessment(job),timing=finalTiming(job),photos=countPhotos(job),pack=photoPack(job),cond=condition(job),dims=dimensions(p);
  const items=[
    check("identity","Identity",present(p.maker)||present(p.model)||present(job?.watchName),present(p.calibre)?`Cal. ${p.calibre}`:"Maker/model recorded"),
    check("condition","Condition",present(cond),present(cond)?cond:"Record the watch condition"),
    check("calibre","Movement / calibre",present(p.calibre)||present(p.movementMaker),present(p.calibre)?`Cal. ${p.calibre}`:"Movement identified",false),
    check("dimensions","Dimensions",dims.length>0,dims.length?dims.join(" · "):"Add case dimensions",false),
    check("repair","Repair record",present(job?.repairPerformed)||present(job?.diagnosis),present(job?.repairPerformed)?"Work performed recorded":"Diagnosis recorded"),
    check("finalqc","Final QC release",qc.pass,qc.pass?"Release inspection PASS":`${qc.label}${qc.blockers.length?" · "+qc.blockers[0]:""}`),
    check("timing","Final timing",!!timing,timing?`${num(timing.rateSecondsPerDay??timing.rate)>=0?"+":""}${num(timing.rateSecondsPerDay??timing.rate).toFixed(1)} s/day${timing.position?` · ${timing.position}`:""}${timing.phase?` · ${timing.phase}`:""}`:"Save an After service / Regulation test / Final test run",false),
    check("photos","Recorded photos",photos>=3,photos?`${photos} recorded photo${photos===1?"":"s"}`:"Add workshop or Identity photos",false),
    check("photopack","Listing photo pack",pack.ready,pack.ready?`${pack.selected} selected · hero chosen`:`${pack.selected} selected · ${pack.hero?"hero chosen":"choose a hero"} · minimum 3`,true),
    check("price","Sale target",finite(b.targetSale)&&num(b.targetSale)>0,finite(b.targetSale)&&num(b.targetSale)>0?`Target ${b.targetSale}`:"Set a target sale price"),
  ];
  const required=items.filter(x=>x.required),requiredDone=required.filter(x=>x.ok).length,allDone=items.filter(x=>x.ok).length;
  return {items,requiredDone,requiredTotal:required.length,allDone,allTotal:items.length,ready:requiredDone===required.length,qc,photoPack:pack};
}
