import test from 'node:test';
import assert from 'node:assert/strict';
import {blankAcquisitionCandidate,acquisitionEconomics,acquisitionRecommendation,acquisitionPortfolioFit,saveAcquisitionCandidate,convertAcquisitionToItem} from '../js/acquisition-engine.js';

function candidate(overrides={}){
  return blankAcquisitionCandidate({
    title:'Vintage Olma lot',category:'watch',sourceName:'Example Auctions',lotNumber:'42',
    identity:{maker:'Olma',model:'Caravelle',calibre:'FHF 96',confidence:'High'},
    assessment:{condition:'Used, scratched crystal',repairRisk:'low'},
    assumptions:{currentPrice:'100',buyerPremiumPercent:'20',postage:'20',parts:'30',consumables:'0',externalService:'0',repairContingency:'0',labourMinutes:'60',labourRate:'50',sellingFeePercent:'10',shippingToBuyer:'20',resaleLow:'400',resaleExpected:'500',resaleHigh:'600',desiredProfitAfterLabour:'100'},
    ...overrides
  });
}

test('Maximum bid is solved backwards from explicit costs, labour and desired profit',()=>{
  const e=acquisitionEconomics(candidate());
  assert.ok(Math.abs(e.maxBidExpected-191.6667)<0.01);
  assert.ok(Math.abs(e.maxBidLow-116.6667)<0.01);
  assert.equal(e.expected.premium,20);
  assert.equal(e.expected.sellingFees,50);
  assert.equal(e.expected.labour,50);
  assert.equal(e.expected.afterLabour,210);
});

test('Recommendation distinguishes strong buy from over-max pass',()=>{
  const state={items:[],work:[],inventory:{parts:[]}};
  assert.equal(acquisitionRecommendation(candidate(),state).recommendation,'BUY');
  const expensive=candidate();expensive.assumptions.currentPrice='250';
  const result=acquisitionRecommendation(expensive,state);
  assert.equal(result.recommendation,'PASS');
  assert.match(result.reasons.join(' '),/exceeds the expected max bid/i);
});

test('High repair risk stays WATCH even when the price math is attractive',()=>{
  const c=candidate();c.assessment.repairRisk='high';
  assert.equal(acquisitionRecommendation(c,{items:[],work:[],inventory:{parts:[]}}).recommendation,'WATCH');
});

test('Portfolio fit explains same-calibre Items, active Work and loose parts',()=>{
  const state={items:[{id:'item-1',type:'watch',purpose:'resale',status:'On bench',identity:{maker:'Olma'},watch:{passport:{calibre:'FHF 96'}}}],work:[{id:'work-1',itemId:'item-1',status:'In progress'}],inventory:{parts:[{id:'p1',name:'Mainspring',calibre:'FHF 96',quantity:1}]}};
  const fit=acquisitionPortfolioFit(candidate(),state);
  assert.equal(fit.usefulness,'high');
  assert.equal(fit.sameCalibre.length,1);
  assert.equal(fit.activeSameCalibre.length,1);
  assert.equal(fit.matchingParts.length,1);
});

test('Saved opportunity lives in Incoming and purchased conversion creates Item without Work',()=>{
  const state={items:[],work:[],incoming:[],inventory:{parts:[]},currentItemId:'',currentWorkId:''};
  const saved=saveAcquisitionCandidate(state,candidate());
  assert.equal(state.incoming.length,1);
  assert.equal(saved.recordType,'acquisition-candidate');
  const item=convertAcquisitionToItem(state,saved.id,{purchasePrice:120,acquiredAt:'2026-10-14'});
  assert.equal(state.items.length,1);
  assert.equal(state.work.length,0);
  assert.equal(item.purpose,'resale');
  assert.equal(item.status,'Acquired');
  assert.equal(item.commercial.purchasePrice,'120');
  assert.equal(item.commercial.buyerPremium,'24');
  assert.equal(item.commercial.postage,'20');
  assert.equal(item.commercial.partsCost,'');
  assert.equal(item.commercial.targetSale,'500');
  assert.equal(item.watch.passport.calibre,'FHF 96');
  assert.equal(state.incoming[0].status,'purchased');
  assert.equal(state.incoming[0].convertedItemId,item.id);
  assert.equal(state.currentItemId,item.id);
  assert.equal(state.currentWorkId,'');
});

test('Conversion is idempotent after candidate already has an Item',()=>{
  const state={items:[],work:[],incoming:[],inventory:{parts:[]}};
  const saved=saveAcquisitionCandidate(state,candidate());
  const first=convertAcquisitionToItem(state,saved.id,{purchasePrice:120});
  const second=convertAcquisitionToItem(state,saved.id,{purchasePrice:999});
  assert.equal(second.id,first.id);
  assert.equal(state.items.length,1);
  assert.equal(state.items[0].commercial.purchasePrice,'120');
});
