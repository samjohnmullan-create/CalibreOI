import test from 'node:test';
import assert from 'node:assert/strict';
import {STORE_SCHEMA_VERSION,canonicalState,migratePersistedState} from '../js/store-base.js';

test('schema 2 partsStock and tools migrate into canonical inventory',()=>{
  const old={schemaVersion:2,items:[],work:[],incoming:[],ledger:[],purchaseReview:[],partFitEvidence:[],referenceFacts:[],referenceDocuments:[],inventory:{parts:[{id:'part-1',name:'Existing part'}],tools:[],consumables:[{id:'oil-1'}],donors:[]},partsStock:[{id:'part-1',name:'Duplicate part'},{id:'part-2',name:'Legacy part'}],tools:[{id:'tool-1',name:'Staking set'}]};
  const migrated=migratePersistedState(old);
  assert.equal(migrated.schemaVersion,STORE_SCHEMA_VERSION);
  assert.deepEqual(migrated.inventory.parts.map(x=>x.id),['part-1','part-2']);
  assert.deepEqual(migrated.inventory.tools.map(x=>x.id),['tool-1']);
  assert.deepEqual(migrated.inventory.consumables.map(x=>x.id),['oil-1']);
  assert.equal(Object.hasOwn(migrated,'partsStock'),false);
  assert.equal(Object.hasOwn(migrated,'tools'),false);
});

test('canonical runtime exposes inventory only through inventory',()=>{
  const state=canonicalState({schemaVersion:5,items:[],work:[],incoming:[],ledger:[],compatibilityEvidence:[],knowledge:[],inventory:{parts:[{id:'part-1'}],tools:[{id:'tool-1'}],consumables:[],donors:[]}});
  assert.deepEqual(state.inventory.tools.map(x=>x.id),['tool-1']);
  assert.deepEqual(state.inventory.parts.map(x=>x.id),['part-1']);
  assert.equal('tools' in state,false);
  assert.equal('partsStock' in state,false);
});
