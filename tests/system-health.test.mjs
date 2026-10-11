import test from 'node:test';
import assert from 'node:assert/strict';
import {stateHealth} from '../js/system-health.js';

function base(){return {schemaVersion:6,currentItemId:'i1',currentWorkId:'w1',items:[{id:'i1'}],work:[{id:'w1',itemId:'i1'}],mediaAssets:[{id:'m1',itemId:'i1',workId:'w1',storageKey:'private/m1.jpg'}],inventory:{parts:[],tools:[],consumables:[],donors:[],locations:[]},knowledge:[],incoming:[],ledger:[]};}

test('healthy state reports canonical Item Work and Media',()=>{const health=stateHealth(base());assert.equal(health.healthy,true);assert.equal(health.counts.items,1);assert.equal(health.counts.work,1);assert.equal(health.counts.media,1);assert.equal(health.schemaCurrent,true);});

test('orphan Work records are reported',()=>{const state=base();state.work[0].itemId='missing';const health=stateHealth(state);assert.equal(health.healthy,false);assert.deepEqual(health.orphanWork,['w1']);});

test('orphan MediaAsset ownership is reported',()=>{const state=base();state.mediaAssets[0].itemId='missing';const health=stateHealth(state);assert.equal(health.healthy,false);assert.deepEqual(health.orphanMedia,['m1']);});

test('media assets without a storage reference are reported',()=>{const state=base();state.mediaAssets[0]={id:'m1',itemId:'i1'};const health=stateHealth(state);assert.equal(health.healthy,false);assert.deepEqual(health.invalidMedia,['m1']);});

test('stale current selections are unhealthy',()=>{const state=base();state.currentWorkId='missing';const health=stateHealth(state);assert.equal(health.healthy,false);assert.equal(health.currentWorkMissing,true);});
