import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';

const modules=[
  'js/build-refresh.js',
  'js/research-brief.js',
  'js/parts-intelligence.js',
  'js/parts-ui-runtime.js',
  'js/knowledge-parts.js',
  'js/device-experience.js',
  'js/hardware.js',
  'js/global-command.js',
  'js/movement-finder-query.js',
  'js/qr-global-runtime.js',
  'js/qr-labels-runtime.js',
  'js/workbench-runtime.js',
  'js/work-ui-runtime.js',
  'js/item-ui-runtime.js',
  'js/reference-intelligence.js',
  'js/reference-import.js',
  'js/reference-library.js',
  'js/reference-library-ui.js',
  'js/reference-pdf-import.js',
  'js/reference-ocr.js',
  'js/reference-pdf-ui-runtime.js',
  'js/reference-ui-runtime.js',
  'js/visibility-ui-runtime.js',
  'js/timing-runs.js',
  'js/timegrapher-audit-runtime.js',
  'js/knowledge-learning.js',
  'js/knowledge-learning-ui.js',
  'js/knowledge-admin-prefill.js'
];

for(const file of modules){
  test(`${file} parses as JavaScript`,()=>{
    const result=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
    assert.equal(result.status,0,result.stderr||result.stdout||`${file} failed syntax check`);
  });
}
