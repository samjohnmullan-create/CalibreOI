import test from 'node:test';
import assert from 'node:assert/strict';
import { workbenchEntries, mutateWorkbenchEntry } from '../js/workbench-model.js';

function state(){
  return {
    items:[{
      id:'item-1',type:'jewellery',purpose:'resale',title:'Silver brooch',status:'Preparing',identity:{},condition:'',research:[],preparation:{},mediaAssets:[],commercial:{purchasePrice:'20',targetSale:'80',acquiredAt:new Date().toISOString()},sale:{},workIds:['work-1'],tags:[],notes:'',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()
    }],
    work:[{id:'work-1',itemId:'item-1',type:'cleaning',title:'Clean and polish',status:'In progress',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}],
    jobs:[{id:'job-1',jobId:'C-001',watchName:'Vintage watch',status:'Awaiting parts',parts:[{name:'Crystal',received:false}],business:{purchasePrice:'40',targetSale:'160'},createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}]
  };
}

test('Workbench includes canonical Work records only',()=>{
  const rows=workbenchEntries(state());
  assert.equal(rows.length,1);
  const work=rows[0];
  assert.equal(work.kind,'work');
  assert.equal(work.title,'Silver brooch');
  assert.equal(work.group,'On bench');
  assert.equal(work.openHref,'work.html?id=work-1');
});

test('Workbench actions mutate the canonical Work record',()=>{
  const current=state();
  let rows=workbenchEntries(current);
  const work=rows[0];
  assert.equal(mutateWorkbenchEntry(current,work,'wait'),true);
  assert.equal(current.work[0].status,'Waiting');
  assert.equal(current.jobs[0].status,'Awaiting parts');
  rows=workbenchEntries(current);
  assert.equal(rows[0].group,'Waiting');
  assert.equal(mutateWorkbenchEntry(current,rows[0],'bench'),true);
  assert.equal(current.work[0].workbenchHidden,true);
});

test('migrated Job mirror is represented as canonical Work',()=>{
  const current=state();
  current.items.push({
    id:'item-watch',type:'watch',purpose:'resale',title:'Omega manual',status:'On bench',identity:{},condition:'',research:[],preparation:{},mediaAssets:[],commercial:{purchasePrice:'100',targetSale:'350'},sale:{},workIds:['work-job-2'],tags:[],notes:'',watch:{passport:{},movement:{},timingHistory:[],serviceHistory:[],publicPassport:{}},createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()
  });
  current.jobs.push({id:'job-2',workId:'work-job-2',itemId:'item-watch',jobId:'C-002',watchName:'Omega manual',status:'On bench',parts:[],business:{purchasePrice:'100',targetSale:'350'},createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()});
  current.work.push({id:'work-job-2',itemId:'item-watch',type:'service',title:'Service C-002',status:'In progress',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()});

  const rows=workbenchEntries(current);
  const omega=rows.filter(row=>row.itemId==='item-watch');
  assert.equal(omega.length,1);
  assert.equal(omega[0].kind,'work');
  assert.equal(omega[0].workId,'work-job-2');
  assert.equal(omega[0].key,'work:work-job-2');
  assert.equal(omega[0].openHref,'work.html?id=work-job-2');
});
