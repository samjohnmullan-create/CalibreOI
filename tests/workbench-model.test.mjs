import test from 'node:test';
import assert from 'node:assert/strict';
import { workbenchEntries, mutateWorkbenchEntry } from '../js/workbench-model.js';

function state(){
  return {
    items:[{
      id:'item-1',type:'jewellery',purpose:'resale',title:'Silver brooch',status:'Preparing',identity:{},condition:'',research:[],preparation:{},mediaAssets:[],commercial:{purchasePrice:'20',targetSale:'80',acquiredAt:new Date().toISOString()},sale:{},workIds:['work-1'],tags:[],notes:'',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()
    }],
    workRecords:[{id:'work-1',itemId:'item-1',type:'cleaning',title:'Clean and polish',status:'In progress',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}],
    jobs:[{id:'job-1',jobId:'C-001',watchName:'Vintage watch',status:'Awaiting parts',parts:[{name:'Crystal',received:false}],business:{purchasePrice:'40',targetSale:'160'},createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}]
  };
}

test('Workbench includes explicit Work records and legacy watch jobs',()=>{
  const rows=workbenchEntries(state());
  assert.equal(rows.length,2);
  const work=rows.find(row=>row.kind==='work');
  const legacy=rows.find(row=>row.kind==='legacy-job');
  assert.equal(work.title,'Silver brooch');
  assert.equal(work.group,'On bench');
  assert.equal(work.openHref,'work.html?id=work-1');
  assert.equal(legacy.group,'Waiting');
  assert.match(legacy.blockers.join(' '),/outstanding/);
});

test('Workbench actions mutate the correct underlying record',()=>{
  const current=state();
  let rows=workbenchEntries(current);
  const work=rows.find(row=>row.kind==='work');
  assert.equal(mutateWorkbenchEntry(current,work,'wait'),true);
  assert.equal(current.workRecords[0].status,'Waiting');
  rows=workbenchEntries(current);
  assert.equal(rows.find(row=>row.kind==='work').group,'Waiting');
  assert.equal(mutateWorkbenchEntry(current,rows.find(row=>row.kind==='work'),'bench'),true);
  assert.equal(current.workRecords[0].workbenchHidden,true);
});

test('legacy Job mirror is represented once using its canonical Work ID',()=>{
  const current=state();
  current.items.push({
    id:'item-watch',type:'watch',purpose:'resale',title:'Omega manual',status:'On bench',identity:{},condition:'',research:[],preparation:{},mediaAssets:[],commercial:{purchasePrice:'100',targetSale:'350'},sale:{},workIds:['work-job-2'],tags:[],notes:'',watch:{passport:{},movement:{},timingHistory:[],serviceHistory:[],publicPassport:{}},createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()
  });
  current.jobs.push({id:'job-2',workId:'work-job-2',itemId:'item-watch',jobId:'C-002',watchName:'Omega manual',status:'On bench',parts:[],business:{purchasePrice:'100',targetSale:'350'},createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()});
  current.workRecords.push({id:'work-job-2',itemId:'item-watch',legacy:true,legacyJobId:'job-2',sourceJobId:'job-2',type:'service',title:'Service C-002',status:'In progress',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()});

  const rows=workbenchEntries(current);
  const omega=rows.filter(row=>row.itemId==='item-watch');
  assert.equal(omega.length,1);
  assert.equal(omega[0].kind,'legacy-job');
  assert.equal(omega[0].workId,'work-job-2');
  assert.equal(omega[0].key,'work:work-job-2');
  assert.equal(omega[0].openHref,'service.html?id=job-2');
});
