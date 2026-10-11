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

test('Core rejects retired workRecords after migration boundary',()=>{
  const state=createCoreState();
  state.workRecords=[];
  const report=validateCoreState(state);
  assert.equal(report.healthy,false);
  assert.match(report.errors.join('\n'),/workRecords/);
});

test('Core rejects unknown top-level junk drawers',()=>{
  const state=createCoreState();
  state.randomFeatureBucket=[];
  assert.equal(validateCoreState(state).healthy,false);
});

test('schema 1 workRecords migrates through current schema',()=>{
  const old={schemaVersion:1,currentItemId:null,currentWorkId:null,items:[],workRecords:[{id:'work-old',itemId:'item-old'}],mediaAssets:[],inventory:{parts:[],tools:[],consumables:[],donors:[]},compatibilityEvidence:[],incoming:[],knowledge:[],settings:{},updatedAt:'2026-10-11T00:00:00.000Z'};
  const migrated=migrateCoreState(old);
  assert.equal(migrated.schemaVersion,CURRENT_SCHEMA_VERSION);
  assert.deepEqual(migrated.work,old.workRecords);
  assert.equal('workRecords' in migrated,false);
});

test('schema 2 tools and partsStock migrate into canonical inventory',()=>{
  const old={schemaVersion:2,currentItemId:null,currentWorkId:null,items:[],work:[],mediaAssets:[],inventory:{parts:[{id:'part-existing',name:'Existing'}],tools:[],consumables:[],donors:[]},partsStock:[{id:'part-legacy',name:'Legacy part'}],tools:[{id:'tool-legacy',name:'Legacy tool'}],compatibilityEvidence:[],incoming:[],knowledge:[],settings:{},updatedAt:'2026-10-11T00:00:00.000Z'};
  const migrated=migrateCoreState(old);
  assert.equal(migrated.schemaVersion,CURRENT_SCHEMA_VERSION);
  assert.deepEqual(migrated.inventory.parts.map(x=>x.id),['part-existing','part-legacy']);
  assert.deepEqual(migrated.inventory.tools.map(x=>x.id),['tool-legacy']);
  assert.equal('partsStock' in migrated,false);
  assert.equal('tools' in migrated,false);
});

test('current schema remains stable through migration',()=>{
  const state=createCoreState();
  assert.deepEqual(migrateCoreState(state),state);
});

test('navigation remains intentionally small',()=>{
  assert.deepEqual(PRIMARY_NAV.map(x=>x.label),['Home','Items','Workbench','Business','Calibre']);
  assert.deepEqual(ITEM_AREAS.map(x=>x.label),['Work','Item','Commerce']);
  assert.deepEqual(sectionsForItem('watch').work,['Diagnosis','Service','Measurements','Timing','Parts','QC']);
});
