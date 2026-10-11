import test from 'node:test';
import assert from 'node:assert/strict';
import {createCoreState,createItem,createWork,validateCoreState} from '../js/core-v2.js';
import {PRIMARY_NAV,ITEM_AREAS,sectionsForItem} from '../js/navigation-model.js';

test('Core v2 links Work directly to Item without legacy Job fields',()=>{
  const item=createItem({id:'item-1',type:'watch',title:'Test watch'});
  const work=createWork({id:'work-1',itemId:item.id,type:'service',title:'Full service'});
  item.workIds=[work.id];
  const state=createCoreState({items:[item],work:[work]});
  const report=validateCoreState(state);
  assert.equal(report.healthy,true);
  assert.equal('jobs' in state,false);
  assert.equal('legacyJobId' in item,false);
  assert.equal('jobId' in work,false);
});

test('Core v2 integrity rejects orphan Work',()=>{
  const state=createCoreState({items:[],work:[createWork({id:'work-x',itemId:'missing'})]});
  assert.equal(validateCoreState(state).healthy,false);
});

test('navigation is limited to five primary destinations',()=>{
  assert.deepEqual(PRIMARY_NAV.map(x=>x.label),['Home','Items','Workbench','Business','Calibre']);
  assert.deepEqual(ITEM_AREAS.map(x=>x.label),['Work','Item','Commerce']);
});

test('watch workspace sections have one clear home',()=>{
  const sections=sectionsForItem('watch');
  assert.deepEqual(sections.work,['Diagnosis','Service','Measurements','Timing','Parts','QC']);
  assert.deepEqual(sections.item,['Identity','Passport','Research','Media','History','Documents']);
  assert.deepEqual(sections.commerce,['Costs','Valuation','Listing','Sale']);
});
