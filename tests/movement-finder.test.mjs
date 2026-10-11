import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {movementCatalog} from '../js/knowledge-database.js';
import {rankMovementCatalog,scoreCatalogMovement,finderLabel} from '../js/movement-finder.js';
import {primaryHomeForPage,PRIMARY_NAV} from '../js/navigation-model.js';

test('Movement Finder uses the full v25 movement catalogue',async()=>{
  const rows=await movementCatalog();
  assert.equal(rows.length,3458);
  assert.ok(rows.some(row=>row.maker==='AS'&&row.calibre==='1130'));
});

test('independent evidence ranks AS 1130 strongly across full catalogue',async()=>{
  const ranked=rankMovementCatalog(await movementCatalog(),{maker:'AS',calibre:'1130',diameter:'29.4',bph:'18000',winding:'manual',jewels:'21'},10);
  assert.equal(ranked[0].movement.maker,'AS');
  assert.equal(ranked[0].movement.calibre,'1130');
  assert.ok(ranked[0].score>=90);
  assert.ok(ranked[0].evidence.includes('calibre marking exact'));
  assert.ok(ranked[0].evidence.includes('diameter ±0.15 mm'));
});

test('weak dimensional similarity is not presented as proof',()=>{
  const result=scoreCatalogMovement({diameter:'29.0'},{maker:'Example',calibre:'1',diameter:29.8});
  assert.ok(result.score<50);
  assert.equal(finderLabel(result.score),'Weak lead');
});

test('Movement Finder remains under Calibre primary navigation',()=>{
  assert.equal(PRIMARY_NAV.length,5);
  assert.equal(primaryHomeForPage('movement-finder.html'),'calibre');
});

test('full Finder runtime writes probable rather than confirmed candidates',()=>{
  const runtime=readFileSync(new URL('../js/movement-finder-full-runtime.js',import.meta.url),'utf8');
  const nav=readFileSync(new URL('../js/navigation-shell.js',import.meta.url),'utf8');
  assert.match(runtime,/Use as probable/);
  assert.match(runtime,/fieldConfidence\.calibre='Probable'/);
  assert.doesNotMatch(runtime,/fieldConfidence\.calibre='Confirmed'/);
  assert.match(runtime,/database:'v25-full'/);
  assert.match(nav,/movement-finder-full-runtime\.js/);
});
