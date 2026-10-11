import test from 'node:test';
import assert from 'node:assert/strict';
import {blankItem,allItems} from '../js/item-model.js';
import {captureRoleConfig,captureTargets,captureAttachment} from '../js/capture-model.js';

test('capture roles map to media categories',()=>{
  assert.deepEqual(captureRoleConfig('hallmark'),['hallmark','Hallmark','identity']);
  assert.deepEqual(captureRoleConfig('fault'),['fault','Fault / damage','workshop']);
});

test('capture targets include active work for explicit Items',()=>{
  const item=blankItem({id:'item-1',title:'Test watch',type:'watch'});
  const state={items:[item],jobs:[],workRecords:[{id:'work-1',itemId:'item-1',title:'Crystal replacement',status:'In progress'},{id:'work-2',itemId:'item-1',title:'Old clean',status:'Complete'}]};
  const targets=captureTargets(state,allItems);
  assert.equal(targets.length,1);
  assert.equal(targets[0].works.length,1);
  assert.equal(targets[0].works[0].id,'work-1');
});

test('capture attaches media to explicit Item',()=>{
  const item=blankItem({id:'item-1',title:'Brooch'}),state={items:[item],jobs:[],workRecords:[]};
  assert.equal(captureAttachment({state,itemId:'item-1',asset:{id:'media-1',role:'hallmark'}}),true);
  assert.equal(state.items[0].mediaAssets[0].role,'hallmark');
});

test('legacy Jobs are not capture targets or media owners',()=>{
  const state={items:[],jobs:[{id:'job-1',watchName:'Legacy watch',passport:{},business:{}}],workRecords:[]};
  assert.equal(captureTargets(state,allItems).length,0);
  assert.equal(captureAttachment({state,itemId:'item-job-1',asset:{id:'media-2',role:'movement'}}),false);
  assert.equal(state.jobs[0].mediaAssets,undefined);
});
