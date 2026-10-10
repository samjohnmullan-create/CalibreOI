import test from 'node:test';
import assert from 'node:assert/strict';
import { checklistValue, findChecklistStep } from '../js/checklist-response.js';

test('checklist tap toggles the selected value immediately',()=>{
  assert.equal(checklistValue('', 'yes'),'yes');
  assert.equal(checklistValue('yes','yes'),'');
  assert.equal(checklistValue('yes','no'),'no');
});

test('checklist step lookup resolves visible question text to stable step id',()=>{
  const defs=['First check',{id:'pivot',text:'Inspect balance pivot'}];
  assert.deepEqual(findChecklistStep(defs,'First check'),{step:{id:'0',text:'First check'},index:0});
  assert.equal(findChecklistStep(defs,'Inspect balance pivot').step.id,'pivot');
  assert.equal(findChecklistStep(defs,'Missing'),null);
});
