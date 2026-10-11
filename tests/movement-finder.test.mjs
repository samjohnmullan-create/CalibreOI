import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {listVerifiedMovements} from '../js/knowledge-engine.js';
import {rankMovementCatalog,scoreCatalogMovement,finderLabel} from '../js/movement-finder.js';
import {primaryHomeForPage,PRIMARY_NAV} from '../js/navigation-model.js';

function verifiedCatalog(){return listVerifiedMovements().map((m,index)=>({id:index+1,maker:m.maker,calibre:m.calibre,diameter:m.diameter,height:m.height,bph:m.bph,winding:m.movementType,sourceId:m.source}));}

test('Movement Finder keeps 18 rich verified movements as the offline fallback',()=>{
  const rows=verifiedCatalog();
  assert.equal(rows.length,18);
  assert.ok(rows.some(row=>row.maker==='AS'&&row.calibre==='1130'));
});

test('independent evidence ranks AS 1130 strongly in the offline scorer',()=>{
  const ranked=rankMovementCatalog(verifiedCatalog(),{maker:'AS',calibre:'1130',diameter:'29.4',bph:'18000',winding:'manual',jewels:'21'},10);
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

test('Movement Finder uses full server catalogue but still writes probable rather than confirmed candidates',()=>{
  const html=readFileSync(new URL('../movement-finder.html',import.meta.url),'utf8');
  assert.match(html,/3,458-calibre v25 catalogue/);
  assert.match(html,/rankMovementCatalogRemote/);
  assert.match(html,/Use as probable/);
  assert.match(html,/fieldConfidence\.calibre='Probable'/);
  assert.doesNotMatch(html,/fieldConfidence\.calibre='Confirmed'/);
  assert.match(html,/knowledgeId:m\.id/);
});
