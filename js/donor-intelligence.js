import {partMatchSummary} from './parts-match-model.js?v=2';

const money=v=>{const n=Number(v);return Number.isFinite(n)&&n>0?n:0;};
const text=v=>String(v??'').trim();
function itemById(state,id){return (state.items||[]).find(item=>String(item.id)===String(id))||null;}
function invested(item={}){const c=item.commercial||{};return ['purchasePrice','buyerPremium','postage','preparationCost','repairCost','partsCost','externalService','otherCost'].reduce((sum,key)=>sum+money(c[key]),0);}
function resaleSignal(item={}){const c=item.commercial||{};return Math.max(money(c.actualSale),money(c.targetSale),money(c.minSale),invested(item));}
function completeness(item={}){const parts=item.watch?.sparesParts||[];if(parts.some(p=>p?.used||p?.quantity===0))return 'already-parted';if(parts.length)return 'documented-parts';return 'unknown-complete';}
function riskFor(item={}){const value=resaleSignal(item),complete=completeness(item);let points=0,reasons=[];if(value>=300){points+=50;reasons.push(`about $${Math.round(value)} value at risk`);}else if(value>=150){points+=32;reasons.push(`about $${Math.round(value)} value at risk`);}else if(value>=75){points+=18;reasons.push(`about $${Math.round(value)} value at risk`);}if(complete==='unknown-complete'){points+=28;reasons.push('not recorded as already parted');}else if(complete==='documented-parts'){points+=12;reasons.push('donor parts are documented');}if(item.status==='Retained'){points+=40;reasons.push('Item is retained');}const level=points>=60?'high':points>=30?'medium':'low';return {level,points,value,complete,reasons};}

export function donorDecisionSummary(work,state={}){
  const matches=partMatchSummary(work,state),bestStock=matches.inventory?.[0]||null;
  const donors=(matches.donors||[]).map(match=>{
    const item=itemById(state,match.donor?.id),risk=riskFor(item||{}),verified=['verified','used'].includes(match.evidence?.result),fitScore=Number(match.score)||0;
    let action='measure-first',why='Compatibility is not strong enough to justify stripping the donor.';
    if(match.evidence?.result==='ruledout'){action='do-not-use';why='Bench evidence already ruled this donor out.';}
    else if(bestStock&&Number(bestStock.score)>=Math.max(60,fitScore-5)){action='prefer-loose-stock';why='A loose stock candidate has similar compatibility evidence and avoids sacrificing a donor.';}
    else if(risk.level==='high'&&!verified){action='protect-donor';why='The donor has meaningful value/completeness risk and fit is not bench-verified.';}
    else if(fitScore>=85&&risk.level==='low'){action='good-donor';why=verified?'Bench evidence supports this donor and sacrifice risk is low.':'Compatibility evidence is strong and recorded sacrifice risk is low; verify the part physically first.';}
    else if(fitScore>=60){action='candidate';why=risk.level==='high'?'Compatibility is plausible, but donor sacrifice risk is high.':'Compatibility is plausible; measure/verify before removing parts.';}
    return {...match,item,risk,verified,action,decisionWhy:why};
  }).sort((a,b)=>{
    const order={'good-donor':0,'prefer-loose-stock':1,'candidate':2,'measure-first':3,'protect-donor':4,'do-not-use':5};return (order[a.action]??9)-(order[b.action]??9)||b.score-a.score||a.risk.points-b.risk.points;
  });
  return {bestStock,donors,history:matches.history||[]};
}

export function donorCompatibilityAlerts(state={}){
  const donors=(state.items||[]).filter(item=>item?.purpose==='donor'&&item.status!=='Archived'),alerts=[];
  for(let i=0;i<donors.length;i++)for(let j=i+1;j<donors.length;j++){
    const a=donors[i],b=donors[j],ap=a.watch?.passport||{},bp=b.watch?.passport||{},ac=text(ap.calibre||a.watch?.movement?.calibre),bc=text(bp.calibre||b.watch?.movement?.calibre),am=text(ap.movementMaker||a.watch?.movement?.maker||a.identity?.maker),bm=text(bp.movementMaker||b.watch?.movement?.maker||b.identity?.maker);
    if(ac&&bc&&ac.toLowerCase()===bc.toLowerCase())alerts.push({id:`${a.id}:${b.id}`,kind:'same-calibre',score:95,itemA:a,itemB:b,why:`Both donors are recorded as ${[am||bm,ac].filter(Boolean).join(' ')}. They may be useful together, but part interchange still requires physical verification.`});
    else if(ac&&bc&&(ac.toLowerCase().includes(bc.toLowerCase())||bc.toLowerCase().includes(ac.toLowerCase()))&&(!am||!bm||am.toLowerCase()===bm.toLowerCase()))alerts.push({id:`${a.id}:${b.id}`,kind:'calibre-overlap',score:65,itemA:a,itemB:b,why:`Recorded calibre text overlaps (${ac} / ${bc}). Treat this as a lead, not proof of compatibility.`});
  }
  return alerts.sort((a,b)=>b.score-a.score);
}
