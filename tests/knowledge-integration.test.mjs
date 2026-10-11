import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {listVerifiedMovements,findMovementSpec,getTimegrapherDefaults,passportPatchForMovement,getPartReferences,getTechnicalDocuments,KNOWLEDGE_RULES} from '../js/knowledge-engine.js';

test('verified v25 movement pack is available through the stable engine API',()=>{
  assert.equal(listVerifiedMovements().length,18);
  assert.equal(findMovementSpec('AS','1130')?.bph,18000);
  assert.equal(findMovementSpec('Sellita','SW500')?.calibre,'7750');
});

test('Passport patch only proposes movement-owned fields',()=>{
  const patch=passportPatchForMovement('AS','1130');
  assert.equal(patch.movementMaker,'AS');
  assert.equal(patch.calibre,'1130');
  assert.equal(patch.movementLaunchYear,1955);
  assert.equal(Object.hasOwn(patch,'maker'),false);
  assert.equal(Object.hasOwn(patch,'year'),false);
});

test('Timegrapher never invents missing lift angle',()=>{
  const citizen=getTimegrapherDefaults('Citizen/Miyota','8200');
  assert.equal(citizen.bph,21600);
  assert.equal(citizen.liftAngle,null);
  assert.equal(KNOWLEDGE_RULES.neverInventLiftAngle,true);
});

test('exact and family part references stay distinguishable',()=>{
  const exact=getPartReferences('AS','1130');
  assert.ok(exact.some(p=>p.reference==='U2823'&&p.exact));
  const family=getPartReferences('Buren Watch Company','1000A');
  assert.ok(family.some(p=>p.reference==='U2490'&&!p.exact&&p.confidence==='family-reported'));
});

test('technical documents bind to matching calibre',()=>{
  const docs=getTechnicalDocuments('ETA','2824-2');
  assert.ok(docs.some(d=>d.provider==='Cousins UK'));
});

test('live pages load contextual knowledge UI without adding a destination',()=>{
  const auto=readFileSync(new URL('../js/cloud-auto.js',import.meta.url),'utf8');
  const runtime=readFileSync(new URL('../js/knowledge-ui-runtime.js',import.meta.url),'utf8');
  assert.match(auto,/knowledge-ui-runtime\.js/);
  assert.match(auto,/passport\.html/);
  assert.match(auto,/timegrapher\.html/);
  assert.match(runtime,/Fill missing movement fields/);
  assert.match(runtime,/lift angle not documented — left unchanged/);
  assert.match(runtime,/Family references still require physical verification/);
});
