import test from 'node:test';
import assert from 'node:assert/strict';
import {timingLockState,diagnoseTimingSignal,calibrationSummary,beatTracePoints} from '../js/timegrapher-diagnostics.js';

test('lock requires reliable sample count and confidence',()=>{
  assert.notEqual(timingLockState({ready:true,samples:9,confidence:.9}).key,'locked');
  assert.notEqual(timingLockState({ready:true,samples:12,confidence:.59}).key,'locked');
  assert.equal(timingLockState({ready:true,samples:12,confidence:.75}).key,'locked');
});

test('idle state is explicit',()=>{
  assert.equal(timingLockState({stage:'Idle'}).key,'idle');
});

test('clipping signal recommends lower gain',()=>{
  const diag=diagnoseTimingSignal({clipping:true,strength:20,crest:8},{},true);
  assert.equal(diag.key,'clipping');
  assert.match(diag.action,/Lower gain/i);
});

test('weak calibration recommends high gain',()=>{
  const levels=Array.from({length:20},()=>({strength:1.2,crest:2.5,clipping:false,handling:false}));
  const summary=calibrationSummary(levels,3,8);
  assert.equal(summary.recommendedGain,'high');
});

test('clipped calibration recommends low gain',()=>{
  const levels=Array.from({length:20},(_,i)=>({strength:9,crest:4,clipping:i<5,handling:false}));
  const summary=calibrationSummary(levels,30,8);
  assert.equal(summary.recommendedGain,'low');
});

test('beat trace tolerates a missed beat multiple',()=>{
  const nominal=3600/18000;
  const beats=[{t:0},{t:nominal},{t:nominal*2},{t:nominal*4},{t:nominal*5}];
  const points=beatTracePoints(beats,18000,100);
  assert.equal(points.length,4);
  assert.equal(points.some(p=>p.multiple===2),true);
  assert.equal(points.every(p=>Number.isFinite(p.phaseMs)),true);
});
