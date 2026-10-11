import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {loadMovementCatalog,MOVEMENT_CATALOG_COUNT} from '../js/movement-catalog-pack.js';
import {rankMovementCatalog,scoreCatalogMovement,finderLabel} from '../js/movement-finder.js';
import {primaryHomeForPage,PRIMARY_NAV} from '../js/navigation-model.js';

test('compressed v25 movement catalogue loads all records',async()=>{
  const rows=await loadMovementCatalog();
  assert.equal(rows.length,3458);
  assert.equal(MOVEMENT_CATALOG_COUNT,3458);
  assert.ok(rows.some(row=>row.maker==='AS'&&row.calibre==='1130'));
});

test('independent evidence ranks AS 1130 strongly',async()=>{
  const rows=await loadMovementCatalog();
  const ranked=rankMovementCatalog(rows,{maker:'AS',calibre:'1130',diameter:'29.4',bph:'18000',winding:'manual',jewels:'21'},10);
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

test('Movement Finder writes probable rather than confirmed candidates',()=>{
  const html=readFileSync(new URL('../movement-finder.html',import.meta.url),'utf8');
  assert.match(html,/Use as probable/);
  assert.match(html,/fieldConfidence\.calibre='Probable'/);
  assert.doesNotMatch(html,/fieldConfidence\.calibre='Confirmed'/);
});
