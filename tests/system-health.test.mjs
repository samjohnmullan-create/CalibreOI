import test from "node:test";
import assert from "node:assert/strict";
import { stateHealth } from "../js/system-health.js";

test("healthy state reports linked jobs and work",()=>{
  const state={itemModelVersion:1,jobs:[{id:"j1",itemId:"i1"}],items:[{id:"i1",mediaAssets:[]}],workRecords:[{id:"w1",itemId:"i1"}]};
  const health=stateHealth(state);
  assert.equal(health.healthy,true);
  assert.equal(health.counts.items,1);
  assert.equal(health.counts.work,1);
});

test("orphan work records are reported",()=>{
  const state={jobs:[],items:[{id:"i1",mediaAssets:[]}],workRecords:[{id:"w1",itemId:"missing"}]};
  const health=stateHealth(state);
  assert.equal(health.healthy,false);
  assert.deepEqual(health.orphanWork,["w1"]);
});

test("media assets without a storage reference are reported",()=>{
  const state={jobs:[],items:[{id:"i1",mediaAssets:[{id:"m1"}]}],workRecords:[]};
  const health=stateHealth(state);
  assert.equal(health.healthy,false);
  assert.deepEqual(health.invalidMedia,["m1"]);
});
