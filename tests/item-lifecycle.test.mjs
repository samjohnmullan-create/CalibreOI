import test from 'node:test';
import assert from 'node:assert/strict';
import {cancelWork,writeOffItemToDonor} from '../js/item-lifecycle.js';
import {donorCompatibilityAlerts} from '../js/donor-intelligence.js';

const watch=(id,{purpose='resale',status='On bench',calibre='ETA 2391'}={})=>({
  id,
  type:'watch',
  purpose,
  status,
  title:id,
  tags:[],
  commercial:{saleChannel:'Not listed'},
  watch:{passport:{calibre,movementMaker:'ETA'}},
  updatedAt:'2026-10-01T00:00:00.000Z'
});
const work=(id,itemId,status='In progress')=>({
  id,itemId,status,title:id,blocker:'Bench work',nextAction:'Continue',outcome:'',completedAt:'',updatedAt:'2026-10-01T00:00:00.000Z'
});

test('cancelling Work preserves the record and removes it from active-work state',()=>{
  const state={items:[watch('item-1')],work:[work('work-1','item-1')],currentItemId:'item-1',currentWorkId:'work-1'};
  const result=cancelWork(state,'work-1',{at:'2026-10-14T09:00:00.000Z'});
  assert.equal(state.work.length,1,'Work history must not be deleted');
  assert.equal(result.work.status,'Cancelled');
  assert.equal(result.work.completedAt,'2026-10-14');
  assert.equal(result.work.blocker,'');
  assert.equal(state.currentWorkId,'');
  assert.equal(result.item.status,'Preparing','Item must not remain marked On bench after its last active Work is cancelled');
});

test('write-off converts an Item into owned donor/spares stock and closes active Work',()=>{
  const item=watch('item-1');
  item.commercial.saleChannel='eBay';
  item.commercial.listedAt='2026-10-10';
  const complete=work('work-complete','item-1','Complete');
  complete.completedAt='2026-10-12';
  const open=work('work-open','item-1','Waiting');
  const state={items:[item],work:[complete,open],currentItemId:'item-1',currentWorkId:'work-open'};
  const result=writeOffItemToDonor(state,'item-1',{at:'2026-10-14T09:00:00.000Z'});

  assert.equal(result.item.purpose,'donor');
  assert.equal(result.item.status,'Retained','donor stock must remain owned and visible to donor intelligence');
  assert.ok(result.item.tags.includes('donor'));
  assert.equal(result.item.commercial.saleChannel,'Not listed');
  assert.equal(result.item.commercial.listedAt,'');
  assert.deepEqual(result.closedWork,['work-open']);
  assert.equal(open.status,'Cancelled');
  assert.equal(open.completedAt,'2026-10-14');
  assert.equal(complete.status,'Complete','completed history must remain untouched');
  assert.equal(state.work.length,2,'write-off must preserve all Work records');
  assert.equal(state.currentWorkId,'');
});

test('written-off donor remains available to donor compatibility intelligence',()=>{
  const candidate=watch('candidate');
  const existing=watch('existing',{purpose:'donor',status:'Retained'});
  const state={items:[candidate,existing],work:[],currentItemId:'candidate',currentWorkId:''};
  writeOffItemToDonor(state,'candidate',{at:'2026-10-14T09:00:00.000Z'});
  const alerts=donorCompatibilityAlerts(state);
  assert.equal(alerts.length,1);
  assert.equal(alerts[0].kind,'same-calibre');
  assert.deepEqual(new Set([alerts[0].itemA.id,alerts[0].itemB.id]),new Set(['candidate','existing']));
});
