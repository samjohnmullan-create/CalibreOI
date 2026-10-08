const n=v=>Number(v)||0;

export function watchEconomics(job){
  const b=job?.business||{};
  const acquisition=n(b.purchasePrice)+n(b.buyerPremium)+n(b.postage);
  const repair=n(b.strapCost)+n(b.batteryCost)+n(b.partsCost)+n(b.consumables)+n(b.externalService)+n(b.otherCost);
  const selling=n(b.marketplaceFees)+n(b.shippingToBuyer);
  const direct=acquisition+repair+selling;
  const hours=n(b.labourMinutes)/60;
  const labour=hours*n(b.labourRate);
  const target=n(b.targetSale);
  const actual=n(b.actualSale);
  const cashProfit=(actual||target)-direct;
  const profitAfterLabour=cashProfit-labour;
  const roi=direct?cashProfit/direct:0;
  const margin=(actual||target)?cashProfit/(actual||target):0;
  const perHour=hours?profitAfterLabour/hours:null;
  const breakEven=direct;
  const saleForRoi=rate=>direct*(1+rate);
  const saleForHourly=hourly=>direct+(hours*hourly);
  let health="No target";
  if(target){
    if(profitAfterLabour<0)health="Losing money";
    else if(roi<0.2)health="Thin margin";
    else if(roi<0.4)health="Healthy";
    else health="Strong";
  }
  return {acquisition,repair,selling,direct,hours,labour,target,actual,cashProfit,profitAfterLabour,roi,margin,perHour,breakEven,saleForRoi,saleForHourly,health};
}

export function portfolioEconomics(jobs=[]){
  const rows=jobs.map(j=>({job:j,...watchEconomics(j)}));
  const unsold=rows.filter(x=>!x.actual&&x.job?.status!=="Sold");
  const sold=rows.filter(x=>x.actual>0||x.job?.status==="Sold");
  const sum=(list,key)=>list.reduce((a,x)=>a+(Number(x[key])||0),0);
  const best=(list,key)=>list.filter(x=>Number.isFinite(x[key])).sort((a,b)=>b[key]-a[key])[0]||null;
  const totalInvested=sum(unsold,"direct");
  const projectedSales=sum(unsold,"target");
  const projectedProfit=sum(unsold,"cashProfit");
  const projectedAfterLabour=sum(unsold,"profitAfterLabour");
  const realisedSales=sum(sold,"actual");
  const realisedProfit=sold.reduce((a,x)=>a+(x.actual-x.direct),0);
  const atRisk=unsold.filter(x=>x.target&&x.profitAfterLabour<0);
  const thin=unsold.filter(x=>x.target&&x.roi<0.2&&x.profitAfterLabour>=0);
  return {rows,unsold,sold,totalInvested,projectedSales,projectedProfit,projectedAfterLabour,realisedSales,realisedProfit,atRisk,thin,bestProfit:best(rows,"cashProfit"),bestRoi:best(rows,"roi"),bestPerHour:best(rows,"perHour")};
}
