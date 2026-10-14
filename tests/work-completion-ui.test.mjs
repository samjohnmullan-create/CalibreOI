import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const runtime=readFileSync(new URL('../js/work-ui-runtime.js',import.meta.url),'utf8');
const nav=readFileSync(new URL('../js/nav.js',import.meta.url),'utf8');

test('Work runtime guards both Complete button and Complete-through-Save',()=>{
  assert.match(runtime,/workCompletionReadiness/);
  assert.match(runtime,/completeButton\.addEventListener\('click'/);
  assert.match(runtime,/statusSelect\.value!==['"]Complete['"]/);
  assert.match(runtime,/Cannot complete:/);
  assert.match(runtime,/Cannot save as Complete:/);
});

test('Work completion runtime is cache-busted and Parts runtime refreshes too',()=>{
  assert.match(nav,/work-ui-runtime\.js\?v=2/);
  assert.match(nav,/parts-ui-runtime\.js\?v=2/);
});
