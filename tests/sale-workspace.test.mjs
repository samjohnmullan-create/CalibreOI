import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveSaleContext,saleMediaCandidates,listingPackStatus,saleReadiness,recordSold,saleMetrics} from '../js/sale-workspace.js';

const qcChecks={windSet:'yes',hands:'yes',case:'yes',timing:'na',reserve:'yes',extended:'yes',appearance:'yes'};
function fixture(){
  const item={
    id:'item-1',type:'watch',purpose:'resale',title:'Olma manual watch',status:'Preparing',
    identity:{maker:'Olma',model:'Caravelle',year:'1960s',materials:'Steel'},
    condition:'Scratched crystal',preparation:{finalCondition:'Serviced, clean case with light vintage wear.'},
    mediaAssets:[
      {id:'media-1',itemId:'item-1',mimeType:'image/jpeg',storageKey:'private/one.jpg',category:'sale'},
      {id:'media-2',itemId:'item-1',mimeType:'image/jpeg',storageKey:'private/two.jpg',category:'movement'},
      {id:'media-3',itemId:'item-1',mimeType:'image/jpeg',thumbnailStorageKey:'private/three-thumb.jpg',category:'identity'}
    ],
    commercial:{purchasePrice:'80',partsCost:'20',targetSale:'250',minSale:'190'},
    sale:{listingTitle:'1960s Olma Caravelle manual watch',listingText:'Serviced vintage Olma Caravelle.',photoPack:{hero:'media-1',selected:['media-1','media-2','media-3'],roles:{front:'media-1',movement:'media-2'}}},
    watch:{passport:{maker:'Olma',model:'Caravelle',calibre:'FHF 96',jewels:'17'},movement:{calibre:'FHF 96'}}
  };
  const work={id:'work-1',itemId:'item-1',type:'service',title:'Full service',status:'Complete',repairPerformed:'Full strip, clean, lubrication and regulation.',blocker:'',partIds:[],timingRuns:[],stages:[{name:'Final QC',complete:true,checks:{...qcChecks}}]};
  return {items:[item],work:[work],ledger:[],currentItemId:'item-1',currentWorkId:'work-1'};
}

test('Sale context resolves permanent Item and linked Work separately',()=>{
  const state=fixture(),context=resolveSaleContext(state,{workId:'work-1'});
  assert.equal(context.item.id,'item-1');
  assert.equal(context.work.id,'work-1');
  assert.equal(state.currentItemId,'item-1');
  assert.equal(state.currentWorkId,'work-1');
});

test('Listing candidates include private storage-key-only Item media',()=>{
  const state=fixture(),item=state.items[0],rows=saleMediaCandidates(item);
  assert.equal(rows.length,3);
  assert.equal(rows[0].id,'media-1');
  assert.equal(rows[0].src,'');
  assert.equal(listingPackStatus(item).complete,true);
});

test('Sale readiness is derived from Item commercial/media and Work evidence',()=>{
  const state=fixture(),item=state.items[0],work=state.work[0],result=saleReadiness(item,work,state);
  assert.equal(result.ready,true);
  assert.equal(result.checks.find(row=>row.id==='photos').ok,true);
  assert.equal(result.checks.find(row=>row.id==='listing').ok,true);
  item.sale.listingText='';
  assert.equal(saleReadiness(item,work,state).ready,false);
});

test('Sold transition updates Item and creates one idempotent sale ledger receipt',()=>{
  const state=fixture(),item=state.items[0];
  recordSold(state,item,{actualSale:'235',channel:'eBay',soldAt:'2026-10-14'});
  assert.equal(item.status,'Sold');
  assert.equal(item.commercial.actualSale,'235');
  assert.equal(item.commercial.saleChannel,'eBay');
  assert.equal(state.ledger.length,1);
  assert.equal(state.ledger[0].id,'sale-item-1');
  assert.equal(state.ledger[0].amount,235);
  recordSold(state,item,{actualSale:'240',channel:'Private sale',soldAt:'2026-10-15'});
  assert.equal(state.ledger.length,1);
  assert.equal(state.ledger[0].amount,240);
  assert.equal(state.ledger[0].method,'Private sale');
});

test('Sale metrics read canonical Item commercial values',()=>{
  const item=fixture().items[0],metrics=saleMetrics(item);
  assert.equal(metrics.invested,100);
  assert.equal(metrics.target,250);
  assert.equal(metrics.projectedProfit,150);
});
