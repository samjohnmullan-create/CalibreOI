import test from 'node:test';
import assert from 'node:assert/strict';
import {stripRetiredTopLevel} from '../js/persistence-boundary.js';

test('retired Job top-level fields are stripped once canonical records exist',()=>{
  const state={schemaVersion:6,items:[{id:'item-1'}],work:[],jobs:[{id:'job-1'}],currentId:'job-1'};
  const cleaned=stripRetiredTopLevel(state);
  assert.equal('jobs' in cleaned,false);
  assert.equal('currentId' in cleaned,false);
  assert.equal(cleaned.items[0].id,'item-1');
});

test('Job-only legacy state is never silently discarded',()=>{
  assert.throws(
    ()=>stripRetiredTopLevel({schemaVersion:1,items:[],work:[],jobs:[{id:'job-1'}],currentId:'job-1'}),
    /requires explicit migration/
  );
});
