import test from 'node:test';
import assert from 'node:assert/strict';
import {STORE_SCHEMA_VERSION,canonicalState,migratePersistedState} from '../js/store-base.js';

test('schema 4 purchase review migrates into canonical incoming',()=>{
  const old={schemaVersion:4,items:[],work:[],inventory:{parts:[],tools:[],consumables:[],donors:[]},compatibilityEvidence:[],knowledge:[],incoming:[{id:'incoming-1',itemName:'Confirmed'}],purchaseReview:[{id:'review-1',itemName:'Suggestion',status:'Suggested'}],ledger:[{id:'ledger-1',kind:'in',amount:100}]};
  const migrated=migratePersistedState(old);
  assert.equal(migrated.schemaVersion,STORE_SCHEMA_VERSION);
  assert.equal(Object.hasOwn(migrated,'purchaseReview'),false);
  assert.equal(migrated.incoming.find(x=>x.id==='review-1')?.recordType,'purchase-review');
  assert.equal(migrated.incoming.find(x=>x.id==='review-1')?.intakeClass,'suggestion');
  assert.equal(migrated.incoming.find(x=>x.id==='incoming-1')?.itemName,'Confirmed');
  assert.equal(migrated.ledger[0].id,'ledger-1');
});

test('purchase review compatibility view writes through canonical incoming',()=>{
  const state=canonicalState({schemaVersion:5,items:[],work:[],inventory:{parts:[],tools:[],consumables:[],donors:[]},compatibilityEvidence:[],knowledge:[],incoming:[],ledger:[]});
  state.purchaseReview.unshift({id:'review-new',itemName:'Watch lot',status:'Suggested'});
  assert.equal(state.incoming.find(x=>x.id==='review-new')?.recordType,'purchase-review');
  assert.equal(Object.keys(state).includes('purchaseReview'),false);
  state.purchaseReview[0]={...state.purchaseReview[0],status:'Accepted'};
  assert.equal(state.incoming.find(x=>x.id==='review-new')?.status,'Accepted');
});

test('ledger is intentional canonical state',()=>{
  const state=canonicalState({schemaVersion:5,items:[],work:[],inventory:{parts:[],tools:[],consumables:[],donors:[]},compatibilityEvidence:[],knowledge:[],incoming:[],ledger:[{id:'cash-1',kind:'out',amount:42}]});
  assert.deepEqual(state.ledger,[{id:'cash-1',kind:'out',amount:42}]);
  assert.equal(Object.keys(state).includes('ledger'),true);
});
