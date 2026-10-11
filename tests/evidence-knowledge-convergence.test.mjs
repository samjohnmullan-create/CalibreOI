import test from 'node:test';
import assert from 'node:assert/strict';
import {STORE_SCHEMA_VERSION,canonicalState,migratePersistedState} from '../js/store-base.js';

test('schema 3 evidence and reference collections migrate to canonical records',()=>{
  const old={schemaVersion:3,items:[],work:[],incoming:[],ledger:[],purchaseReview:[],inventory:{parts:[],tools:[],consumables:[],donors:[]},compatibilityEvidence:[{id:'compat-existing',recordType:'external-test'}],knowledge:[{id:'knowledge-existing',recordType:'note'}],partFitEvidence:[{id:'fit-1',result:'verified',sourceType:'stock',sourceId:'part-1'}],referenceFacts:[{id:'ref-1',relation:'fits',calibre:'AS 1130',sourceUrl:'https://example.test/ref',confidence:95}],referenceDocuments:[{id:'doc-1',title:'Parts sheet',sourceUrl:'https://example.test/doc'}]};
  const migrated=migratePersistedState(old);
  assert.equal(migrated.schemaVersion,STORE_SCHEMA_VERSION);
  assert.equal(Object.hasOwn(migrated,'partFitEvidence'),false);
  assert.equal(Object.hasOwn(migrated,'referenceFacts'),false);
  assert.equal(Object.hasOwn(migrated,'referenceDocuments'),false);
  const bench=migrated.compatibilityEvidence.find(x=>x.id==='fit-1');
  assert.equal(bench.recordType,'bench-fit');
  assert.equal(bench.evidenceClass,'bench');
  assert.equal(bench.result,'verified');
  const fact=migrated.knowledge.find(x=>x.id==='ref-1');
  assert.equal(fact.recordType,'reference-fact');
  assert.equal(fact.evidenceClass,'external');
  assert.equal(fact.sourceUrl,'https://example.test/ref');
  assert.equal(fact.confidence,95);
  const doc=migrated.knowledge.find(x=>x.id==='doc-1');
  assert.equal(doc.recordType,'reference-document');
  assert.equal(doc.evidenceClass,'source-document');
});

test('canonical runtime exposes evidence and knowledge directly only',()=>{
  const state=canonicalState({schemaVersion:5,items:[],work:[],inventory:{parts:[],tools:[],consumables:[],donors:[]},compatibilityEvidence:[{id:'fit-1',recordType:'bench-fit'}],knowledge:[{id:'fact-1',recordType:'reference-fact'},{id:'doc-1',recordType:'reference-document'}],incoming:[],ledger:[]});
  assert.equal(state.compatibilityEvidence.length,1);
  assert.equal(state.knowledge.length,2);
  assert.equal('partFitEvidence' in state,false);
  assert.equal('referenceFacts' in state,false);
  assert.equal('referenceDocuments' in state,false);
});
