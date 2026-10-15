import test from 'node:test';
import assert from 'node:assert/strict';
import {deriveBenchExceptions,timingRegression} from '../js/bench-exceptions.js';

const timing=(phase,rate,beatError=.2,confidence=.9,recorded_at='2026-10-15T00:00:00Z')=>({phase,rate_seconds_per_day:rate,beat_error_ms:beatError,confidence_score:confidence,recorded_at});

test('timing regression only fires from reliable before/after evidence',()=>{
  const regression=timingRegression([
    timing('before_service',8,.2,.92,'2026-10-15T00:00:00Z'),
    timing('after_service',31,.8,.88,'2026-10-15T01:00:00Z')
  ]);
  assert.ok(regression);
  assert.match(regression.detail,/rate moved from/i);
  assert.match(regression.detail,/beat error increased/i);
  assert.equal(timingRegression([timing('before_service',8,.2,.92),timing('after_service',12,.3,.4)]),null,'low-confidence post-service evidence must not trigger');
});

test('open Part Needs and explicit blocker remain high-priority exceptions',()=>{
  const rows=deriveBenchExceptions({work:{blocker:'Balance jewel damaged'},item:{type:'watch'},steps:[],partNeeds:[{status:'open',part_type:'balance jewel'}],qcChecks:[],timing:[]});
  assert.equal(rows[0].code,'work-blocker');
  assert.ok(rows.some(x=>x.code==='part-needed'));
});

test('Bench only declares Final QC ready when pre-QC requirements and blockers are clear',()=>{
  const detail={
    work:{status:'on_bench',blocker:''},item:{type:'watch'},partNeeds:[],qcChecks:[],timing:[],
    steps:[
      {sequence:1,label:'Diagnosis',required:true,status:'done'},
      {sequence:2,label:'Reassembly',required:true,status:'done'},
      {sequence:3,label:'Final QC',section:'QC',required:true,status:'not_started'}
    ]
  };
  const rows=deriveBenchExceptions(detail);
  assert.ok(rows.some(x=>x.code==='ready-final-qc'));
  assert.ok(rows.some(x=>x.code==='final-timing-missing'));
  const blocked=deriveBenchExceptions({...detail,work:{status:'waiting',blocker:'Waiting on stem'}});
  assert.ok(!blocked.some(x=>x.code==='ready-final-qc'));
});

test('failed QC prevents ready-to-complete and is surfaced explicitly',()=>{
  const detail={
    work:{status:'qc',blocker:''},item:{type:'watch'},partNeeds:[],timing:[timing('final_test',4,.2,.9)],
    steps:[{sequence:1,label:'Final QC',section:'QC',required:true,status:'done'}],
    qcChecks:[{required:true,status:'failed',label:'Keyless works function'}]
  };
  const rows=deriveBenchExceptions(detail);
  assert.ok(rows.some(x=>x.code==='qc-failed'));
  assert.ok(!rows.some(x=>x.code==='ready-complete'));
});

test('all required steps and required QC can declare Work ready to complete',()=>{
  const rows=deriveBenchExceptions({
    work:{status:'qc',blocker:''},item:{type:'watch'},partNeeds:[],timing:[timing('final_test',5,.2,.9)],
    steps:[{sequence:1,label:'Final QC',section:'QC',required:true,status:'done'}],
    qcChecks:[{required:true,status:'passed',label:'Functions'}]
  });
  assert.ok(rows.some(x=>x.code==='ready-complete'));
});
