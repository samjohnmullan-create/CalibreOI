import test from 'node:test';
import assert from 'node:assert/strict';
import { reconcileItemWorkPassportLinks, relationshipIntegrityReport } from '../js/item-work-passport-links.js';

function job(id, partial={}){
  return {
    id,
    jobId:`CCO-${id}`,
    jobType:'manual',
    status:'On bench',
    watchName:`Watch ${id}`,
    passport:{maker:'Test',model:id},
    business:{},
    createdAt:'2026-10-01T00:00:00.000Z',
    updatedAt:'2026-10-02T00:00:00.000Z',
    ...partial
  };
}

test('creates explicit Item and Work links for a legacy job',()=>{
  const state={jobs:[job('a1')],items:[],workRecords:[]};
  const result=reconcileItemWorkPassportLinks(state);
  const item=state.items[0],work=state.workRecords[0];

  assert.equal(result.createdItems,1);
  assert.equal(result.createdWorks,1);
  assert.equal(state.jobs[0].itemId,item.id);
  assert.equal(state.jobs[0].workId,'work-a1');
  assert.equal(work.id,'work-a1');
  assert.equal(work.itemId,item.id);
  assert.equal(work.legacyJobId,'a1');
  assert.deepEqual(item.workIds,['work-a1']);
  assert.equal(relationshipIntegrityReport(state).healthy,true);
});

test('relationship migration is idempotent',()=>{
  const state={jobs:[job('a1')],items:[],workRecords:[]};
  reconcileItemWorkPassportLinks(state);
  const snapshot=structuredClone(state);
  const second=reconcileItemWorkPassportLinks(state);

  assert.equal(second.createdItems,0);
  assert.equal(second.createdWorks,0);
  assert.equal(state.items.length,1);
  assert.equal(state.workRecords.length,1);
  assert.equal(state.jobs[0].workId,snapshot.jobs[0].workId);
  assert.equal(state.workRecords[0].id,snapshot.workRecords[0].id);
});

test('one Item can carry multiple historical Work records',()=>{
  const state={
    jobs:[job('a1',{itemId:'item-watch'}),job('a2',{itemId:'item-watch',jobId:'CCO-2002'})],
    items:[{id:'item-watch',type:'watch',purpose:'resale',title:'Shared watch',status:'Acquired',identity:{},commercial:{},preparation:{},research:[],mediaAssets:[],workIds:[],tags:[],watch:{passport:{},movement:{},timingHistory:[],serviceHistory:[],publicPassport:{}}}],
    workRecords:[]
  };
  reconcileItemWorkPassportLinks(state);

  assert.equal(state.items.length,1);
  assert.deepEqual(state.items[0].workIds.sort(),['work-a1','work-a2']);
  assert.equal(state.workRecords.length,2);
  assert.equal(state.workRecords.every(work=>work.itemId==='item-watch'),true);
  assert.equal(relationshipIntegrityReport(state).healthy,true);
});

test('existing Passport service history gains its canonical Work reference',()=>{
  const state={
    jobs:[job('a1',{itemId:'item-watch'})],
    items:[{id:'item-watch',type:'watch',purpose:'resale',title:'Watch',status:'Acquired',identity:{},commercial:{},preparation:{},research:[],mediaAssets:[],workIds:[],tags:[],watch:{passport:{maker:'Test'},movement:{},timingHistory:[],serviceHistory:[{jobId:'a1',jobNumber:'CCO-a1'}],publicPassport:{}}}],
    workRecords:[]
  };
  reconcileItemWorkPassportLinks(state);

  assert.equal(state.items[0].watch.serviceHistory[0].workId,'work-a1');
  assert.equal(relationshipIntegrityReport(state).healthy,true);
});

test('integrity report catches a Work linked to the wrong Item',()=>{
  const state={
    jobs:[job('a1',{itemId:'item-a',workId:'work-a1'})],
    items:[{id:'item-a',workIds:['work-a1']}],
    workRecords:[{id:'work-a1',itemId:'item-b',legacyJobId:'a1'}]
  };
  const report=relationshipIntegrityReport(state);
  assert.equal(report.healthy,false);
  assert.deepEqual(report.mismatchedWorks,['work-a1']);
  assert.deepEqual(report.brokenItemWorkIds,['item-a:work-a1']);
});
