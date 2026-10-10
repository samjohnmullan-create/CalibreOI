import test from 'node:test';
import assert from 'node:assert/strict';
import { reconcileServiceHistory, serviceHistoryEntry } from '../js/service-history.js';

test('service history captures diagnostics measurements parts and timing',()=>{
  const job={id:'j1',jobId:'CAL-1',jobType:'watch',status:'Ready to list',updatedAt:'2026-10-11T00:00:00Z',benchMeasurements:{balanceEndshakeMm:.08,balanceEndshakeAssessment:'excessive'},diagnosticFaults:[{id:'balance_staff',text:'Balance staff fault',status:'confirmed'}],parts:[{part:'Balance staff',fitted:true,donorItemId:'donor-1'}],timingRuns:[{id:'t1',rate:8,beatError:.4}],repairPerformed:'Replaced balance staff',outcome:'Running well'};
  const e=serviceHistoryEntry(job);
  assert.equal(e.diagnostics[0].status,'confirmed');
  assert.equal(e.partsUsed[0].part,'Balance staff');
  assert.equal(e.benchMeasurements.balanceEndshakeMm,.08);
  assert.equal(e.timingRuns.length,1);
  assert.ok(e.completedAt);
});

test('reconciliation is idempotent per job',()=>{
  const job={id:'j1',jobId:'CAL-1',jobType:'watch',status:'On bench',passport:{maker:'Test'},diagnosticFaults:[],parts:[],timingRuns:[]};
  const state={jobs:[job],items:[]};
  reconcileServiceHistory(state);reconcileServiceHistory(state);
  assert.equal(state.items.length,1);
  assert.equal(state.items[0].watch.serviceHistory.length,1);
  assert.equal(state.items[0].watch.serviceHistory[0].jobId,'j1');
});

test('later job changes update the existing permanent history entry',()=>{
  const job={id:'j1',jobId:'CAL-1',jobType:'watch',status:'On bench',diagnosticFaults:[],parts:[],timingRuns:[]};
  const state={jobs:[job],items:[]};
  reconcileServiceHistory(state);
  job.status='Ready to list';job.repairPerformed='Cleaned and serviced';job.updatedAt='2026-10-11T01:00:00Z';
  reconcileServiceHistory(state);
  const history=state.items[0].watch.serviceHistory;
  assert.equal(history.length,1);
  assert.equal(history[0].status,'Ready to list');
  assert.equal(history[0].repairPerformed,'Cleaned and serviced');
  assert.ok(history[0].completedAt);
});
