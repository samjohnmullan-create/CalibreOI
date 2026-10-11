import test from 'node:test';
import assert from 'node:assert/strict';
import {CURRENT_SCHEMA_VERSION,createCoreState,createItem,createWork,createMediaAsset,migrateCoreState,validateCoreState} from '../js/core.js';
import {PRIMARY_NAV,ITEM_AREAS,sectionsForItem} from '../js/navigation-model.js';

test('Core has one schema contract and no legacy Job fields',()=>{
  const item=createItem({id:'item-1',type:'watch',title:'Test watch'});
  const work=createWork({id:'work-1',itemId:item.id,type:'service',title:'Full service'});
  const media=createMediaAsset({id:'media-1',itemId:item.id,workId:work.id});
  item.workIds=[work.id];
  item.mediaAssetIds=[media.id];
  const state=createCoreState({items:[item],work:[work],mediaAssets:[media],currentItemId:item.id,currentWorkId:work.id});
  assert.equal(state.schemaVersion,CURRENT_SCHEMA_VERSION);
  assert.equal(validateCoreState(state).healthy,true);
  assert.equal('jobs' in state,false);
});

test('Core rejects legacy fields anywhere in state',()=>{
  const state=createCoreState();
  state.items.push({id:'item-x',legacyJobId:'job-x'});
  const report=validateCoreState(state);
  assert.equal(report.healthy,false);
  assert.match(report.errors.join('\n'),/Forbidden legacy field/);
});

test('Core rejects unknown top-level junk drawers',()=>{
  const state=createCoreState();
  state.randomFeatureBucket=[];
  assert.equal(validateCoreState(state).healthy,false);
});

test('schema migration is separate from Core generation',()=>{
  const state=createCoreState();
  assert.deepEqual(migrateCoreState(state),state);
});

test('navigation remains intentionally small',()=>{
  assert.deepEqual(PRIMARY_NAV.map(x=>x.label),['Home','Items','Workbench','Business','Calibre']);
  assert.deepEqual(ITEM_AREAS.map(x=>x.label),['Work','Item','Commerce']);
  assert.deepEqual(sectionsForItem('watch').work,['Diagnosis','Service','Measurements','Timing','Parts','QC']);
});
