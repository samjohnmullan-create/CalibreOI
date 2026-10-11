import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {primaryHomeForPage,CALIBRE_SECTIONS} from '../js/navigation-model.js';

const html=readFileSync(new URL('../knowledge-admin.html',import.meta.url),'utf8');

test('Knowledge Editor stays under Calibre navigation',()=>{
  assert.equal(primaryHomeForPage('knowledge-admin.html'),'calibre');
  assert.ok(CALIBRE_SECTIONS.some(section=>section.id==='knowledge-editor'));
});

test('Knowledge Editor uses draft-review-apply workflow',()=>{
  assert.match(html,/Save ready for review/);
  assert.match(html,/Save draft/);
  assert.match(html,/calibre_apply_knowledge_submission/);
  assert.match(html,/Nothing enters shared Knowledge until Apply is pressed/);
  assert.match(html,/confirmed/);
  assert.match(html,/supported/);
  assert.match(html,/candidate/);
});

test('Knowledge Editor supports the curated record types',()=>{
  for(const value of ['source','family','calibre','part','part_link','compatibility'])assert.match(html,new RegExp(`value="${value}"`));
});

test('Knowledge Editor inline module parses as JavaScript',()=>{
  const match=html.match(/<script type="module">([\s\S]*?)<\/script><\/body>/);
  assert.ok(match,'module script should be present');
  const result=spawnSync(process.execPath,['--check','--input-type=module'],{input:match[1],encoding:'utf8'});
  assert.equal(result.status,0,result.stderr||result.stdout||'knowledge editor module failed syntax check');
});
