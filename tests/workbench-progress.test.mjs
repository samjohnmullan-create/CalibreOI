import test from 'node:test';
import assert from 'node:assert/strict';
import {workbenchEntries} from '../js/workbench-model.js';

test('Workbench exposes current Work stage and completion progress',()=>{
  const state={
    items:[{id:'item-1',type:'watch',title:'Test Watch',status:'On bench',commercial:{},mediaAssets:[]}],
    work:[{
      id:'work-1',itemId:'item-1',type:'service',title:'Full service',status:'Waiting',stageIndex:1,
      stages:[
        {name:'Intake',complete:true},
        {name:'Dismantling & inspection',complete:false},
        {name:'Final QC',complete:false}
      ],
      blocker:'Waiting on balance staff',partIds:['part-1']
    }]
  };
  const [entry]=workbenchEntries(state);
  assert.equal(entry.stageName,'Dismantling & inspection');
  assert.equal(entry.doneStages,1);
  assert.equal(entry.stageCount,3);
  assert.equal(entry.progressPct,33);
  assert.equal(entry.needsParts,true);
});
