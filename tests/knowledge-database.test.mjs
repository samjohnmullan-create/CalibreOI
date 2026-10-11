import test from 'node:test';
import assert from 'node:assert/strict';
import {loadKnowledgeDatabase,knowledgeDatabaseStats,movementCatalog,getCalibreRecord,partReferencesForCalibreId,compatibilityForCalibreId,identificationSignalsForCalibreId,EXPECTED_COUNTS} from '../js/knowledge-database.js';

test('full v25 knowledge database passes integrity and table counts',async()=>{
  const db=await loadKnowledgeDatabase();
  const stats=await knowledgeDatabaseStats();
  assert.equal(db.calibres.length,3458);
  assert.equal(stats.compatibility_edges,9165);
  assert.equal(stats.calibre_part_refs,1172);
  assert.equal(stats.part_references,736);
  assert.equal(stats.sources,90);
  assert.equal(stats.identification_signals,65);
  assert.equal(stats.movement_specs,18);
  assert.equal(EXPECTED_COUNTS.calibres,3458);
});

test('full movement catalogue exposes all 3458 calibres',async()=>{
  const rows=await movementCatalog();
  assert.equal(rows.length,3458);
  assert.ok(rows.some(r=>r.maker==='ETA'&&r.calibre==='2390'));
});

test('calibre query joins rich specs, parts, signals and compatibility evidence',async()=>{
  const row=await getCalibreRecord('ETA','2824-2');
  assert.ok(row);
  const parts=await partReferencesForCalibreId(row.id);
  const signals=await identificationSignalsForCalibreId(row.id);
  const edges=await compatibilityForCalibreId(row.id);
  assert.ok(signals.length>0);
  assert.ok(edges.length>0);
  assert.ok(Array.isArray(parts));
  assert.ok(edges.some(e=>e.otherCalibre&&e.source));
});

test('knowledge database remains reference data outside canonical Core state',async()=>{
  const db=await loadKnowledgeDatabase();
  assert.ok(!('items' in db));
  assert.ok(!('work' in db));
  assert.ok(!('ledger' in db));
});
