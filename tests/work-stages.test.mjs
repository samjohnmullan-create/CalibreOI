import test from 'node:test';
import assert from 'node:assert/strict';
import {workStagePath,ensureWorkStages} from '../js/work-stages.js';

test('mechanical service gets the full workshop stage path',()=>{
  const work={type:'service',decision:'',stages:[]};
  const item={type:'watch',title:'Manual watch',watch:{passport:{movementType:'Manual'}}};
  const path=workStagePath(work,item);
  assert.equal(path[0],'Intake');
  assert.ok(path.includes('Dismantling & inspection'));
  assert.ok(path.includes('Reassembly & lubrication'));
  assert.equal(path.at(-1),'Final QC');
});

test('automatic evidence adds Automatic works',()=>{
  const path=workStagePath({type:'service'},{type:'watch',watch:{passport:{movementType:'Automatic'}}});
  assert.ok(path.includes('Automatic works'));
});

test('existing stage checks survive path normalisation',()=>{
  const work={type:'service',stageIndex:0,stages:[{name:'Intake',checks:{runs:'yes'},notes:'Runs on arrival'}]};
  const item={type:'watch',watch:{passport:{movementType:'Manual'}}};
  ensureWorkStages(work,item);
  assert.equal(work.stages[0].name,'Intake');
  assert.equal(work.stages[0].checks.runs,'yes');
  assert.equal(work.stages[0].notes,'Runs on arrival');
});

test('regulate-only decision creates a short focused path',()=>{
  const path=workStagePath({type:'service',decision:'Regulate only'},{type:'watch'});
  assert.deepEqual(path,['Intake','Pre-service timing','Regulation','Final QC']);
});
