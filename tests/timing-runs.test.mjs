import test from 'node:test';
import assert from 'node:assert/strict';
import {timingRunUsable,timingRuns,compareLatest,positionSummary} from '../js/timing-runs.js';

test('timing run requires reliable sample quality',()=>{
  assert.equal(timingRunUsable({ready:true,rateSecondsPerDay:4,bph:18000,samples:10,confidence:.60}),true);
  assert.equal(timingRunUsable({ready:true,rateSecondsPerDay:4,bph:18000,samples:9,confidence:.90}),false);
  assert.equal(timingRunUsable({ready:true,rateSecondsPerDay:4,bph:18000,samples:20,confidence:.59}),false);
});

test('latest comparison is chronological and preserves deltas',()=>{
  const work={timingRuns:[
    {ready:true,rateSecondsPerDay:12,bph:18000,samples:14,confidence:.8,beatErrorMs:.8,position:'Dial up',savedAt:'2026-10-10T10:00:00Z'},
    {ready:true,rateSecondsPerDay:3,bph:18000,samples:16,confidence:.9,beatErrorMs:.4,position:'Dial up',savedAt:'2026-10-11T10:00:00Z'}
  ]};
  assert.equal(timingRuns(work)[0].rateSecondsPerDay,3);
  const c=compareLatest(work);assert.equal(c.rateDelta,-9);assert.equal(c.beatErrorDelta,-.4);
});

test('position summary uses latest reliable run per position',()=>{
  const work={timingRuns:[
    {ready:true,rateSecondsPerDay:5,bph:21600,samples:12,confidence:.8,position:'Dial up',savedAt:'2026-10-11T10:00:00Z'},
    {ready:true,rateSecondsPerDay:-7,bph:21600,samples:12,confidence:.8,position:'Crown up',savedAt:'2026-10-11T09:00:00Z'},
    {ready:true,rateSecondsPerDay:99,bph:21600,samples:4,confidence:.2,position:'Dial up',savedAt:'2026-10-11T11:00:00Z'}
  ]};
  const rows=positionSummary(work);assert.equal(rows.length,2);assert.equal(rows.find(r=>r.position==='Dial up').rate,5);
});
