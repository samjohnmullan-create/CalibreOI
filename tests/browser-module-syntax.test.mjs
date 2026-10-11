import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';

const modules=[
  'js/build-refresh.js',
  'js/research-brief.js',
  'js/parts-intelligence.js',
  'js/qr-global-runtime.js',
  'js/workbench-runtime.js',
  'js/work-ui-runtime.js',
  'js/item-ui-runtime.js',
  'js/reference-intelligence.js',
  'js/reference-ui-runtime.js'
];

for(const file of modules){
  test(`${file} parses as JavaScript`,()=>{
    const result=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
    assert.equal(result.status,0,result.stderr||result.stdout||`${file} failed syntax check`);
  });
}
