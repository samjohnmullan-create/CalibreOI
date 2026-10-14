import {blankItem} from './item-model.js';

const n=v=>Number(v)||0;
const text=v=>String(v??'').trim();
const now=()=>new Date().toISOString();
const today=()=>new Date().toISOString().slice(0,10);
const uid=()=>`acq-${Math.random().toString(36).slice(2,8)}${Date.now().toString(36).slice(-4)}`;

export function blankAcquisitionCandidate(partial={}){
  const createdAt=partial.createdAt||now();
  return {
    id:partial.id||uid(),recordType:'acquisition-candidate',intakeClass:'opportunity',status:partial.status||'watching',
    sourceType:partial.sourceType||'auction',sourceName:partial.sourceName||'',lotNumber:partial.lotNumber||'',listingUrl:partial.listingUrl||'',closingAt:partial.closingAt||'',
    title:partial.title||'',category:partial.category||'watch',lotText:partial.lotText||'',photoUrls:Array.isArray(partial.photoUrls)?partial.photoUrls:[],
    identity:{maker:'',model:'',calibre:'',year:'',confidence:'Unknown',notes:'',...(partial.identity||{})},
    assessment:{condition:'',repairRisk:'unknown',missingInfo:'',repairNotes:'',donorNotes:'',...(partial.assessment||{})},
    assumptions:{currentPrice:'',buyerPremiumPercent:'',postage:'',parts:'',consumables:'',externalService:'',repairContingency:'',labourMinutes:'',labourRate:'',sellingFeePercent:'',shippingToBuyer:'',resaleLow:'',resaleExpected:'',resaleHigh:'',desiredProfitAfterLabour:'',...(partial.assumptions||{})},
    decision:partial.decision||'',decisionNote:partial.decisionNote||'',convertedItemId:partial.convertedItemId||'',createdAt,updatedAt:partial.updatedAt||createdAt
  };
}

export function normaliseAcquisitionCandidate(raw={}){return blankAcquisitionCandidate(raw);}

export function acquisitionCandidates(state={}){
  return (Array.isArray(state.incoming)?state.incoming:[]).filter(row=>row?.recordType==='acquisition-candidate').map(normaliseAcquisitionCandidate);
}

function calibreOfItem(item={}){return text(item.watch?.passport?.calibre||item.watch?.movement?.calibre).toLowerCase();}
function makerOfItem(item={}){return text(item.watch?.passport?.movementMaker||item.watch?.movement?.maker||item.identity?.maker).toLowerCase();}

export function acquisitionPortfolioFit(candidate={},state={}){
  const c=normaliseAcquisitionCandidate(candidate),cal=text(c.identity.calibre).toLowerCase(),maker=text(c.identity.maker).toLowerCase(),items=(state.items||[]).filter(item=>item&&item.status!=='Archived'&&item.status!=='Sold'),parts=state.inventory?.parts||[];
  const sameCalibre=cal?items.filter(item=>calibreOfItem(item)===cal):[];
  const sameMaker=maker?items.filter(item=>makerOfItem(item)===maker):[];
  const matchingParts=cal?parts.filter(part=>Number(part.quantity)!==0&&text([part.calibre,part.reference,part.notes].join(' ')).toLowerCase().includes(cal)):[];
  const activeWorkItemIds=new Set((state.work||[]).filter(work=>!['Complete','Cancelled'].includes(work.status)).map(work=>String(work.itemId)));
  const activeSameCalibre=sameCalibre.filter(item=>activeWorkItemIds.has(String(item.id)));
  const donorSameCalibre=sameCalibre.filter(item=>item.purpose==='donor');
  let usefulness='none';
  if(activeSameCalibre.length||matchingParts.length>=2)usefulness='high';
  else if(sameCalibre.length||matchingParts.length||sameMaker.length>=2)usefulness='medium';
  else if(sameMaker.length)usefulness='low';
  const reasons=[];
  if(sameCalibre.length)reasons.push(`${sameCalibre.length} owned Item${sameCalibre.length===1?'':'s'} share the recorded calibre`);
  if(activeSameCalibre.length)reasons.push(`${activeSameCalibre.length} active Work record${activeSameCalibre.length===1?'':'s'} use that calibre`);
  if(donorSameCalibre.length)reasons.push(`${donorSameCalibre.length} donor Item${donorSameCalibre.length===1?'':'s'} already share that calibre`);
  if(matchingParts.length)reasons.push(`${matchingParts.length} loose stock part${matchingParts.length===1?'':'s'} mention that calibre`);
  if(!reasons.length&&sameMaker.length)reasons.push(`${sameMaker.length} owned Item${sameMaker.length===1?'':'s'} share the maker`);
  return {usefulness,sameCalibre,sameMaker,matchingParts,activeSameCalibre,donorSameCalibre,reasons};
}

function costModel(candidate={},saleValue=0,currentPriceOverride=null){
  const a=candidate.assumptions||{},hammer=currentPriceOverride==null?n(a.currentPrice):n(currentPriceOverride),premiumRate=Math.max(0,n(a.buyerPremiumPercent))/100,premium=hammer*premiumRate,postage=n(a.postage),parts=n(a.parts),consumables=n(a.consumables),externalService=n(a.externalService),contingency=n(a.repairContingency),sellingFees=Math.max(0,saleValue)*(Math.max(0,n(a.sellingFeePercent))/100),shipping=n(a.shippingToBuyer),labourMinutes=n(a.labourMinutes),labourRate=n(a.labourRate),labour=(labourMinutes/60)*labourRate,cashOut=hammer+premium+postage+parts+consumables+externalService+contingency+sellingFees+shipping,capitalAtRisk=hammer+premium+postage+parts+consumables+externalService+contingency,cashProfit=saleValue-cashOut,afterLabour=cashProfit-labour,roi=cashOut?cashProfit/cashOut:0;
  return {hammer,premium,premiumRate,postage,parts,consumables,externalService,contingency,sellingFees,shipping,labourMinutes,labourRate,labour,cashOut,capitalAtRisk,cashProfit,afterLabour,roi};
}

function maxHammerFor(candidate={},saleValue=0){
  const a=candidate.assumptions||{},premiumRate=Math.max(0,n(a.buyerPremiumPercent))/100,fixed=n(a.postage)+n(a.parts)+n(a.consumables)+n(a.externalService)+n(a.repairContingency)+n(a.shippingToBuyer),sellingFees=Math.max(0,saleValue)*(Math.max(0,n(a.sellingFeePercent))/100),labour=(n(a.labourMinutes)/60)*n(a.labourRate),desired=n(a.desiredProfitAfterLabour),available=saleValue-fixed-sellingFees-labour-desired;
  return Math.max(0,available/(1+premiumRate));
}

export function acquisitionEconomics(candidate={}){
  const c=normaliseAcquisitionCandidate(candidate),a=c.assumptions,low=n(a.resaleLow),expected=n(a.resaleExpected),high=n(a.resaleHigh),current=n(a.currentPrice);
  return {currentPrice:current,low:costModel(c,low),expected:costModel(c,expected),high:costModel(c,high),maxBidLow:maxHammerFor(c,low),maxBidExpected:maxHammerFor(c,expected),maxBidHigh:maxHammerFor(c,high),resale:{low,expected,high},desiredProfitAfterLabour:n(a.desiredProfitAfterLabour)};
}

export function acquisitionRecommendation(candidate={},state={}){
  const c=normaliseAcquisitionCandidate(candidate),economics=acquisitionEconomics(c),fit=acquisitionPortfolioFit(c,state),risk=text(c.assessment.repairRisk).toLowerCase(),confidence=text(c.identity.confidence).toLowerCase(),price=economics.currentPrice,max=economics.maxBidExpected,reasons=[],warnings=[];
  let recommendation='WATCH';
  if(!economics.resale.expected){warnings.push('Expected resale is not set');recommendation='WATCH';}
  else if(price>max&&price>0){recommendation='PASS';reasons.push(`Current price exceeds the expected max bid by $${(price-max).toFixed(0)}`);}
  else if(economics.expected.afterLabour<=0){recommendation='PASS';reasons.push('Expected profit after labour is not positive');}
  else if(risk==='high'||confidence==='low'||confidence==='unknown'){recommendation='WATCH';reasons.push('Uncertainty is high enough to justify more evidence before buying');}
  else if(price>0&&price<=economics.maxBidLow&&economics.expected.roi>=0.30){recommendation='BUY';reasons.push('Current price is inside the conservative max bid and expected cash ROI is at least 30%');}
  else if(price>0&&price<=max&&economics.expected.roi>=0.20){recommendation='WATCH';reasons.push('Price is inside the expected max bid, but margin is not yet strong enough for an automatic Buy');}
  else if(!price){recommendation='WATCH';reasons.push('Set the current bid / asking price before making the decision');}
  else {recommendation='PASS';reasons.push('Current assumptions do not clear the margin threshold');}
  if(risk==='high')warnings.push('Repair risk is marked high');
  if(!text(c.identity.calibre)&&c.category==='watch')warnings.push('Calibre is unknown, reducing parts/donor confidence');
  if(fit.usefulness==='high')reasons.push('Owned stock/Work suggests high donor or parts usefulness');
  return {recommendation,reasons,warnings,economics,fit};
}

export function saveAcquisitionCandidate(state={},candidate={}){
  state.incoming=Array.isArray(state.incoming)?state.incoming:[];
  const normal=normaliseAcquisitionCandidate({...candidate,updatedAt:now()}),index=state.incoming.findIndex(row=>String(row.id)===String(normal.id));
  if(index>=0)state.incoming[index]=normal;else state.incoming.unshift(normal);
  return normal;
}

export function removeAcquisitionCandidate(state={},candidateId=''){
  state.incoming=Array.isArray(state.incoming)?state.incoming:[];
  const before=state.incoming.length;state.incoming=state.incoming.filter(row=>String(row.id)!==String(candidateId));return state.incoming.length!==before;
}

export function convertAcquisitionToItem(state={},candidateId='',options={}){
  state.incoming=Array.isArray(state.incoming)?state.incoming:[];state.items=Array.isArray(state.items)?state.items:[];
  const index=state.incoming.findIndex(row=>String(row.id)===String(candidateId));if(index<0)throw new Error('Acquisition candidate could not be found.');
  const candidate=normaliseAcquisitionCandidate(state.incoming[index]);if(candidate.convertedItemId){const existing=state.items.find(item=>String(item.id)===String(candidate.convertedItemId));if(existing)return existing;}
  const purchasePrice=n(options.purchasePrice),premiumPercent=Math.max(0,n(candidate.assumptions.buyerPremiumPercent)),buyerPremium=purchasePrice*(premiumPercent/100),acquiredAt=text(options.acquiredAt||today());
  const item=blankItem({type:candidate.category||'other',purpose:'resale',title:candidate.title||[candidate.identity.maker,candidate.identity.model].filter(Boolean).join(' ')||'Acquired item',status:'Acquired',identity:{maker:candidate.identity.maker,model:candidate.identity.model,year:candidate.identity.year,notes:[candidate.identity.notes,candidate.assessment.condition].filter(Boolean).join('\n')},condition:candidate.assessment.condition,commercial:{purchasePrice:String(purchasePrice),buyerPremium:String(Math.round(buyerPremium*100)/100),postage:String(n(candidate.assumptions.postage)),targetSale:String(n(candidate.assumptions.resaleExpected)||''),minSale:String(n(candidate.assumptions.resaleLow)||''),source:candidate.sourceName,acquiredAt},notes:candidate.lotText});
  if(item.watch){item.watch.passport={...(item.watch.passport||{}),maker:candidate.identity.maker,model:candidate.identity.model,calibre:candidate.identity.calibre,year:candidate.identity.year,confidence:candidate.identity.confidence,auctionHouse:candidate.sourceName,lotNumber:candidate.lotNumber,notes:candidate.identity.notes};item.watch.movement={...(item.watch.movement||{}),calibre:candidate.identity.calibre};}
  item.acquisition={candidateId:candidate.id,sourceType:candidate.sourceType,sourceName:candidate.sourceName,lotNumber:candidate.lotNumber,listingUrl:candidate.listingUrl,assessment:{...candidate.assessment},assumptions:{...candidate.assumptions},decision:candidate.decision||'',decisionNote:candidate.decisionNote||'',snapshotAt:now()};
  state.items.unshift(item);candidate.convertedItemId=item.id;candidate.status='purchased';candidate.updatedAt=now();state.incoming[index]=candidate;state.currentItemId=item.id;state.currentWorkId='';return item;
}
