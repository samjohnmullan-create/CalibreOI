import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('Capture Station supports Item and Work deep links plus upload queue',async()=>{
  const html=await readFile(new URL('../capture.html',import.meta.url),'utf8');
  assert.match(html,/params\.get\('item'\)/);
  assert.match(html,/params\.get\('work'\)/);
  assert.match(html,/listQueuedMediaUploads/);
  assert.match(html,/retryQueuedMediaUpload/);
  assert.match(html,/Drop an image here/);
});

test('Work workspace exposes Capture shortcut',async()=>{
  const source=await readFile(new URL('../js/work-ui-runtime.js',import.meta.url),'utf8');
  assert.match(source,/data-work-capture/);
  assert.match(source,/capture\.html\?/);
});
