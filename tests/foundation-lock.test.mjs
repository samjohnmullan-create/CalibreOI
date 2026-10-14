import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const storeSource=readFileSync(new URL('../js/store-base.js',import.meta.url),'utf8');
const roadmap=readFileSync(new URL('../ROADMAP.md',import.meta.url),'utf8');
const architecture=readFileSync(new URL('../ARCHITECTURE.md',import.meta.url),'utf8');
const status=readFileSync(new URL('../STATUS.md',import.meta.url),'utf8');
const lockDoc=readFileSync(new URL('../docs/FOUNDATION-LOCK.md',import.meta.url),'utf8');

function canonicalStateBody(source){const start=source.indexOf('export function canonicalState');assert.notEqual(start,-1,'canonicalState must exist');const end=source.indexOf('export async function loadState',start);assert.notEqual(end,-1,'canonicalState boundary must remain inspectable');return source.slice(start,end);}

test('stable Core rules live in Architecture while Roadmap contains future work only',()=>{
  assert.match(roadmap,/future work only/i);
  assert.match(architecture,/# Canonical Core object model\n/);
  assert.match(architecture,/`js\/core\.js`/);
  assert.doesNotMatch(architecture,/Canonical Core v2/i);
  assert.doesNotMatch(architecture,/`js\/core-v2\.js`/);
});

test('array-backed canonical store collections cannot grow silently',()=>{const body=canonicalStateBody(storeSource);const found=[...body.matchAll(/Array\.isArray\(state\.([A-Za-z0-9_]+)\)/g)].map(match=>match[1]).sort();const expected=['compatibilityEvidence','incoming','items','knowledge','ledger','work'].sort();assert.deepEqual(found,expected,'Update the Core/migration plan before adding another top-level persisted collection');});

test('Foundation Lock is complete through FL-6',()=>{for(const phase of ['FL-2 — Work/store convergence — COMPLETE','FL-3 — Inventory convergence — COMPLETE','FL-4 — Evidence/Knowledge convergence — COMPLETE','FL-5 — Business/intake ownership — COMPLETE','FL-6 — runtime/design cleanup — COMPLETE'])assert.match(lockDoc,new RegExp(phase.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));assert.match(lockDoc,/schema 6/i);});

test('runtime compatibility proxy scaffolding is retired',()=>{assert.doesNotMatch(storeSource,/attachCompatibilityAliases/);assert.doesNotMatch(storeSource,/typedAlias\(/);const body=canonicalStateBody(storeSource);for(const legacy of ['partsStock','partFitEvidence','referenceFacts','referenceDocuments','purchaseReview','workshopAssets'])assert.doesNotMatch(body,new RegExp(`Object\\.defineProperty\\([^)]*${legacy}`));});

test('repo status records the shipped Foundation while Roadmap keeps final cleanup ahead of intelligence work',()=>{
  assert.match(status,/no normal-runtime `state\.jobs` architecture/i);
  assert.match(status,/test-gated deployment/i);
  const foundationIndex=roadmap.indexOf('## Phase 1 — Foundation Lock finalisation');
  const acquisitionIndex=roadmap.indexOf('## Phase 4 — Acquisition Engine');
  assert.notEqual(foundationIndex,-1,'Roadmap must retain Foundation Lock finalisation work');
  assert.notEqual(acquisitionIndex,-1,'Roadmap must retain Acquisition Engine work');
  assert.ok(foundationIndex<acquisitionIndex,'Foundation cleanup must stay ahead of new intelligence work');
});
