const n=v=>Number(v)||0;

export function commercialFor(record={}){
  return record.commercial&&typeof record.commercial==='object'?record.commercial:(record.business&&typeof record.business==='object'?record.business:{});
}

export function itemEconomics(item={}){
  const b=commercialFor(item);
  const acquisition=n(b.purchasePrice)+n(b.buyerPremium)+n(b.postage);
  const preparation=n(b.preparationCost)+n(b.repairCost)+n(b.partsCost)+n(b.consumables)+n(b.externalService)+n(b.otherCost)+n(b.strapCost)+n(b.batteryCost);
  const selling=n(b.marketplaceFees)+n(b.shippingToBuyer);
  const direct=acquisition+preparation+selling;
  const hours=n(b.labourMinutes)/60;
  const labour=hours*n(b.labourRate);
  const target=n(b.targetSale);
  const actual=n(b.actualSale);
  const chosenSale=actual||target;
  const cashProfit=chosenSale-direct;
  const profitAfterLabour=cashProfit-labour;
  const roi=direct?cashProfit/direct:0;
  const margin=chosenSale?cashProfit/chosenSale:0;
  const perHour=hours?profitAfterLabour/hours:null;
  const breakEven=direct;
  const saleForRoi=rate=>direct*(1+rate);
  const saleForHourly=hourly=>direct+(hours*hourly);
  let health='No target';
  if(target){
    if(profitAfterLabour<0)health='Losing money';
    else if(roi<0.2)health='Thin margin';
    else if(roi<0.4)health='Healthy';
    else health='Strong';
  }
  return {acquisition,repair:preparation,preparation,selling,direct,hours,labour,target,actual,cashProfit,profitAfterLabour,roi,margin,perHour,breakEven,saleForRoi,saleForHourly,health};
}

// Compatibility name for older consumers while they migrate to Item terminology.
export const watchEconomics=itemEconomics;

export function portfolioEconomics(items=[]){
  const rows=items.map(item=>({item,job:item,...itemEconomics(item)}));
  const unsold=rows.filter(x=>!x.actual&&x.item?.status!=='Sold');
  const sold=rows.filter(x=>x.actual>0||x.item?.status==='Sold');
  const sum=(list,key)=>list.reduce((a,x)=>a+(Number(x[key])||0),0);
  const best=(list,key)=>list.filter(x=>Number.isFinite(x[key])).sort((a,b)=>b[key]-a[key])[0]||null;
  return {
    rows,unsold,sold,
    totalInvested:sum(unsold,'direct'),
    projectedSales:sum(unsold,'target'),
    projectedProfit:sum(unsold,'cashProfit'),
    projectedAfterLabour:sum(unsold,'profitAfterLabour'),
    realisedSales:sum(sold,'actual'),
    realisedProfit:sold.reduce((a,x)=>a+(x.actual-x.direct),0),
    atRisk:unsold.filter(x=>x.target&&x.profitAfterLabour<0),
    thin:unsold.filter(x=>x.target&&x.roi<0.2&&x.profitAfterLabour>=0),
    bestProfit:best(rows,'cashProfit'),bestRoi:best(rows,'roi'),bestPerHour:best(rows,'perHour')
  };
}
