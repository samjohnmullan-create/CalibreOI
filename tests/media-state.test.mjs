import test from 'node:test';
import assert from 'node:assert/strict';
import { reconcileMediaOwnership, itemMedia, workMedia } from '../js/media-state.js';

test('job media is attached to the permanent linked Item on save reconciliation',()=>{
  const state={
    jobs:[{id:'watch-1',jobId:'JOB-1',jobType:'watch',itemId:'item-1',watchName:'Test watch',passport:{},mediaAssets:[{id:'m1',storageKey:'u/watch-1/identity/a.jpg',category:'identity'}]}],
    items:[{id:'item-1',type:'watch',title:'Test watch',identity:{},commercial:{},preparation:{},sale:{},research:[],tags:[],workIds:[],mediaAssets:[],watch:{}}]
  };
  const result=reconcileMediaOwnership(state);
  assert.equal(result.changed,true);
  assert.equal(state.jobs[0].mediaAssets[0].itemId,'item-1');
  assert.equal(state.jobs[0].mediaAssets[0].legacyWatchId,'watch-1');
  assert.equal(state.items[0].mediaAssets.length,1);
  assert.equal(state.items[0].mediaAssets[0].itemId,'item-1');
});

test('reconciliation is idempotent and does not duplicate Item media',()=>{
  const state={
    jobs:[{id:'watch-1',jobId:'JOB-1',jobType:'watch',itemId:'item-1',watchName:'Test watch',passport:{},mediaAssets:[{id:'m1',storageKey:'a.jpg',category:'identity'}]}],
    items:[{id:'item-1',type:'watch',title:'Test watch',identity:{},commercial:{},preparation:{},sale:{},research:[],tags:[],workIds:[],mediaAssets:[],watch:{}}]
  };
  reconcileMediaOwnership(state);
  reconcileMediaOwnership(state);
  assert.equal(state.items[0].mediaAssets.length,1);
});

test('unlinked legacy job gets a stable Item before media is attached',()=>{
  const state={jobs:[{id:'legacy-7',jobId:'JOB-7',jobType:'watch',watchName:'Legacy watch',passport:{},mediaAssets:[{id:'m7',storageKey:'x.jpg'}]}],items:[]};
  reconcileMediaOwnership(state);
  assert.equal(state.jobs[0].itemId,'item-legacy-7');
  assert.equal(state.items.length,1);
  assert.equal(state.items[0].mediaAssets[0].itemId,'item-legacy-7');
});

test('Item and Work media queries use the canonical Item media library',()=>{
  const state={items:[
    {id:'item-1',mediaAssets:[{id:'a',itemId:'item-1',workId:'work-1',storageKey:'a.jpg'},{id:'b',itemId:'item-1',workId:'',storageKey:'b.jpg'}]},
    {id:'item-2',mediaAssets:[{id:'c',itemId:'item-2',workId:'work-2',storageKey:'c.jpg'}]}
  ]};
  assert.deepEqual(itemMedia(state,'item-1').map(x=>x.id),['a','b']);
  assert.deepEqual(workMedia(state,'work-2').map(x=>x.id),['c']);
});
