import test from 'node:test';
import assert from 'node:assert/strict';
import {partReadiness,assignRequirementSource,setRequirementStatus,resumeWorkAfterParts} from '../js/work-parts-lifecycle.js';
import {normaliseWork} from '../js/work-model.js';
import {partMatchSummary} from '../js/parts-match-model.js';

function base(){
  return {
    items:[
      {id:'item-target',type:'watch',purpose:'resale',title:'Target watch',status:'Awaiting parts',identity:{maker:'AS'},watch:{passport:{calibre:'1130',movementMaker:'AS'},movement:{calibre:'1130'}},updatedAt:''},
      {id:'item-donor',type:'watch',purpose:'donor',title:'Donor watch',status:'Retained',identity:{maker:'AS'},watch:{passport:{calibre:'1130',movementMaker:'AS'},movement:{calibre:'1130'},sparesParts:[]},updatedAt:''}
    ],
    work:[{id:'work-1',itemId:'item-target',type:'repair',title:'Repair target',status:'Waiting',blocker:'Waiting on parts',nextAction:'Find part',partIds:['req-1'],partsUsed:[],workbenchHidden:false}],
    inventory:{parts:[
      {id:'req-1',name:'Balance staff',reference:'staff-1',quantity:1,status:'needed',itemId:'item-target',workId:'work-1'},
      {id:'stock-1',name:'Balance staff',reference:'staff-1',calibre:'1130',quantity:2,status:'available',storageLocation:'Tray A'}
    ]},
    compatibilityEvidence:[]
  };
}

test('Work requirements never appear as loose stock candidates',()=>{
  const state=base(),summary=partMatchSummary(state.work[0],state);
  assert.equal(summary.inventory.some(row=>row.part.id==='req-1'),false);
  assert.equal(summary.inventory.some(row=>row.part.id==='stock-1'),true);
});

test('selecting owned stock makes the requirement physically ready',()=>{
  const state=base(),work=state.work[0];
  assignRequirementSource(state,work,'req-1',{sourceType:'stock',sourceId:'stock-1'});
  const req=state.inventory.parts.find(x=>x.id==='req-1');
  assert.equal(req.status,'received');
  assert.equal(req.fulfilment.sourceType,'stock');
  assert.equal(req.fulfilment.sourceId,'stock-1');
  assert.equal(partReadiness(state,work).allReady,true);
  assert.equal(state.inventory.parts.find(x=>x.id==='stock-1').quantity,2,'selection must not consume stock before fitting');
});

test('fitting an owned stock part consumes quantity and preserves Work history',()=>{
  const state=base(),work=state.work[0];
  assignRequirementSource(state,work,'req-1',{sourceType:'stock',sourceId:'stock-1'});
  setRequirementStatus(state,work,'req-1','fitted');
  assert.equal(state.inventory.parts.find(x=>x.id==='stock-1').quantity,1);
  assert.equal(state.inventory.parts.find(x=>x.id==='req-1').status,'fitted');
  assert.equal(work.partsUsed.length,1);
  assert.equal(work.partsUsed[0].sourceId,'stock-1');
  assert.equal(state.compatibilityEvidence[0].result,'used');
  assert.equal(normaliseWork(work).partsUsed.length,1,'normalisation must preserve fitted-part history');
});

test('fitting from a donor records that the donor has been parted',()=>{
  const state=base(),work=state.work[0];
  assignRequirementSource(state,work,'req-1',{sourceType:'donorItem',sourceId:'item-donor'});
  setRequirementStatus(state,work,'req-1','fitted');
  const donor=state.items.find(x=>x.id==='item-donor');
  assert.equal(donor.watch.sparesParts.length,1);
  assert.equal(donor.watch.sparesParts[0].used,true);
  assert.equal(donor.watch.sparesParts[0].targetWorkId,'work-1');
  assert.equal(state.compatibilityEvidence[0].sourceType,'donorItem');
});

test('Waiting Work only resumes after every requirement is on hand',()=>{
  const state=base(),work=state.work[0];
  assert.throws(()=>resumeWorkAfterParts(state,work),/must be received/i);
  assignRequirementSource(state,work,'req-1',{sourceType:'stock',sourceId:'stock-1'});
  resumeWorkAfterParts(state,work);
  assert.equal(work.status,'In progress');
  assert.equal(work.blocker,'');
  assert.equal(work.workbenchHidden,false);
  assert.equal(state.items[0].status,'On bench');
});
