import test from 'node:test';
import assert from 'node:assert/strict';
import {createWork} from '../js/work-model.js';
import {workbenchEntries,mutateWorkbenchEntry} from '../js/workbench-model.js';

const item={id:'item-1',type:'watch',purpose:'resale',title:'Queue test',status:'Preparing',identity:{},condition:'',research:[],preparation:{},mediaAssets:[],commercial:{},sale:{},workIds:[],tags:[],notes:'',watch:{passport:{},movement:{},timingHistory:[],serviceHistory:[],publicPassport:{}},createdAt:'2026-10-14T00:00:00.000Z',updatedAt:'2026-10-14T00:00:00.000Z'};

test('new Planned Work starts in the queue by default',()=>{
  const work=createWork({id:'work-1',itemId:item.id,title:'Service',status:'Planned',createdAt:'2026-10-14T00:00:00.000Z'});
  const state={items:[item],work:[work]};
  assert.equal(work.workbenchHidden,true);
  const entry=workbenchEntries(state)[0];
  assert.equal(entry.queued,true);
  assert.equal(entry.group,'Queue');
});

test('Add to bench deliberately starts queued Planned Work',()=>{
  const work=createWork({id:'work-1',itemId:item.id,title:'Service',status:'Planned',createdAt:'2026-10-14T00:00:00.000Z'});
  const state={items:[item],work:[work]};
  let entry=workbenchEntries(state)[0];
  assert.equal(mutateWorkbenchEntry(state,entry,'bench'),true);
  assert.equal(work.workbenchHidden,false);
  assert.equal(work.status,'In progress');
  entry=workbenchEntries(state)[0];
  assert.equal(entry.queued,false);
  assert.equal(entry.group,'On bench');
});

test('Queue parks In progress Work without deleting it',()=>{
  const work=createWork({id:'work-1',itemId:item.id,title:'Service',status:'In progress',createdAt:'2026-10-14T00:00:00.000Z'});
  const state={items:[item],work:[work]};
  const entry=workbenchEntries(state)[0];
  assert.equal(mutateWorkbenchEntry(state,entry,'bench'),true);
  assert.equal(work.workbenchHidden,true);
  assert.equal(work.status,'Planned');
  assert.equal(state.work.length,1);
  assert.equal(workbenchEntries(state)[0].group,'Queue');
});

test('explicit queue override is preserved during normalisation',()=>{
  const activePlanned=createWork({id:'work-1',itemId:item.id,status:'Planned',workbenchHidden:false});
  assert.equal(activePlanned.workbenchHidden,false);
});
