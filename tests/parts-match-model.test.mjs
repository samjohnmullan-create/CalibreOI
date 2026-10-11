import test from 'node:test';
import assert from 'node:assert/strict';
import {canonicalPartInventory,partMatchSummary,recordPartMatchEvidence} from '../js/parts-match-model.js';

function baseState(){
  return {
    items:[
      {id:'item-1',title:'Target',identity:{maker:'ETA'},watch:{passport:{calibre:'2824',movementMm:'25.6'}},purpose:'resale'},
      {id:'donor-1',title:'Donor 2824',identity:{maker:'ETA'},purpose:'donor',status:'Donor',watch:{passport:{calibre:'2824',movementMm:'25.6'},storageLocation:'Tray A'}}
    ],
    workRecords:[{id:'work-1',itemId:'item-1',title:'Service',status:'Waiting',partIds:['need-1']}],
    inventory:{parts:[
      {id:'need-1',name:'Balance staff',workId:'work-1',status:'needed',quantity:1,reference:'2824'},
      {id:'stock-1',name:'Balance staff',calibre:'2824',status:'stock',quantity:1,storageLocation:'Drawer 2'}
    ]},
    partFitEvidence:[]
  };
}

test('canonical Parts inventory comes from state.inventory.parts',()=>{
  const state=baseState();
  assert.equal(canonicalPartInventory(state).length,2);
  assert.equal(canonicalPartInventory({partsStock:[{id:'legacy'}]}).length,0);
});

test('matching ranks canonical loose stock and donor Items',()=>{
  const state=baseState(),work=state.workRecords[0],summary=partMatchSummary(work,state);
  assert.equal(summary.inventory[0].part.id,'stock-1');
  assert.ok(summary.inventory[0].score>=60);
  assert.equal(summary.donors[0].donor.id,'donor-1');
  assert.ok(summary.donors[0].score>=85);
});

test('bench evidence overrides donor ranking',()=>{
  const state=baseState(),work=state.workRecords[0];
  recordPartMatchEvidence(state,work,{sourceType:'donorItem',sourceId:'donor-1'},{result:'ruledout',note:'Different staff shoulder'});
  let summary=partMatchSummary(work,state);
  assert.equal(summary.donors[0].score,0);
  assert.equal(summary.donors[0].evidence.result,'ruledout');
  recordPartMatchEvidence(state,work,{sourceType:'donorItem',sourceId:'donor-1'},{result:'verified'});
  summary=partMatchSummary(work,state);
  assert.ok(summary.donors[0].score>=95);
  assert.equal(summary.donors[0].evidence.result,'verified');
});
