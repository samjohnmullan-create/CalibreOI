import test from 'node:test';
import assert from 'node:assert/strict';
import {itemIntegrityReport} from '../js/item-integrity.js';

test('healthy Item and Work state passes integrity',()=>{
  const state={items:[{id:'item-1'}],workRecords:[{id:'work-1',itemId:'item-1'}]};
  assert.deepEqual(itemIntegrityReport(state),{items:1,work:1,duplicateItemIds:[],duplicateWorkIds:[],orphanWork:[],healthy:true});
});

test('orphan Work is reported',()=>{
  const report=itemIntegrityReport({items:[{id:'item-1'}],workRecords:[{id:'work-1',itemId:'missing'}]});
  assert.deepEqual(report.orphanWork,['work-1']);
  assert.equal(report.healthy,false);
});

test('duplicate permanent IDs are rejected',()=>{
  const report=itemIntegrityReport({items:[{id:'item-1'},{id:'item-1'}],workRecords:[{id:'work-1',itemId:'item-1'},{id:'work-1',itemId:'item-1'}]});
  assert.deepEqual(report.duplicateItemIds,['item-1']);
  assert.deepEqual(report.duplicateWorkIds,['work-1']);
  assert.equal(report.healthy,false);
});
