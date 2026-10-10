import test from 'node:test';
import assert from 'node:assert/strict';
import { measurementSignals, measurementBoostForFault } from '../js/measurement-diagnostics.js';
import { diagnosticIntelligence } from '../js/diagnostic-intelligence.js';

test('high beat error creates timing evidence',()=>{
  const job={timingRuns:[{beatError:1.4,rate:6,confidence:92}]};
  const signals=measurementSignals(job);
  assert.ok(signals.some(s=>s.id==='beat_error'));
});

test('positional spread creates positional variation evidence',()=>{
  const job={timingRuns:[{position:'DU',rate:4},{position:'CD',rate:39}]};
  const signals=measurementSignals(job);
  assert.ok(signals.some(s=>s.id==='positional_variation'));
});

test('wobble note strengthens balance staff hypothesis',()=>{
  const job={stages:[{name:'Balance & beat',measure:'Noticeable balance wobble / side shake'}]};
  const result=measurementBoostForFault({id:'balance_staff'},job);
  assert.ok(result.boost>0);
});

test('measurement evidence increases diagnostic score',()=>{
  const base={id:'j1',passport:{},diagnosticFaults:[{id:'beat_error',text:'Beat error',category:'Timing',status:'possible'}]};
  const measured={...base,timingRuns:[{beatError:1.5,confidence:95}]};
  const a=diagnosticIntelligence(base,{jobs:[base]})[0];
  const b=diagnosticIntelligence(measured,{jobs:[measured]})[0];
  assert.ok(b.score>a.score);
  assert.ok(b.measurement.signals.length>0);
});
