import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('visibility runtime exposes recent workshop tools from Home and Calibre',async()=>{
  const src=await readFile('js/visibility-ui-runtime.js','utf8');
  for(const phrase of ['Workshop tools','Parts intelligence','Reference Library','Capture station','Timing'])assert.match(src,new RegExp(phrase));
  assert.match(src,/work\.html\?id=/);
  assert.match(src,/timegrapher\.html\?work=/);
  assert.match(src,/suppliers\.html\?work=/);
  assert.match(src,/capture\.html\?item=/);
  assert.match(src,/reference-library\.html/);
});

test('primary navigation loader keeps visibility runtime limited to Home and Calibre',async()=>{
  const nav=await readFile('js/nav.js','utf8');
  assert.match(nav,/\['index\.html','calibre\.html'\]\.includes\(here\)/);
  assert.match(nav,/visibility-ui-runtime\.js/);
});
