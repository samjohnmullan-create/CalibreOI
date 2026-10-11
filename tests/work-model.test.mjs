import test from 'node:test';
import assert from 'node:assert/strict';
import {createWork,normaliseWork,currentWork} from '../js/work-model.js';

test('canonical Work owns workshop evidence fields',()=>{
  const work=createWork({id:'work-1',itemId:'item-1',type:'service',diagnosis:'Dry train',faults:[{text:'Dry'}],stages:[{name:'Inspect'}],measurements:[{name:'endshake'}],partIds:['part-1'],timingRuns:[{rate:5}],repairPerformed:'Cleaned',decision:'Service',finalQC:{passed:true},nextAction:'Regulate',blocker:''});
  assert.equal(work.id,'work-1');
  assert.equal(work.diagnosis,'Dry train');
  assert.equal(work.faults.length,1);
  assert.equal(work.stages.length,1);
  assert.equal(work.measurements.length,1);
  assert.deepEqual(work.partIds,['part-1']);
  assert.equal(work.timingRuns.length,1);
  assert.equal(work.repairPerformed,'Cleaned');
  assert.equal(work.decision,'Service');
  assert.equal(work.finalQC.passed,true);
  assert.equal(work.nextAction,'Regulate');
});

test('legacy Work aliases normalise into canonical fields',()=>{
  const work=normaliseWork({id:'work-2',itemId:'item-1',findings:'Wobble',workPerformed:'Staff replaced',labourMinutes:45});
  assert.equal(work.diagnosis,'Wobble');
  assert.equal(work.repairPerformed,'Staff replaced');
  assert.equal(work.labour.minutes,45);
});

test('currentWork resolves explicit work route before stored current work',()=>{
  const state={currentWorkId:'work-old',work:[{id:'work-old',itemId:'item-1'},{id:'work-new',itemId:'item-1'}]};
  const loc={search:'?work=work-new'};
  assert.equal(currentWork(state,loc).id,'work-new');
});
