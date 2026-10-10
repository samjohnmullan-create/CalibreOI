import test from 'node:test';
import assert from 'node:assert/strict';
import { blankBenchMeasurements, setBenchMeasurement } from '../js/bench-measurements.js';
import { measurementSignals } from '../js/measurement-diagnostics.js';

test('structured bench measurements preserve numeric values and assessments',()=>{
  const job={};
  setBenchMeasurement(job,'balanceSideShakeMm','0.12');
  setBenchMeasurement(job,'balanceSideShakeAssessment','excessive');
  assert.equal(job.benchMeasurements.balanceSideShakeMm,0.12);
  assert.equal(job.benchMeasurements.balanceSideShakeAssessment,'excessive');
});

test('side shake only boosts diagnosis when explicitly assessed excessive',()=>{
  const uncertain={benchMeasurements:blankBenchMeasurements({balanceSideShakeMm:0.12,balanceSideShakeAssessment:'uncertain'})};
  assert.equal(measurementSignals(uncertain).some(s=>s.id==='balance_staff'),false);
  const excessive={benchMeasurements:blankBenchMeasurements({balanceSideShakeMm:0.12,balanceSideShakeAssessment:'excessive'})};
  assert.equal(measurementSignals(excessive).some(s=>s.id==='balance_staff'),true);
});

test('power reserve compares measured value with expected reserve',()=>{
  const job={benchMeasurements:blankBenchMeasurements({powerReserveHours:18,expectedPowerReserveHours:40})};
  const signal=measurementSignals(job).find(s=>s.id==='poor_power_reserve');
  assert.ok(signal);
  assert.match(signal.label,/18 h vs 40 h/);
});

test('structured positional spread feeds timing diagnosis',()=>{
  const job={benchMeasurements:blankBenchMeasurements({positionalSpreadSecDay:42})};
  assert.equal(measurementSignals(job).some(s=>s.id==='positional_variation'),true);
});
