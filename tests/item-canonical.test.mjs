import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { allItems, normaliseItem, blankItem } from '../js/item-model.js';

test('Item collection is explicit and never derived from legacy Jobs',()=>{
  const state={
    items:[blankItem({id:'item-1',type:'watch',title:'Canonical watch'})],
    jobs:[{id:'job-1',watchName:'Ghost job',status:'On bench',passport:{maker:'Legacy'}}]
  };
  const items=allItems(state);
  assert.equal(items.length,1);
  assert.equal(items[0].id,'item-1');
  assert.equal(items[0].title,'Canonical watch');
});

test('Item normalisation strips legacy Job ownership fields',()=>{
  const item=normaliseItem({
    id:'item-1',type:'watch',title:'Watch',legacyJobId:'job-1',
    watch:{specialistJobId:'job-1',passport:{maker:'Test'}}
  });
  assert.equal('legacyJobId' in item,false);
  assert.equal('specialistJobId' in item.watch,false);
  assert.equal(item.watch.passport.maker,'Test');
});

test('canonical save path does not invoke Job reconciliation',()=>{
  const source=fs.readFileSync(new URL('../js/store-writeoff.js',import.meta.url),'utf8');
  assert.doesNotMatch(source,/reconcileWriteOffs\(state\)/);
  assert.doesNotMatch(source,/reconcileMediaOwnership\(state\)/);
  assert.doesNotMatch(source,/reconcileServiceHistory\(state\)/);
  assert.match(source,/Legacy Job reconciliation is import tooling only/);
});

test('fast local state validity is based on Item and Work',()=>{
  const source=fs.readFileSync(new URL('../js/store-local-fast.js',import.meta.url),'utf8');
  assert.match(source,/Array\.isArray\(state\.items\)/);
  assert.match(source,/Array\.isArray\(state\.work\)/);
  assert.doesNotMatch(source,/Array\.isArray\(state\.jobs\)\)return state/);
});
