import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const storeSource=readFileSync(new URL('../js/store-base.js',import.meta.url),'utf8');
const roadmap=readFileSync(new URL('../ROADMAP.md',import.meta.url),'utf8');
const lockDoc=readFileSync(new URL('../docs/FOUNDATION-LOCK.md',import.meta.url),'utf8');

function canonicalStateBody(source){const start=source.indexOf('export function canonicalState');assert.notEqual(start,-1,'canonicalState must exist');const end=source.indexOf('export async function loadState',start);assert.notEqual(end,-1,'canonicalState boundary must remain inspectable');return source.slice(start,end);}

test('roadmap describes one canonical Core rather than a Core generation',()=>{assert.match(roadmap,/## Canonical Core\n/);assert.doesNotMatch(roadmap,/## Canonical Core v2/);assert.doesNotMatch(roadmap,/`js\/core-v2\.js`/);assert.match(roadmap,/`js\/core\.js`/);});

test('array-backed canonical store collections cannot grow silently',()=>{const body=canonicalStateBody(storeSource);const found=[...body.matchAll(/Array\.isArray\(state\.([A-Za-z0-9_]+)\)/g)].map(match=>match[1]).sort();const expected=['compatibilityEvidence','incoming','items','knowledge','ledger','work'].sort();assert.deepEqual(found,expected,'Update the Core/migration plan before adding another top-level persisted collection');});

test('Foundation Lock is complete through FL-6',()=>{for(const phase of ['FL-2 — Work/store convergence — COMPLETE','FL-3 — Inventory convergence — COMPLETE','FL-4 — Evidence/Knowledge convergence — COMPLETE','FL-5 — Business/intake ownership — COMPLETE','FL-6 — runtime/design cleanup — COMPLETE'])assert.match(lockDoc,new RegExp(phase.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));assert.match(lockDoc,/schema 5/i);});

test('runtime compatibility proxy scaffolding is retired',()=>{assert.doesNotMatch(storeSource,/attachCompatibilityAliases/);assert.doesNotMatch(storeSource,/typedAlias\(/);const body=canonicalStateBody(storeSource);for(const legacy of ['partsStock','partFitEvidence','referenceFacts','referenceDocuments','purchaseReview'])assert.doesNotMatch(body,new RegExp(`Object\\.defineProperty\\([^)]*${legacy}`));});

test('roadmap marks Foundation Lock complete before intelligence work',()=>{assert.match(roadmap,/Foundation Lock[^\n]*COMPLETE/i);});
