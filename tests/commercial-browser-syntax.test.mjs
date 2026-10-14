import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const root=new URL('../',import.meta.url);
function checkFile(relative){
  const file=new URL(relative,root);
  const result=spawnSync(process.execPath,['--check',file.pathname],{encoding:'utf8'});
  assert.equal(result.status,0,`${relative} failed syntax check:\n${result.stderr||result.stdout}`);
}

test('Commercial browser modules parse as ES modules',()=>{
  for(const file of ['js/sale-workspace.js','js/listing-pack.js','js/channel-strategy.js','js/sale-readiness-runtime.js','js/publish-controls.js','js/square-storefront-runtime.js','js/sold-public-sync.js'])checkFile(file);
});

test('Inline Sale workspace module parses',()=>{
  const html=fs.readFileSync(new URL('sales.html',root),'utf8');
  const blocks=[...html.matchAll(/<script\s+type=["']module["'](?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map(match=>match[1]).filter(code=>code.trim());
  assert.equal(blocks.length,1,'Expected one inline module script in sales.html');
  const temp=path.join(os.tmpdir(),`calibre-sales-${process.pid}.mjs`);
  fs.writeFileSync(temp,blocks[0]);
  try{
    const result=spawnSync(process.execPath,['--check',temp],{encoding:'utf8'});
    assert.equal(result.status,0,`sales.html inline module failed syntax check:\n${result.stderr||result.stdout}`);
  }finally{fs.rmSync(temp,{force:true});}
});
