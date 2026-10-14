import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const source=await readFile(new URL('../js/store-workbench-queue.js',import.meta.url),'utf8');

test('Item page compatibility aliases are non-persisted views',()=>{
  assert.match(source,/Object\.defineProperty\(item,key,\{configurable:true,enumerable:false/);
  assert.match(source,/for\(const item of state\.items\)normaliseItemCompatibility\(item\)/);
  assert.doesNotMatch(source,/syncItemAliases/);
});

test('persisted Item alias copies are folded into canonical owners before save',()=>{
  for(const key of ['passport','photos','business','offers','channel','watchName']){
    assert.match(source,new RegExp(`['\"]${key}['\"]`));
  }
  assert.match(source,/item\.watch\.passport/);
  assert.match(source,/item\.commercial/);
  assert.match(source,/item\.sale/);
});
