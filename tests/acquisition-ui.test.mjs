import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const root=new URL('../',import.meta.url),read=file=>fs.readFileSync(new URL(file,root),'utf8');
function parseInline(file){const html=read(file),blocks=[...html.matchAll(/<script\s+type=["']module["'](?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map(match=>match[1]).filter(code=>code.trim());for(const [index,code] of blocks.entries()){const temp=path.join(os.tmpdir(),`calibre-${path.basename(file)}-${process.pid}-${index}.mjs`);fs.writeFileSync(temp,code);try{const result=spawnSync(process.execPath,['--check',temp],{encoding:'utf8'});assert.equal(result.status,0,`${file} inline module failed syntax check:\n${result.stderr||result.stdout}`);}finally{fs.rmSync(temp,{force:true});}}}

test('Acquisition page lives under Business and uses canonical Incoming candidates',()=>{
  const nav=read('js/navigation-model.js'),html=read('acquisition.html');
  assert.match(nav,/'acquisition\.html':'business'/);
  assert.match(html,/acquisitionRecommendation/);
  assert.match(html,/convertAcquisitionToItem/);
  assert.match(html,/Business dashboard/);
  assert.doesNotMatch(html,/state\.jobs|job\.business|current\(state\)/);
});

test('Item Costs page uses Item commercial data rather than Job aliases',()=>{
  const html=read('business.html');
  assert.match(html,/item\.commercial/);
  assert.match(html,/itemEconomics/);
  assert.match(html,/acquisition\.html/);
  assert.doesNotMatch(html,/\bcurrent\(state\)|job\.business|window\.calibreMoney/);
});

test('Acquisition and Costs inline modules parse',()=>{parseInline('acquisition.html');parseInline('business.html');});

test('Acquisition engine and Business runtime parse as modules',()=>{
  for(const file of ['js/acquisition-engine.js','js/profit-intelligence.js','js/business-brain-runtime.js']){const result=spawnSync(process.execPath,['--check',new URL(file,root).pathname],{encoding:'utf8'});assert.equal(result.status,0,`${file} failed syntax check:\n${result.stderr||result.stdout}`);}
});
