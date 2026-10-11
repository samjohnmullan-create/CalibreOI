import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const workflow=readFileSync('.github/workflows/pages.yml','utf8');

test('Pages injects build freshness guard',()=>{
  assert.match(workflow,/js\/build-refresh\.js/);
  assert.match(workflow,/build\.json/);
  assert.match(workflow,/GITHUB_SHA/);
});
