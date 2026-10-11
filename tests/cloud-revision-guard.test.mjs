import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const cloud=readFileSync(new URL('../js/cloud.js',import.meta.url),'utf8');
const auto=readFileSync(new URL('../js/cloud-auto.js',import.meta.url),'utf8');
const store=readFileSync(new URL('../js/store-cloud-core.js',import.meta.url),'utf8');

test('cloud writes use the atomic revision RPC rather than direct upsert',()=>{
  assert.match(cloud,/CLOUD_REVISION_KEY/);
  assert.match(cloud,/rpc\('calibre_write_state'/);
  assert.doesNotMatch(cloud,/\.from\("calibre_state"\)\.upsert/);
  assert.match(cloud,/expected_revision:expectedRevision/);
});

test('cloud reads and seen markers carry revision',()=>{
  assert.match(cloud,/select\("data,updated_at,revision"\)/);
  assert.match(cloud,/seenCloudRevision/);
  assert.match(store,/markCloudSeen\(cloud\.updatedAt,cloud\.revision\)/);
});

test('automatic purchase review stays in canonical incoming',()=>{
  assert.match(auto,/state\.incoming/);
  assert.match(auto,/recordType:'purchase-review'/);
  assert.doesNotMatch(auto,/state\.purchaseReview/);
});
