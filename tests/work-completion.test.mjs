import test from 'node:test';
import assert from 'node:assert/strict';
import {workCompletionReadiness} from '../js/work-completion.js';
import {ensureWorkStages} from '../js/work-stages.js';
import {STAGE_COPY} from '../js/stages.js';

function setup(){
  const item={id:'item-1',type:'watch',purpose:'resale',title:'Test watch',status:'On bench',identity:{maker:'Test'},watch:{passport:{movementType:'manual'},movement:{type:'manual'}}};
  const work={id:'work-1',itemId:'item-1',type:'service',title:'Full service',status:'In progress',blocker:'',partIds:[],timingRuns:[],stages:[],stageIndex:0};
  ensureWorkStages(work,item);
  const qc=work.stages.find(stage=>stage.name==='Final QC');
  qc.checks=Object.fromEntries((STAGE_COPY['Final QC'].steps||[]).map(step=>[step.id,'yes']));
  qc.complete=true;
  work.timingRuns=[{ready:true,rateSecondsPerDay:5,bph:18000,beatErrorMs:0.4,samples:20,confidence:.9,savedAt:new Date().toISOString()}];
  return {state:{items:[item],work:[work],inventory:{parts:[]}},item,work,qc};
}

test('complete Work requires a passing Final QC stage',()=>{
  const {state,item,work}=setup();
  const result=workCompletionReadiness(work,state,item);
  assert.equal(result.ready,true);
  assert.deepEqual(result.issues,[]);
});

test('a failed or unanswered Final QC check blocks completion',()=>{
  const {state,item,work,qc}=setup();
  qc.checks.hands='no';
  let result=workCompletionReadiness(work,state,item);
  assert.equal(result.ready,false);
  assert.match(result.issues.join(' '),/hand alignment/i);
  qc.checks.hands='';
  result=workCompletionReadiness(work,state,item);
  assert.match(result.issues.join(' '),/unanswered/i);
});

test('Final QC must be explicitly marked complete',()=>{
  const {state,item,work,qc}=setup();
  qc.complete=false;
  const result=workCompletionReadiness(work,state,item);
  assert.equal(result.ready,false);
  assert.match(result.issues.join(' '),/not marked complete/i);
});

test('claiming final timing requires a usable saved timing run',()=>{
  const {state,item,work}=setup();
  work.timingRuns=[{ready:true,rateSecondsPerDay:5,bph:18000,samples:3,confidence:.2}];
  const result=workCompletionReadiness(work,state,item);
  assert.equal(result.ready,false);
  assert.match(result.issues.join(' '),/no usable timing run/i);
});

test('received but unfitted required parts block completion',()=>{
  const {state,item,work}=setup();
  work.partIds=['req-1'];
  state.inventory.parts.push({id:'req-1',name:'Balance staff',quantity:1,status:'received',workId:'work-1'});
  let result=workCompletionReadiness(work,state,item);
  assert.equal(result.ready,false);
  assert.match(result.issues.join(' '),/not fitted/i);
  state.inventory.parts[0].status='fitted';
  result=workCompletionReadiness(work,state,item);
  assert.equal(result.ready,true);
});

test('Waiting state and blockers must be cleared before completion',()=>{
  const {state,item,work}=setup();
  work.status='Waiting';work.blocker='Waiting on a crystal';
  const result=workCompletionReadiness(work,state,item);
  assert.equal(result.ready,false);
  assert.match(result.issues.join(' '),/still marked Waiting/i);
  assert.match(result.issues.join(' '),/Blocker remains/i);
});
