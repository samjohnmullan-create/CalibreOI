import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const source=await readFile(new URL('../js/store-workbench-queue.js',import.meta.url),'utf8');

test('normal store runtime does not reconcile Jobs into canonical Work',()=>{
  assert.doesNotMatch(source,/item-work-passport-links/);
  assert.doesNotMatch(source,/ensureWorkForJob\s*\(/);
  assert.doesNotMatch(source,/reconcileItemWorkPassportLinks\s*\(/);
});

test('store declares canonical Work authoritative',()=>{
  assert.match(source,/Canonical Work is authoritative/);
});
