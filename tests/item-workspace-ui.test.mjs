import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const runtime=fs.readFileSync('js/item-ui-runtime.js','utf8');
const nav=fs.readFileSync('js/nav.js','utf8');

test('Item workspace is grouped into Work, Item and Commerce',()=>{
  assert.match(runtime,/Work:\['work','prep'\]/);
  assert.match(runtime,/Item:\['overview','identity','condition','research','record'\]/);
  assert.match(runtime,/Commerce:\['costs','sale'\]/);
});

test('Item workspace exposes permanent-record quick links',()=>{
  assert.match(runtime,/workbench\.html/);
  assert.match(runtime,/passport\.html\?id=/);
  assert.match(runtime,/capture\.html\?item=/);
});

test('Item workspace enhancements are isolated to item.html',()=>{
  assert.match(nav,/if\(here==='item\.html'\)/);
  assert.match(nav,/item-workspace\.css/);
  assert.match(nav,/item-ui-runtime\.js/);
});
