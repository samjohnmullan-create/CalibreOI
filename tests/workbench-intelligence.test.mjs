import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {workbenchSuggestions} from '../js/workbench-intelligence.js';

function stateFor({calibre='AS 1130',status='In progress',blocker='',nextAction='',stages=[],timingRuns=[],partIds=[]}={}){
  const [maker,...calParts]=String(calibre).split(' '),cal=calParts.join(' ');
  return {items:[{id:'item-1',type:'watch',title:'Test watch',identity:{maker},watch:{passport:{movementMaker:maker,calibre:cal}}}],work:[{id:'work-1',itemId:'item-1',status,blocker,nextAction,stages,timingRuns,partIds}],knowledge:[],inventory:{parts:[],tools:[],consumables:[],donors:[],locations:[]}};
}

test('suggestions are derived without mutating Core state',()=>{
  const state=stateFor(),before=structuredClone(state),rows=workbenchSuggestions(state.work[0],state);
  assert.deepEqual(state,before);
  assert.ok(rows.length<=3);
});

test('missing movement identity prompts Movement Finder',()=>{
  const state=stateFor({calibre:''});state.items[0].watch.passport={};state.items[0].identity={};
  const rows=workbenchSuggestions(state.work[0],state);
  assert.equal(rows[0].id,'identify-movement');
  assert.match(rows[0].href,/movement-finder\.html/);
});

test('explicit blocker stays highest priority',()=>{
  const state=stateFor({blocker:'Waiting for balance staff',nextAction:'Source staff',status:'Waiting'});
  const rows=workbenchSuggestions(state.work[0],state);
  assert.equal(rows[0].id,'blocker');
  assert.match(rows[0].title,/Waiting for balance staff/);
});

test('parts wait surfaces sourced AS 1130 references',()=>{
  const state=stateFor({blocker:'Needs balance staff',status:'Waiting',partIds:['part-1']});
  const rows=workbenchSuggestions(state.work[0],state,3);
  const parts=rows.find(row=>row.id==='parts-reference');
  assert.ok(parts);
  assert.match(parts.why,/U2823|sourced reference/i);
  assert.match(parts.href,/suppliers\.html/);
});

test('watch without timing run gets a movement-aware baseline prompt',()=>{
  const state=stateFor();
  const rows=workbenchSuggestions(state.work[0],state,5);
  const timing=rows.find(row=>row.id==='baseline-timing');
  assert.ok(timing);
  assert.match(timing.why,/18000 BPH/);
  assert.match(timing.href,/timegrapher\.html/);
});

test('near-complete Work prompts final QC',()=>{
  const stages=[{complete:true},{complete:true},{complete:true},{complete:false}];
  const state=stateFor({stages,timingRuns:[{id:'run-1'}]});
  const rows=workbenchSuggestions(state.work[0],state,5);
  assert.ok(rows.some(row=>row.id==='final-qc'));
});

test('runtime is limited to Work and Workbench surfaces',()=>{
  const auto=readFileSync(new URL('../js/cloud-auto.js',import.meta.url),'utf8');
  const runtime=readFileSync(new URL('../js/workbench-intelligence-runtime.js',import.meta.url),'utf8');
  assert.match(auto,/\['work\.html','workbench\.html'\].*workbench-intelligence-runtime\.js/);
  assert.match(runtime,/WORKSHOP INTELLIGENCE/);
  assert.match(runtime,/Suggestions do not change records by themselves/);
});
