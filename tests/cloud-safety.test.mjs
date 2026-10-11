import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const cloud=readFileSync(new URL('../js/cloud.js',import.meta.url),'utf8');
const store=readFileSync(new URL('../js/store-cloud-core.js',import.meta.url),'utf8');

test('normal cloud writes refuse unseen remote changes',()=>{assert.match(cloud,/CALIBRE_SYNC_CONFLICT/);assert.match(cloud,/seenCloudAt\(\)/);assert.match(cloud,/stamp\(remoteAt\)>stamp\(seenAt\)/);assert.match(cloud,/writeCloudState\(state,\{force=false\}/);});

test('explicit cloud operations create recovery snapshots',()=>{assert.match(store,/pre-cloud-pull/);assert.match(store,/pre-cloud-push/);assert.match(store,/writeCloudState\(state,\{force:true\}\)/);});

test('normal saves retain local data when cloud push fails',()=>{assert.match(store,/local save kept/);assert.match(store,/conflict:err\?\.code==='CALIBRE_SYNC_CONFLICT'/);assert.match(store,/await putLocal\('state',state\);return state/);});
