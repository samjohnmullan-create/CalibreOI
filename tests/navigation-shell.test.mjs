import test from 'node:test';
import assert from 'node:assert/strict';
import {PRIMARY_NAV,PAGE_HOME,primaryHomeForPage} from '../js/navigation-model.js';
import {pageName,primaryNavMarkup} from '../js/navigation-shell.js';

test('every primary destination is unique and stable',()=>{
  assert.equal(PRIMARY_NAV.length,5);
  assert.equal(new Set(PRIMARY_NAV.map(x=>x.id)).size,5);
  assert.deepEqual(PRIMARY_NAV.map(x=>x.label),['Home','Items','Workbench','Business','Calibre']);
});

test('existing routes have one canonical primary home',()=>{
  for(const [page,home] of Object.entries(PAGE_HOME)){
    assert.equal(PRIMARY_NAV.some(entry=>entry.id===home),true,`${page} has invalid home ${home}`);
  }
  assert.equal(primaryHomeForPage('passport.html'),'items');
  assert.equal(primaryHomeForPage('service.html'),'workbench');
  assert.equal(primaryHomeForPage('capture.html'),'calibre');
});

test('primary nav renders one active destination',()=>{
  const html=primaryNavMarkup('service.html');
  assert.equal((html.match(/aria-current="page"/g)||[]).length,1);
  assert.match(html,/data-nav-id="workbench"[^>]*><svg/);
  assert.match(html,/Workbench/);
});

test('pageName normalises paths',()=>{
  assert.equal(pageName('/CalibreOI/service.html'),'service.html');
  assert.equal(pageName('/CalibreOI/'),'index.html');
});
