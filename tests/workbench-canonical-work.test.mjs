import test from 'node:test';
import assert from 'node:assert/strict';
import {workbenchEntries,mutateWorkbenchEntry} from '../js/workbench-model.js';

test('Workbench renders canonical Work and opens work.html',()=>{
  const state={
    items:[{id:'item-1',type:'watch',purpose:'resale',title:'Test Watch',status:'On bench',identity:{},commercial:{purchasePrice:'10',targetSale:'100'},workIds:['work-1'],mediaAssets:[],createdAt:'2026-10-01T00:00:00Z'}],
    work:[{id:'work-1',itemId:'item-1',title:'Full service',status:'In progress',nextAction:'Inspect train'}],
    jobs:[{id:'job-old',itemId:'item-1',watchName:'Legacy duplicate',status:'On bench'}]
  };
  const entries=workbenchEntries(state);
  assert.equal(entries.length,1);
  assert.equal(entries[0].kind,'work');
  assert.equal(entries[0].workId,'work-1');
  assert.equal(entries[0].nextAction,'Inspect train');
  assert.equal(entries[0].openHref,'work.html?id=work-1');
});

test('Workbench does not treat legacy Jobs as active records',()=>{
  const state={items:[],work:[],jobs:[{id:'job-old',watchName:'Old Job',status:'On bench'}]};
  assert.deepEqual(workbenchEntries(state),[]);
});

test('Workbench actions mutate Work only',()=>{
  const state={work:[{id:'work-1',itemId:'item-1',status:'In progress'}],jobs:[{id:'job-old',status:'On bench'}]};
  const entry={kind:'work',sourceId:'work-1',workId:'work-1'};
  assert.equal(mutateWorkbenchEntry(state,entry,'wait'),true);
  assert.equal(state.work[0].status,'Waiting');
  assert.equal(state.work[0].blocker,'Waiting on parts');
  assert.equal(state.jobs[0].status,'On bench');
});
