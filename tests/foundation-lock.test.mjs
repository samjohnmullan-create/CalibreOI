import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const storeSource=readFileSync(new URL('../js/store-base.js',import.meta.url),'utf8');
const roadmap=readFileSync(new URL('../ROADMAP.md',import.meta.url),'utf8');
const lockDoc=readFileSync(new URL('../docs/FOUNDATION-LOCK.md',import.meta.url),'utf8');

function canonicalStateBody(source){
  const start=source.indexOf('export function canonicalState');
  assert.notEqual(start,-1,'canonicalState must exist');
  const end=source.indexOf('export async function loadState',start);
  assert.notEqual(end,-1,'canonicalState boundary must remain inspectable');
  return source.slice(start,end);
}

test('roadmap describes one canonical Core rather than a Core generation',()=>{
  assert.match(roadmap,/## Canonical Core\n/);
  assert.doesNotMatch(roadmap,/## Canonical Core v2/);
  assert.doesNotMatch(roadmap,/`js\/core-v2\.js`/);
  assert.match(roadmap,/`js\/core\.js`/);
});

test('transitional array-backed store collections cannot grow silently',()=>{
  const body=canonicalStateBody(storeSource);
  const found=[...body.matchAll(/Array\.isArray\(state\.([A-Za-z0-9_]+)\)/g)].map(match=>match[1]).sort();
  const expected=[
    'incoming',
    'items',
    'ledger',
    'partFitEvidence',
    'partsStock',
    'purchaseReview',
    'referenceDocuments',
    'referenceFacts',
    'tools',
    'workRecords'
  ].sort();
  assert.deepEqual(found,expected,'Update the Core/migration plan before adding another top-level persisted collection');
});

test('every transitional store collection is named in Foundation Lock documentation',()=>{
  for(const field of ['workRecords','ledger','tools','partsStock','purchaseReview','partFitEvidence','referenceFacts','referenceDocuments']){
    assert.match(lockDoc,new RegExp('`'+field+'`'),`${field} must remain documented until migrated`);
  }
});
