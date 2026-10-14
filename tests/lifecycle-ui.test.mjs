import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const workUi=await readFile(new URL('../js/work-ui-runtime.js',import.meta.url),'utf8');
const itemUi=await readFile(new URL('../js/item-ui-runtime.js',import.meta.url),'utf8');

test('Work danger action cancels rather than deleting history',()=>{
  assert.match(workUi,/Cancel work/);
  assert.match(workUi,/cancelWork\(state,workId/);
  assert.match(workUi,/stopImmediatePropagation\(\)/);
  assert.doesNotMatch(workUi,/state\.work\.splice/);
});

test('Item workspace exposes explicit donor-spares disposition',()=>{
  assert.match(itemUi,/Move to donor\/spares/);
  assert.match(itemUi,/writeOffItemToDonor\(state,itemId/);
  assert.match(itemUi,/Active Work will be cancelled, but all history will be kept/);
});
