const num=v=>Number(v)||0;
const text=v=>String(v??'').trim();
const DAY=86400000;
const dateMs=v=>{const n=Date.parse(v||'');return Number.isFinite(n)?n:0;};

export function commercial(item={}){return item.commercial&&typeof item.commercial==='object'?item.commercial:{};}
export function directCost(item={}){const c=commercial(item);return ['purchasePrice','buyerPremium','postage','preparationCost','repairCost','partsCost','consumables','externalService','marketplaceFees','shippingToBuyer','otherCost'].reduce((sum,key)=>sum+num(c[key]),0);}
export function labourMinutes(item={}){return Math.max(0,num(commercial(item).labourMinutes));}
export function labourCost(item={}){const c=commercial(item);return labourMinutes(item)/60*num(c.labourRate);}
export function targetSale(item={}){return num(commercial(item).targetSale);}
export function actualSale(item={}){return num(commercial(item).actualSale);}
export function acquiredDate(item={}){return commercial(item).acquiredAt||item.createdAt||'';}
export function daysOwned(item={},now=Date.now()){const at=dateMs(acquiredDate(item));return at?Math.max(0,Math.floor((now-at)/DAY)):0;}
export function isSold(item={}){return item.status==='Sold'||actualSale(item)>0;}
export function economics(item={},sold=false){const cost=directCost(item),sale=sold?actualSale(item):targetSale(item),cash=sale-cost,labour=labourCost(item),after=cash-labour,hours=labourMinutes(item)/60;return {cost,sale,cash,labour,after,roi:cost?cash/cost:0,profitPerHour:hours?after/hours:null};}

function activeWorkForItem(state={},item={}){return (Array.isArray(state.work)?state.work:[]).filter(w=>String(w.itemId)===String(item.id)&&!['Complete','Cancelled'].includes(w.status));}
function workSignals(state,item){const rows=activeWorkForItem(state,item);const active=rows.find(w=>w.status==='In progress')||rows[0]||null;return {rows,active,blocked:rows.some(w=>w.status==='Waiting'||text(w.blocker)),priority:rows.some(w=>w.priority),nextAction:text(active?.nextAction),blocker:text(active?.blocker)};}

export function priorityForItem(state={},item={},now=Date.now()){
  if(!item||item.purpose!=='resale'||isSold(item)||item.status==='Archived')return null;
  const e=economics(item),age=daysOwned(item,now),work=workSignals(state,item),reasons=[];
  let score=0;

  if(e.sale>0){score+=Math.min(30,Math.max(0,e.after)/20);reasons.push(`Potential ${Math.round(e.after)} after labour`);}else{score-=18;reasons.push('Set a target sale first');}
  if(e.roi>0){score+=Math.min(20,e.roi*10);if(e.roi>=1)reasons.push(`${Math.round(e.roi*100)}% projected ROI`);}else if(e.sale>0){score-=10;reasons.push('Margin is currently weak');}
  if(e.profitPerHour!=null){score+=Math.min(18,Math.max(-8,e.profitPerHour/12));if(e.profitPerHour>=50)reasons.push(`${Math.round(e.profitPerHour)}/hr projected`);}else if(e.after>0){score+=6;reasons.push('No labour estimate recorded');}
  if(age>=120){score+=16;reasons.push(`${age} days in stock`);}else if(age>=60){score+=9;reasons.push(`${age} days in stock`);}else if(age>=30){score+=4;}
  if(e.cost>=200){score+=Math.min(14,e.cost/50);reasons.push(`${Math.round(e.cost)} capital tied up`);}else if(e.cost>=80){score+=5;}
  if(work.priority){score+=18;reasons.push('Marked priority');}
  if(work.active?.status==='In progress'){score+=10;reasons.push('Already in progress');}
  if(work.nextAction){score+=5;reasons.push(`Next: ${work.nextAction}`);}
  if(work.blocked){score-=24;reasons.push(work.blocker?`Blocked: ${work.blocker}`:'Waiting / blocked');}
  if(item.status==='Ready to list'){score+=22;reasons.push('Ready to list — close the loop');}
  if(item.status==='Listed'){score-=10;reasons.push('Already listed');}
  if(item.status==='Awaiting parts'){score-=16;reasons.push('Awaiting parts');}
  if(item.status==='Researching'){score+=3;}

  const confidence=e.sale>0?(labourMinutes(item)>0?'high':'medium'):'low';
  return {itemId:item.id,score:Math.round(score),age,e,work,confidence,reasons:[...new Set(reasons)].slice(0,5)};
}

export function rankWorkNext(state={},now=Date.now()){
  const items=Array.isArray(state.items)?state.items:[];
  return items.map(item=>{const p=priorityForItem(state,item,now);return p?{item,p}:null;}).filter(Boolean).sort((a,b)=>b.p.score-a.p.score||b.p.e.after-a.p.e.after||b.p.age-a.p.age);
}

export function businessSnapshot(state={},now=Date.now()){
  const items=(Array.isArray(state.items)?state.items:[]).filter(i=>i?.purpose==='resale');
  const stock=items.filter(i=>!isSold(i)&&i.status!=='Archived'),sold=items.filter(isSold);
  const capital=stock.reduce((s,i)=>s+directCost(i),0),potential=stock.reduce((s,i)=>s+economics(i).cash,0),afterLabour=stock.reduce((s,i)=>s+economics(i).after,0),realised=sold.reduce((s,i)=>s+economics(i,true).cash,0);
  const aged=stock.filter(i=>daysOwned(i,now)>=90),missingTargets=stock.filter(i=>targetSale(i)<=0);
  return {stockCount:stock.length,soldCount:sold.length,capital,potential,afterLabour,realised,agedCount:aged.length,missingTargetCount:missingTargets.length};
}
